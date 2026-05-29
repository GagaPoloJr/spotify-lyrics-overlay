// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod spotify;
mod history;

use std::sync::Arc;
use std::thread;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WebviewWindow,
};
use tauri_plugin_deep_link::DeepLinkExt;

fn extract_code(url: &str) -> Option<String> {
    let idx = url.find("code=")?;
    let tail = &url[idx + 5..];
    let code = tail.split('&').next().unwrap_or("").to_string();
    if code.is_empty() {
        None
    } else {
        Some(code)
    }
}

// Callback HTML page that auto-sends code to Tauri
const CALLBACK_HTML: &str = r#"<!DOCTYPE html>
<html>
<head>
  <title>Spotify Auth</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #121212; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .box { text-align: center; background: #1e1e1e; padding: 40px; border-radius: 12px; }
    .success { color: #1DB954; }
    .loading { color: #b3b3b3; }
  </style>
</head>
<body>
  <div class="box">
    <h1 class="success">Authorization Successful!</h1>
    <p class="loading">Sending code to app...</p>
    <p style="color: #666; font-size: 12px;">You can close this window.</p>
  </div>
  <script>
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    
    if (code) {
      // Send code to Tauri app via local server
      fetch('http://127.0.0.1:1421/callback?code=' + encodeURIComponent(code))
        .then(() => {
          document.querySelector('.loading').textContent = 'Code sent! Check your app.';
        })
        .catch(() => {
          document.querySelector('.loading').textContent = 'Code: ' + code;
        });
    } else if (error) {
      document.querySelector('h1').textContent = 'Error: ' + error;
      document.querySelector('h1').className = '';
      document.querySelector('.loading').textContent = '';
    }
  </script>
</body>
</html>"#;

fn main() {
    // Load .env file at startup
    dotenvy::dotenv().ok();

    // Start local HTTP server for OAuth callback
    let handle_for_server = Arc::new(std::sync::Mutex::new(None::<tauri::AppHandle>));

    let server_handle = handle_for_server.clone();
    thread::spawn(move || {
        let server = tiny_http::Server::http("127.0.0.1:1421").expect("Failed to start callback server");
        println!("[OAuth Server] Listening on http://127.0.0.1:1421");

        for request in server.incoming_requests() {
            let url = request.url();
            println!("[OAuth Server] Received request: {}", url);

            if url.starts_with("/callback") {
                // Extract code from query string
                if let Some(code) = extract_code(url) {
                    println!("[OAuth Server] Auth code received: {}", &code[..8.min(code.len())]);

                    // Emit event to Tauri frontend
                    if let Ok(guard) = server_handle.lock() {
                        if let Some(handle) = guard.as_ref() {
                            let _ = handle.emit("oauth-callback", &code);
                            println!("[OAuth Server] Event emitted to frontend");
                        }
                    }

                    // Respond with success page
                    let response = tiny_http::Response::from_string(
                        r#"<!DOCTYPE html><html><body style="background:#121212;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="color:#1DB954">Success!</h1><p>Code received. You can close this window.</p></div></body></html>"#
                    ).with_header(
                        tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap()
                    );
                    let _ = request.respond(response);
                } else {
                    // No code in request - serve the callback page
                    let response = tiny_http::Response::from_string(CALLBACK_HTML)
                        .with_header(
                            tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/html"[..]).unwrap()
                        );
                    let _ = request.respond(response);
                }
            } else {
                // Not a callback request
                let response = tiny_http::Response::from_string("Not Found")
                    .with_status_code(404);
                let _ = request.respond(response);
            }
        }
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            spotify::spotify_login,
            spotify::exchange_token,
            spotify::refresh_token,
            spotify::get_current_track,
            spotify::get_synced_lyrics,
            spotify::get_spotify_lyrics_token,
            spotify::get_user_product,
            spotify::spotify_play_pause,
            spotify::spotify_next,
            spotify::spotify_prev,
            history::save_lyrics_to_history_cmd,
            history::get_lyrics_from_history_cmd,
        ])
        .setup(move |app| {
            println!("[App] Initializing...");
            let handle = app.handle();

            // Store handle for OAuth server
            {
                let mut guard = handle_for_server.lock().unwrap();
                *guard = Some(handle.clone());
            }

            // Tray menu
            let show = MenuItem::with_id(app, "show", "Show Overlay", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide Overlay", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            win.show().unwrap();
                            win.set_focus().unwrap();
                        }
                    }
                    "hide" => {
                        if let Some(win) = app.get_webview_window("main") {
                            win.hide().unwrap();
                        }
                    }
                    "quit" => std::process::exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|_app, event| {
                    if let TrayIconEvent::Click { .. } = event {
                        println!("[Tray] Icon clicked");
                    }
                })
                .build(app)?;

            println!("[App] Tray icon initialized");

            // Load tokens at startup
            match spotify::load_tokens(&handle) {
                Ok(Some(tokens)) => {
                    println!("[App] Tokens found at startup, expires at: {}", tokens.expires_at);
                }
                Ok(None) => {
                    println!("[App] No tokens stored, user needs to login");
                }
                Err(e) => eprintln!("[App] Failed to load tokens: {}", e),
            }

            // Deep link handler - warm start
            handle.deep_link().on_open_url({
                let handle = handle.clone();
                move |event| {
                    for url in event.urls() {
                        let url_str = url.as_str();
                        println!("[DeepLink] Received: {}", url_str);

                        if let Some(code) = extract_code(url_str) {
                            println!("[DeepLink] Auth code: {}", &code[..8.min(code.len())]);
                            let _ = handle.emit("oauth-callback", code);
                        } else {
                            eprintln!("[DeepLink] No 'code=' found in callback URL");
                        }
                    }
                }
            });

            // Deep link handler - cold start
            if let Some(arg1) = std::env::args().nth(1) {
                if arg1.starts_with("haikal-spotify://") {
                    println!("[DeepLink] Cold start: {}", arg1);

                    if let Some(code) = extract_code(&arg1) {
                        println!("[DeepLink] Auth code (cold): {}", &code[..8.min(code.len())]);
                        let _ = handle.emit("oauth-callback", code);
                    } else {
                        eprintln!("[DeepLink] No 'code=' in cold start URL");
                    }
                }
            }

            // Window setup
            let window: WebviewWindow = app.get_webview_window("main").unwrap();
            window.set_always_on_top(true)?;
            window.set_decorations(false)?;
            window.set_resizable(true)?;

            #[cfg(target_os = "macos")]
            unsafe {
                use objc2_app_kit::{NSWindow, NSWindowCollectionBehavior};
                let ns_window: *mut NSWindow = window.ns_window().unwrap() as _;

                // Make window transparent
                (*ns_window).setOpaque(false);
                (*ns_window).setBackgroundColor(None);
                (*ns_window).setHasShadow(false);

                // Make window visible on all Spaces (Desktops)
                (*ns_window).setCollectionBehavior(
                    NSWindowCollectionBehavior::CanJoinAllSpaces
                    | NSWindowCollectionBehavior::Stationary
                    | NSWindowCollectionBehavior::FullScreenAuxiliary
                );

                println!("[Window] Configured for all macOS Spaces");
            }

            println!("[App] Initialization complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
