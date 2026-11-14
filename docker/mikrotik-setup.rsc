# ==============================================================================
# Setup Script: LNet-Access Container di MikroTik RouterOS v7 (x86_64)
# Host Gateway: 172.18.0.1 (Bridge: internal)
# Container IP: 172.18.0.5/24
# Web Access: http://192.168.10.1:8080 (LAN) atau http://10.20.30.1:8080 (Hotspot)
# ==============================================================================

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
/ip firewall nat add chain=dstnat action=dst-nat to-addresses=172.18.0.5 to-ports=80 protocol=tcp dst-port=8080 comment="LNet-Access Web HTTP"
/ip firewall nat add chain=dstnat action=dst-nat to-addresses=172.18.0.5 to-ports=443 protocol=tcp dst-port=8443 comment="LNet-Access Web HTTPS"

# 6. Pembuatan Container di MikroTik:
# Jika image di-push ke registry (misal Docker Hub / GHCR):
# /container add remote-image=yourusername/lnet-access:latest interface=veth-lnet-access mountlists=lnet-mounts envlist=lnet-envs root-dir=/sata1/apps/lnet-access/root start-on-boot=yes logging=yes
#
# Atau jika menggunakan image tarball lokal:
# /container add file=lnet-access.tar interface=veth-lnet-access mountlists=lnet-mounts envlist=lnet-envs root-dir=/sata1/apps/lnet-access/root start-on-boot=yes logging=yes
