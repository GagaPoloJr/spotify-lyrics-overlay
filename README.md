# Spotify OAuth2 Flow (dengan Refresh Token & Local Store)
+----------------------+
| User klik "Login"    |
+----------+-----------+
           |
           v
+----------------------+
| Tauri buka browser   |
| Spotify Auth URL     |
+----------+-----------+
           |
           v
+---------------------------+
| User authorize Spotify    |
| (login dan izin akses)    |
+----------+----------------+
           |
           v
+---------------------------------------------+
| Redirect ke Deep Link:                      |
| haikal-spotify://callback?code=AUTH_CODE    |
+---------------------------------------------+
           |
           v
+------------------------------------+
| Rust: exchange_token(code)         |
| 🔁 request ke Spotify API          |
| - dapat access_token (1 jam)       |
| - dapat refresh_token (permanent)  |
+------------------------------------+
           |
           v
+------------------------------------------------------+
| 💾 Simpan ke local config folder (aman, private):    |
| C:\Users\<you>\AppData\Roaming\<app>\spotify_tokens.json |
|------------------------------------------------------|
| {                                                    |
|   "access_token": "...",                             |
|   "refresh_token": "...",                            |
|   "expires_at": 1731402000                           |
| }                                                    |
+------------------------------------------------------+
           |
           v
+-----------------------------+
| App bisa ambil track, lirik |
| via API menggunakan token   |
+-----------------------------+
           |
           v
+-------------------------------------------+
| Kalau access_token expired (403 / 401):   |
| Rust otomatis panggil refresh_token API   |
| Dapat token baru tanpa login ulang 🔄     |
+-------------------------------------------+
