@echo off
REM ==============================================================================
REM Build Script untuk LNet-Access Container (MikroTik RouterOS x86_64)
REM ==============================================================================

echo [1/3] Menyiapkan build aset frontend...
call node node_modules/vite-plus/bin/vp build

echo [2/3] Membangun image Docker (target architecture: linux/amd64)...
docker build --platform linux/amd64 -t lnet-access:latest .

echo [3/3] Mengekspor image menjadi file tarball untuk MikroTik...
docker save lnet-access:latest -o lnet-access.tar

echo.
echo ==============================================================================
echo Selesai! File "lnet-access.tar" siap di-upload ke MikroTik RouterOS.
echo Upload file tersebut ke direktori root atau /sata1 di Files MikroTik (via Winbox).
echo Lalu jalankan perintah di docker/mikrotik-setup.rsc melalui Terminal MikroTik.
echo ==============================================================================
pause
