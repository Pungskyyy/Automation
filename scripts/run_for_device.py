#!/usr/bin/env python3
import subprocess
import sys

def run(cmd):
  # helper kecil
  result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
  if result.stdout:
    print(result.stdout.strip())
  if result.stderr:
    print(result.stderr.strip(), file=sys.stderr)
  return result.returncode

def main():
  if len(sys.argv) < 2:
    print("Butuh argumen: serial device", file=sys.stderr)
    sys.exit(1)

  serial = sys.argv[1]

  # contoh: cek device, lalu kirim keyevent HOME
  run(f'adb -s "{serial}" shell input keyevent 3')

  # di sini kamu ganti dengan workflow real:
  # buka aplikasi, tap koordinat, dsb.

  print(f"Selesai automation untuk device {serial}")

if __name__ == "__main__":
  main()
