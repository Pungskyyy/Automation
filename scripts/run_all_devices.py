#!/usr/bin/env python3
import subprocess
import sys

def get_devices():
  result = subprocess.run(
    ["adb", "devices"],
    capture_output=True,
    text=True
  )
  lines = result.stdout.splitlines()[1:]  # skip header
  devices = []
  for line in lines:
    line = line.strip()
    if not line:
      continue
    serial, status = line.split()
    if status == "device":
      devices.append(serial)
  return devices

def run_for_device(serial):
  # sementara panggil script per-device yang sama
  cmd = [sys.executable, "scripts/run_for_device.py", serial]
  subprocess.run(cmd)

def main():
  devices = get_devices()
  if not devices:
    print("Tidak ada device ADB yang aktif")
    return

  print(f"Menjalankan automation untuk {len(devices)} device")
  for d in devices:
    print(f"==> {d}")
    run_for_device(d)

if __name__ == "__main__":
  main()
