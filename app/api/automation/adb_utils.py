import subprocess

def run(cmd):
    print("[ADB]", cmd)
    out = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if out.stderr:
        print("stderr:", out.stderr)
    return out.stdout.strip()

def connect(serial):
    return run(f"adb connect {serial}")

def pair(pair_ip_port, code):
    return run(f"adb pair {pair_ip_port} {code}")

def check(serial):
    return run(f"adb -s {serial} get-state")

def tap(serial, x, y):
    return run(f"adb -s {serial} shell input tap {x} {y}")

def text(serial, txt):
    return run(f"adb -s {serial} shell input text '{txt}'")
