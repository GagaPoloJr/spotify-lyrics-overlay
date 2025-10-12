// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod spotify;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_deep_link::DeepLinkExt;

fn extract_code(url: &str) -> Option<String> {
    // cari "code=" lalu ambil sampai '&' berikutnya (kalau ada)
    let idx = url.find("code=")?;
    let tail = &url[idx + 5..];
    let code = tail.split('&').next().unwrap_or("").to_string();
    if code.is_empty() {
        None
    } else {
        Some(code)
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            spotify::spotify_login,
            spotify::exchange_token,
            spotify::get_current_track
        ])
        .setup(|app| {
            println!("🚀 Deep link plugin initialized");
            let handle = app.handle();

            // ✅ TRAY MENU (pakai API baru)
            let show = MenuItem::with_id(app, "show", "Tampilkan Overlay", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Sembunyikan Overlay", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Keluar", true, None::<&str>)?;
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
                        println!("🖱️ Tray icon clicked!");
                    }
                })
                .build(app)?;

            println!("🚀 Tray icon initialized");

            // ✅ coba load token saat startup
            match spotify::load_token(&handle) {
                Ok(Some(token)) => {
                    println!("✅ Token ditemukan saat startup: {}", token);
                }
                Ok(None) => {
                    println!("⚠️ Belum ada token tersimpan, user harus login dulu.");
                }
                Err(e) => eprintln!("❌ Gagal load token: {}", e),
            }

            // 1️⃣ App SUDAH terbuka → terima deep link via event
            handle.deep_link().on_open_url({
                let handle = handle.clone(); // ✅ clone agar bisa dipakai di closure safely
                move |event| {
                    for url in event.urls() {
                        let url_str = url.as_str();
                        println!("🎧 Deep link: {}", url_str);

                        if let Some(code) = extract_code(url_str) {
                            println!("🔑 Code: {}", &code);
                            match spotify::exchange_token(code.clone()) {
                                Ok(token) => {
                                    println!("✅ Access token: {}", token);
                                    if let Err(e) = spotify::save_token(&handle, &token) {
                                        eprintln!("⚠️ Gagal menyimpan token: {}", e);
                                    }
                                }
                                Err(e) => eprintln!("❌ Exchange failed: {}", e),
                            }
                        } else {
                            eprintln!("⚠️ Tidak menemukan query `code=` pada URL callback.");
                        }
                    }
                }
            });

            // 2️⃣ COLD START → app dibuka langsung lewat deep link
            if let Some(arg1) = std::env::args().nth(1) {
                if arg1.starts_with("haikal-spotify://") {
                    println!("🎧 Deep link (cold start): {}", arg1);

                    if let Some(code) = extract_code(&arg1) {
                        println!("🔑 Code (cold start): {}", &code);
                        match spotify::exchange_token(code.clone()) {
                            Ok(token) => {
                                println!("✅ Access token: {}", token);
                                if let Err(e) = spotify::save_token(&handle, &token) {
                                    eprintln!("⚠️ Gagal menyimpan token: {}", e);
                                }
                            }
                            Err(e) => eprintln!("❌ Exchange failed: {}", e),
                        }
                    } else {
                        eprintln!(
                            "⚠️ Tidak menemukan query `code=` pada URL callback (cold start)."
                        );
                    }
                }
            }

            // 🪟 atur window overlay
            let window: WebviewWindow = app.get_webview_window("main").unwrap();
            window.set_always_on_top(false)?;
            window.set_resizable(true)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
