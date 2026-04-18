#!/usr/bin/env bash
# Auto-reconnect script with timeout - Keep devices connected via WiFi
# Usage: bash scripts/auto_reconnect.sh

set -euo pipefail

LOG(){ echo "[$(date +%H:%M:%S)] $*"; }
ERROR(){ echo "[$(date +%H:%M:%S)] ERROR: $*" >&2; }

DEVICE_IPS_FILE="scripts/device_ips.txt"
CHECK_INTERVAL=30  # Check every 30 seconds
CONNECT_TIMEOUT=5  # Timeout for adb connect command

LOG "=========================================="
LOG "🔄 ADB Auto-Reconnect Service (with timeout)"
LOG "Keep devices connected via WiFi"
LOG "=========================================="

if [ ! -f "$DEVICE_IPS_FILE" ]; then
  ERROR "File $DEVICE_IPS_FILE not found"
  ERROR "Run: bash scripts/adb_tcpip_multi.sh first"
  exit 1
fi

# Read device IPs
DEVICE_IPS=()
while IFS= read -r ip; do
  [[ -n "$ip" ]] && DEVICE_IPS+=("$ip")
done < "$DEVICE_IPS_FILE"

if [ ${#DEVICE_IPS[@]} -eq 0 ]; then
  ERROR "No device IPs found in $DEVICE_IPS_FILE"
  exit 1
fi

LOG "Monitoring ${#DEVICE_IPS[@]} devices:"
for ip in "${DEVICE_IPS[@]}"; do
  LOG "  - $ip"
done

LOG ""
LOG "Press Ctrl+C to stop"
LOG "=========================================="
LOG ""

# Trap Ctrl+C
trap 'LOG ""; LOG "Stopping auto-reconnect..."; exit 0' INT TERM

# Function to connect with timeout
connect_with_timeout() {
  local ip="$1"
  local timeout="$2"
  
  # Run adb connect in background with timeout
  ( 
    adb connect "$ip" 2>&1
  ) &
  local pid=$!
  
  # Wait for process with timeout
  local count=0
  while kill -0 $pid 2>/dev/null && [ $count -lt $timeout ]; do
    sleep 1
    ((count++))
  done
  
  # Kill if still running
  if kill -0 $pid 2>/dev/null; then
    kill -9 $pid 2>/dev/null || true
    echo "timeout"
    return 1
  fi
  
  wait $pid
  return $?
}

# Keep-alive loop
iteration=0
while true; do
  ((iteration++))
  LOG "Check #$iteration"
  
  for ip in "${DEVICE_IPS[@]}"; do
    # Check if device is connected
    if adb devices | grep -q "$ip"; then
      # Device connected, check state
      state=$(timeout 3 adb -s "$ip" get-state 2>/dev/null || echo "offline")
      
      if [ "$state" = "device" ]; then
        LOG "[$ip] ✅ Online"
      elif [ "$state" = "offline" ]; then
        LOG "[$ip] ⚠️  Offline - Reconnecting..."
        
        # Disconnect first
        timeout 3 adb disconnect "$ip" >/dev/null 2>&1 || true
        sleep 1
        
        # Try reconnect with timeout
        LOG "[$ip] Connecting (timeout: ${CONNECT_TIMEOUT}s)..."
        if connect_result=$(connect_with_timeout "$ip" "$CONNECT_TIMEOUT" 2>&1); then
          if echo "$connect_result" | grep -qi "connected"; then
            LOG "[$ip] ✅ Reconnected"
          else
            ERROR "[$ip] Failed: $connect_result"
          fi
        else
          ERROR "[$ip] Connection timeout"
        fi
      else
        LOG "[$ip] ⚠️  State: $state"
      fi
    else
      # Device not in list, try connect
      LOG "[$ip] ❌ Not found - Connecting..."
      
      if connect_result=$(connect_with_timeout "$ip" "$CONNECT_TIMEOUT" 2>&1); then
        if echo "$connect_result" | grep -qi "connected"; then
          LOG "[$ip] ✅ Connected"
        else
          ERROR "[$ip] Failed: $connect_result"
        fi
      else
        ERROR "[$ip] Connection timeout"
      fi
    fi
  done
  
  LOG ""
  sleep $CHECK_INTERVAL
done
