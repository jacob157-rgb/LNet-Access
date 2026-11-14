# Panduan Lengkap Build Docker & Kontainer MikroTik RouterOS x86 (LNet-Access)

Dokumen ini adalah panduan lengkap untuk membangun image Docker dan menjalankannya langsung di dalam fitur **/container** MikroTik RouterOS x86_64 Anda.

---

## 1. Arsitektur & Pelacakan Masa Aktif Kalender (Running Clock)

### Bagaimana Sistem Melacak Masa Aktif Voucher 7 Hari?
* **Otomatis di Dalam Kontainer**: Kontainer LNet-Access menjalankan daemon `supervisord` yang mengeksekusi `crond` setiap menit (`* * * * * php artisan schedule:run`).
* **Deteksi Login Pertama**: Ketika pengguna voucher pertama kali login di hotspot MikroTik (terdeteksi di `/ip/hotspot/active`), sistem mencatat:
  * `sold_at` = Waktu pertama kali login.
  * `expires_at` = Waktu login + 7 hari (misal: Senin pk 10:00 $\rightarrow$ Senin depan pk 10:00).
* **Masa Aktif Berjalan Terus**:
  * Jam kalender terus berdetak 24/7 baik pengguna sedang aktif online maupun sedang pergi/offline (hari ke-3 pergi, hari ke-5 balik tetap bisa login karena masih sebelum `expires_at`).
* **Eksekusi Pemutusan (Auto-Expiry)**:
  * Tepat di hari ke-8 saat waktu kalender melewati `expires_at`, background job LNet-Access di kontainer langsung mendepak sesi aktif pengguna dari `/ip/hotspot/active` dan menghapus user dari `/ip/hotspot/user`.
  * Voucher otomatis berstatus **`expired`** dan tidak bisa digunakan lagi.

---

## 2. Cara Membangun Image Docker (Target: linux/amd64)

Tersedia dua opsi untuk membangun dan menaruh image di MikroTik:

### Opsi A: Menggunakan GitHub Actions / Docker Hub (Otomatis & Direkomendasikan)
Telah disediakan workflow [docker-build.yml](file:///C:/Users/Jacob/Project/LNet-Access/.github/workflows/docker-build.yml).
1. Setiap kali Anda melakukan `git push` ke GitHub, GitHub Actions akan otomatis:
   * Mengompilasi aplikasi untuk target arsitektur `linux/amd64`.
   * Mengunggah image ke GitHub Container Registry (`ghcr.io/<username>/lnet-access:latest`) atau Docker Hub.
2. Di MikroTik, router dapat langsung men-download image secara otomatis melalui internet:
   ```routeros
   /container add remote-image=ghcr.io/yourusername/lnet-access:latest interface=veth-lnet-access mountlists=lnet-mounts envlist=lnet-envs root-dir=/sata1/apps/lnet-access/root start-on-boot=yes logging=yes
   ```

---

### Opsi B: Build Manual / Offline (Menggunakan File Tarball)
Jika Anda memiliki laptop/PC dengan Docker Desktop:
1. Jalankan script [build-image.bat](file:///C:/Users/Jacob/Project/LNet-Access/docker/build-image.bat):
   ```cmd
   docker\build-image.bat
   ```
   Atau jalankan perintah manual:
   ```bash
   docker build --platform linux/amd64 -t lnet-access:latest .
   docker save lnet-access:latest -o lnet-access.tar
   ```
2. Salin file `lnet-access.tar` ke MikroTik:
   * Buka **Winbox** $\rightarrow$ menu **Files**.
   * Drag & drop file `lnet-access.tar` ke dalam disk `/sata1` atau root direktori MikroTik.

---

## 3. Eksekusi Setup di Terminal MikroTik

Buka Terminal di Winbox (atau SSH ke `192.168.10.1`), lalu jalankan perintah berikut (dari berkas [mikrotik-setup.rsc](file:///C:/Users/Jacob/Project/LNet-Access/docker/mikrotik-setup.rsc)):

```routeros
# 1. Buat Virtual Ethernet (VETH) untuk Container
/interface veth add name=veth-lnet-access address=172.18.0.5/24 gateway=172.18.0.1 comment="VETH LNet-Access Laravel App"

# 2. Hubungkan VETH ke Bridge "internal"
/interface bridge port add bridge=internal interface=veth-lnet-access

# 3. Konfigurasi Mount Persistent Storage di SSD /sata1
/container/mounts add list=lnet-mounts src=/sata1/apps/lnet-access/database dst=/var/www/html/database
/container/mounts add list=lnet-mounts src=/sata1/apps/lnet-access/storage dst=/var/www/html/storage

# 4. Konfigurasi Environment Variables (Env List)
/container/envs add list=lnet-envs key=APP_NAME value="LNet-Access"
/container/envs add list=lnet-envs key=APP_ENV value=production
/container/envs add list=lnet-envs key=APP_DEBUG value=false
/container/envs add list=lnet-envs key=APP_URL value="http://192.168.10.1:8080"
/container/envs add list=lnet-envs key=DB_CONNECTION value=sqlite
/container/envs add list=lnet-envs key=DB_DATABASE value=/var/www/html/database/database.sqlite
/container/envs add list=lnet-envs key=SESSION_DRIVER value=file
/container/envs add list=lnet-envs key=CACHE_STORE value=file
/container/envs add list=lnet-envs key=QUEUE_CONNECTION value=sync

# 5. Konfigurasi Port-Forward NAT (Akses Web dari LAN 192.168.10.1:8080)
/ip firewall nat add chain=dstnat action=dst-nat to-addresses=172.18.0.5 to-ports=80 protocol=tcp dst-port=8080 comment="LNet-Access Web GUI"

# 6. Buat dan Jalankan Kontainer (Pilih salah satu metode):

# METODE TARBALL (Jika upload lnet-access.tar):
/container add file=lnet-access.tar interface=veth-lnet-access mountlists=lnet-mounts envlist=lnet-envs root-dir=/sata1/apps/lnet-access/root start-on-boot=yes logging=yes

# METODE REGISTRY (Jika menggunakan remote image):
/container add remote-image=yourusername/lnet-access:latest interface=veth-lnet-access mountlists=lnet-mounts envlist=lnet-envs root-dir=/sata1/apps/lnet-access/root start-on-boot=yes logging=yes
```

---

## 4. Menjalankan & Memeriksa Status Kontainer

Setelah container berhasil dibuat (status extraction selesai):
1. **Jalankan Kontainer**:
   ```routeros
   /container start [find where root-dir="/sata1/apps/lnet-access/root"]
   ```
2. **Cek Log Kontainer**:
   ```routeros
   /log print follow where topics~"container"
   ```
3. **Akses Dashboard LNet-Access**:
   Buka browser di komputer operator:
   * URL LAN: **`http://192.168.10.1:8080`**
   * URL Hotspot: **`http://10.20.30.1:8080`**
