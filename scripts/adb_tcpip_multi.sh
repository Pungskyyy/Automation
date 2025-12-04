#!/usr/bin/env bash
# Script: adb_tcpip_multi.sh
# Purpose: otomatis enable adb tcpip di semua device USB yang terhubung
#         lalu coba konek via TCP/IP (adb connect IP:5555)
# Usage: chmod +x scripts/adb_tcpip_multi.sh && ./scripts/adb_tcpip_multi.sh

set -euo pipefail

LOG(){ echo "[adb-tcpip] $*"; }

# Ambil daftar perangkat yang "device" (terhubung)
# Gunakan array untuk kompatibilitas dengan macOS (bash 3.x)
DEV_LINES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && DEV_LINES+=("$line")
done < <(adb devices -l | tail -n +2 | sed '/^$/d')

if [ ${#DEV_LINES[@]} -eq 0 ]; then
  LOG "Tidak ada perangkat terdeteksi via adb. Silakan hubungkan perangkat via USB."
  LOG "Selesai (tidak ada perangkat untuk diproses)"
  exit 0
fi

for line in "${DEV_LINES[@]}"; do
  # baris biasanya: <serial>\tdevice ...
  serial=$(echo "$line" | awk '{print $1}')
  state=$(echo "$line" | awk '{print $2}')
  if [ "$state" != "device" ]; then
    LOG "Lewati $serial (state=$state)"
    continue
  fi

  LOG "Processing device: $serial"

  LOG "1) Enable TCP/IP on device"
  adb -s "$serial" tcpip 5555
  sleep 2

  LOG "2) Mencari IP perangkat (multi-fallback)..."
  ip=""
  # coba wlan0
  ip=$(adb -s "$serial" shell ip -f inet addr show wlan0 2>/dev/null | awk '/inet /{print $2}' | cut -d'/' -f1 | head -n1 || true)
  # jika empty coba eth0
  if [ -z "$ip" ]; then
    ip=$(adb -s "$serial" shell ip -f inet addr show eth0 2>/dev/null | awk '/inet /{print $2}' | cut -d'/' -f1 | head -n1 || true)
  fi
  # fallback: ip route get
  if [ -z "$ip" ]; then
    ip=$(adb -s "$serial" shell ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -n1 || true)
  fi
  # fallback: getprop dhcp.wlan0.ipaddress
  if [ -z "$ip" ]; then
    ip=$(adb -s "$serial" shell getprop dhcp.wlan0.ipaddress 2>/dev/null | tr -d '\r' || true)
  fi

  if [ -z "$ip" ] || [[ "$ip" == *"error"* ]]; then
    LOG "Gagal menemukan IP untuk $serial — lewati koneksi TCP/IP. Periksa koneksi wifi pada device"
    continue
  fi

  LOG "Detected IP for $serial: $ip"

  LOG "3) Connect via TCP/IP: adb connect ${ip}:5555"
  connect_out=$(adb connect "${ip}:5555" 2>&1 || true)
  LOG "adb connect output: $connect_out"

  if echo "$connect_out" | grep -qi "connected"; then
    LOG "Berhasil connect ke ${ip}:5555"
  else
    LOG "Koneksi mungkin gagal — periksa manual: adb connect ${ip}:5555"
  fi

  # beri jeda singkat sebelum device berikutnya
  sleep 1
done

LOG "Selesai"
