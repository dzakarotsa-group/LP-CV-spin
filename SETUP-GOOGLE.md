# Setup Google Spreadsheet backend

1. Buat Google Spreadsheet kosong.
2. Buka **Extensions > Apps Script**.
3. Hapus kode bawaan, paste isi `Code.gs`.
4. Tambahkan file HTML baru bernama `AdminUI`, lalu paste isi `AdminUI.html`.
5. Jalankan fungsi `setup` sekali dan izinkan akses.
6. Buka sheet `Admins`, lalu tambahkan email Google admin mulai dari baris kedua.
7. Buat deployment pertama bernama `Public API`: **Execute as: Me**, **Who has access: Anyone**. Salin URL `/exec`.
8. Pastikan konstanta `API_URL` di [app.js](./app.js) berisi URL deployment Public API.
9. Buat deployment kedua bernama `Admin`: **Execute as: User accessing the web app**, **Who has access: Anyone with Google account**.
10. Admin membuka `admin.html`, masukkan URL deployment `Admin`, lalu login dengan akun Google yang ada di sheet `Admins`. URL deployment disimpan hanya di browser tersebut.

Frontend tetap dapat di-host di GitHub Pages. Spreadsheet menyimpan sheet `Config`, `Leads`, dan `Admins`.
Jangan membagikan URL admin jika tidak diperlukan. Hapus email dari sheet `Admins` untuk mencabut akses.
