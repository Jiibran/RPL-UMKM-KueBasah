# Teknologi yang Digunakan: Website E-Commerce UMKM Kue Basah

Dokumen ini menjelaskan teknologi utama yang digunakan dalam pengembangan website e-commerce "UMKM Kue Basah".

## Bahasa Pemrograman

*   **JavaScript:**
    *   **Node.js (Backend):** Lingkungan runtime JavaScript sisi server yang digunakan untuk membangun logika aplikasi, menangani permintaan HTTP, berinteraksi dengan database, dan mengelola otentikasi pengguna serta fungsionalitas admin.
    *   **Vanilla JavaScript (Frontend):** Digunakan untuk interaktivitas di sisi klien, validasi form, manipulasi DOM, dan pembaruan dinamis pada halaman web tanpa perlu memuat ulang seluruh halaman.

## Database

*   **MariaDB:** Sistem manajemen basis data relasional (RDBMS) yang merupakan fork dari MySQL. Digunakan untuk menyimpan semua data aplikasi, termasuk informasi pengguna, produk, kategori, pesanan, dan alamat.

## Framework & Library Utama

### Backend

*   **Express.js:** Framework aplikasi web Node.js yang minimalis dan fleksibel. Digunakan untuk membangun API backend, mendefinisikan rute, dan menangani middleware.
*   **EJS (Embedded JavaScript templates):** Mesin templat sederhana yang memungkinkan pembuatan halaman HTML dinamis dengan menyisipkan JavaScript di dalam tag HTML. Digunakan untuk merender tampilan (views) di sisi server.
*   **`mysql2`:** Klien MySQL untuk Node.js, digunakan untuk menghubungkan aplikasi Node.js dengan database MariaDB dan menjalankan query SQL.
*   **`express-session`:** Middleware untuk manajemen sesi, memungkinkan aplikasi menyimpan informasi pengguna antar permintaan (misalnya, status login).
*   **`bcrypt` (atau serupa):** (Direncanakan/Umum digunakan) Library untuk hashing kata sandi, penting untuk keamanan penyimpanan kredensial pengguna.
*   **`express-ejs-layouts`:** Middleware untuk Express.js yang mempermudah penggunaan layout atau templat utama dalam aplikasi EJS, mengurangi redundansi kode di berbagai view.

### Frontend

*   **HTML5:** Bahasa markup standar untuk membuat struktur halaman web.
*   **CSS3:** Digunakan untuk styling dan tata letak halaman web, memastikan tampilan yang menarik dan responsif.
*   **Bootstrap:** Untuk mempercepat pengembangan UI dengan menyediakan komponen siap pakai dan sistem grid yang responsif.

## Alat Pengembangan & Lainnya

*   **Visual Studio Code:** Editor kode sumber yang digunakan untuk pengembangan.
*   **Git & GitHub (atau SCM serupa):** (Direncanakan/Umum digunakan) Sistem kontrol versi untuk melacak perubahan kode dan kolaborasi.
*   **npm (Node Package Manager):** Manajer paket untuk JavaScript, digunakan untuk mengelola dependensi proyek (library dan framework).
*   **phpMyAdmin:** (Berdasarkan dump SQL) Alat administrasi berbasis web untuk mengelola database MariaDB.

## Arsitektur Umum

Aplikasi ini mengikuti arsitektur Model-View-Controller (MVC) atau pola serupa:

*   **Model:** Representasi data dan logika bisnis, berinteraksi dengan database (misalnya, query SQL di dalam file rute atau controller).
*   **View:** Antarmuka pengguna (file `.ejs`) yang menampilkan data kepada pengguna dan mengirimkan input pengguna ke controller.
*   **Controller:** (Logika di dalam file rute Express.js) Menerima input dari pengguna (melalui view), memprosesnya (mungkin dengan bantuan model), dan kemudian menentukan view mana yang akan dirender dengan data apa.

Proyek ini bertujuan untuk menyediakan platform e-commerce yang fungsional dan mudah dikelola untuk UMKM Kue Basah, dengan fokus pada pengalaman pengguna yang baik dan panel admin yang komprehensif.
