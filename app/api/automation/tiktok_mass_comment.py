from devices import DEVICES
import adb_utils
import time
import sys

# TikTok Package Names
TIKTOK_PACKAGES = [
    "com.ss.android.ugc.trill",       # TikTok International
    "com.zhiliaoapp.musically",       # TikTok China
]

# TikTok Resource IDs
TIKTOK_IDS = {
    "comment_icon": "com.ss.android.ugc.trill:id/ds4",
    "comment_input": "com.ss.android.ugc.trill:id/dqp",
    "send_button": "com.ss.android.ugc.trill:id/dny",
    "alternative_btn": "com.ss.android.ugc.trill:id/cb7"
}

def detect_tiktok_package(serial):
    """Detect which TikTok package is installed on device"""
    for pkg in TIKTOK_PACKAGES:
        result = adb_utils.run(f"adb -s {serial} shell pm list packages {pkg}")
        if pkg in result:
            print(f"[{serial}] Found TikTok: {pkg}")
            return pkg
    
    print(f"[{serial}] Using default package: {TIKTOK_PACKAGES[0]}")
    return TIKTOK_PACKAGES[0]

def comment_tiktok_by_id(serial, comment):
    """Comment TikTok menggunakan Resource ID (lebih reliable)"""
    print(f"\n=== Device {serial} - Using Resource IDs ===")

    # Detect TikTok package
    tiktok_pkg = detect_tiktok_package(serial)

    # Buka TikTok
    print(f"[1] Opening TikTok ({tiktok_pkg})...")
    adb_utils.run(f"adb -s {serial} shell monkey -p {tiktok_pkg} 1")
    time.sleep(4)

    # ...existing code...

def comment_tiktok(serial, comment):
    """Original function using coordinates"""
    print(f"\n=== Device {serial} ===")

    # Detect TikTok package
    tiktok_pkg = detect_tiktok_package(serial)

    # buka TikTok
    adb_utils.run(f"adb -s {serial} shell monkey -p {tiktok_pkg} 1")
    time.sleep(4)

    # ...existing code...

# ...existing code...