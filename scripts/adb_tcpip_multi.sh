#!/usr/bin/env bash
set -euo pipefail

LOG(){ echo "[$(date +%H:%M:%S)] $*" >&2; }
ERROR(){ echo "[$(date +%H:%M:%S)] ERROR: $*" >&2; }

MAX_PARALLEL=10
TCPIP_PORT=5555
LOG_FILE="adb_tcpip_$(date +%Y%m%d_%H%M%S).log"
DEVICE_IPS_FILE="scripts/device_ips.txt"
DEVICE_INFO_FILE="scripts/device_info.json"

detect_ip_address() {
  local serial="$1"
  local ip=""
  
  LOG "[$serial] Detecting IP address..."
  
  # Method 1: dumpsys connectivity
  ip=$(adb -s "$serial" shell dumpsys connectivity 2>/dev/null | grep "wlan0" | grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}/" | head -n1 | tr -d '/ \r\n' || true)
  if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    LOG "[$serial] Method 1 (dumpsys): $ip ✅"
    echo "$ip"
    return 0
  fi
  
  # Method 2: wlan0
  ip=$(adb -s "$serial" shell ip -f inet addr show wlan0 2>/dev/null | awk '/inet /{print $2}' | cut -d'/' -f1 | tr -d '\r\n ' | head -n1 || true)
  if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    LOG "[$serial] Method 2 (wlan0): $ip ✅"
    echo "$ip"
    return 0
  fi
  
  # Method 3: ip route
  ip=$(adb -s "$serial" shell ip route get 8.8.8.8 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | tr -d '\r\n ' | head -n1 || true)
  if [ -n "$ip" ] && [[ "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    LOG "[$serial] Method 3 (ip route): $ip ✅"
    echo "$ip"
    return 0
  fi
  
  ERROR "[$serial] All methods failed ❌"
  return 1
}

enable_tcpip_for_device() {
  local serial="$1"
  
  LOG "[$serial] =========================================="
  LOG "[$serial] Starting TCP/IP setup"
  
  local device_state=$(adb -s "$serial" get-state 2>/dev/null || echo "offline")
  if [ "$device_state" != "device" ]; then
    ERROR "[$serial] Device offline ❌"
    echo "${serial},N/A,device_offline" >> "${LOG_FILE}.csv"
    return 1
  fi
  
  LOG "[$serial] Enabling TCP/IP on port $TCPIP_PORT..."
  if ! adb -s "$serial" tcpip $TCPIP_PORT >> "$LOG_FILE" 2>&1; then
    ERROR "[$serial] TCP/IP failed ❌"
    echo "${serial},N/A,tcpip_failed" >> "${LOG_FILE}.csv"
    return 1
  fi
  
  LOG "[$serial] TCP/IP enabled ✅"
  LOG "[$serial] Waiting 5 seconds..."
  sleep 5
  
  local ip=""
  ip=$(detect_ip_address "$serial")
  
  if [ -z "$ip" ]; then
    ERROR "[$serial] No IP detected ❌"
    echo "${serial},N/A,no_ip_detected" >> "${LOG_FILE}.csv"
    return 1
  fi
  
  LOG "[$serial] 🌐 IP: $ip"
  LOG "[$serial] Waiting 2 seconds..."
  sleep 2
  
  LOG "[$serial] Connecting to ${ip}:${TCPIP_PORT}..."
  local connect_result
  connect_result=$(adb connect "${ip}:${TCPIP_PORT}" 2>&1 || true)
  
  if echo "$connect_result" | grep -qi "connected"; then
    LOG "[$serial] ✅ Connected to ${ip}:${TCPIP_PORT}"
    
    echo "${ip}:${TCPIP_PORT}" >> "$DEVICE_IPS_FILE"
    
    local device_model=$(adb -s "${ip}:${TCPIP_PORT}" shell getprop ro.product.model 2>/dev/null | tr -d '\r' || echo "Unknown")
    local android_version=$(adb -s "${ip}:${TCPIP_PORT}" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r' || echo "Unknown")
    local manufacturer=$(adb -s "${ip}:${TCPIP_PORT}" shell getprop ro.product.manufacturer 2>/dev/null | tr -d '\r' || echo "Unknown")
    
    echo "${serial}|${ip}:${TCPIP_PORT}|${manufacturer}|${device_model}|${android_version}|$(date +%Y-%m-%d_%H:%M:%S)" >> "${DEVICE_INFO_FILE}.csv"
    echo "${serial},${ip}:${TCPIP_PORT},success" >> "${LOG_FILE}.csv"
    
    LOG "[$serial] 📱 $manufacturer $device_model"
    LOG "[$serial] 🤖 Android $android_version"
    LOG "[$serial] =========================================="
    return 0
  else
    ERROR "[$serial] Connection failed: $connect_result ❌"
    echo "${serial},${ip}:${TCPIP_PORT},connection_failed" >> "${LOG_FILE}.csv"
    return 1
  fi
}

export -f enable_tcpip_for_device
export -f detect_ip_address
export -f LOG
export -f ERROR
export TCPIP_PORT LOG_FILE DEVICE_IPS_FILE DEVICE_INFO_FILE

LOG "=========================================="
LOG "🚀 ADB TCP/IP Multi-Device Setup"
LOG "=========================================="

> "$DEVICE_IPS_FILE"
> "${DEVICE_INFO_FILE}.csv"
echo "serial|tcp_address|manufacturer|model|android_version|timestamp" > "${DEVICE_INFO_FILE}.csv"
echo "serial,tcp_address,status" > "${LOG_FILE}.csv"

LOG "Checking ADB..."
adb start-server 2>&1 | head -n 3 >&2

DEV_LINES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && DEV_LINES+=("$line")
done < <(adb devices -l | tail -n +2 | sed '/^$/d')

if [ ${#DEV_LINES[@]} -eq 0 ]; then
  LOG "❌ No USB devices"
  exit 0
fi

LOG "Found ${#DEV_LINES[@]} USB devices"

VALID_SERIALS=()
for line in "${DEV_LINES[@]}"; do
  serial=$(echo "$line" | awk '{print $1}')
  state=$(echo "$line" | awk '{print $2}')
  
  if [ "$state" = "device" ]; then
    VALID_SERIALS+=("$serial")
    LOG "✅ $serial"
  else
    ERROR "⚠️  $serial (state: $state)"
  fi
done

if [ ${#VALID_SERIALS[@]} -eq 0 ]; then
  ERROR "❌ No authorized devices"
  exit 1
fi

LOG ""
LOG "🔄 Processing ${#VALID_SERIALS[@]} devices..."
LOG ""

if command -v parallel &> /dev/null; then
  parallel --citation 2>/dev/null || true
  printf '%s\n' "${VALID_SERIALS[@]}" | \
    parallel -j $MAX_PARALLEL enable_tcpip_for_device {}
else
  for serial in "${VALID_SERIALS[@]}"; do
    enable_tcpip_for_device "$serial" || true
    LOG ""
  done
fi

LOG ""
LOG "=========================================="
LOG "📊 SETUP COMPLETE!"
LOG "=========================================="

total=${#VALID_SERIALS[@]}
success=$(grep -c ",success$" "${LOG_FILE}.csv" 2>/dev/null || echo 0)
failed=$(( total - success ))

LOG "Total: $total"
LOG "✅ Success: $success"
LOG "❌ Failed: $failed"

if [ $total -gt 0 ]; then
  LOG "📈 Success rate: $(( success * 100 / total ))%"
fi

LOG "=========================================="

if [ $success -gt 0 ]; then
  LOG ""
  LOG "🎉 Next steps:"
  LOG "1. �� Cabut USB cable"
  LOG "2. 🔄 Run: bash scripts/auto_reconnect.sh"
  LOG "3. 🚀 Start automation!"
  LOG ""
  LOG "✅ Device ready for WiFi automation!"
fi

LOG "=========================================="
