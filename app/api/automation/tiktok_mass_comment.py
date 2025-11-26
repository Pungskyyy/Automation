from devices import DEVICES
import adb_utils
import time
import sys

def comment_tiktok(serial, comment):
    print(f"\n=== Device {serial} ===")

    # buka TikTok
    adb_utils.run(f"adb -s {serial} shell monkey -p com.zhiliaoapp.musically 1")
    time.sleep(4)

    # buka kolom komentar (koordinat universal TikTok)
    adb_utils.tap(serial, 540, 1650)
    time.sleep(2)

    # klik input comment
    adb_utils.tap(serial, 300, 1780)
    time.sleep(1)

    # isi text
    adb_utils.text(serial, comment)
    time.sleep(1)

    # klik tombol send
    adb_utils.tap(serial, 980, 1780)
    time.sleep(1)

    print(f"[OK] Comment terkirim: {comment}")


def main():
    comment = sys.argv[1] if len(sys.argv) > 1 else "Test comment by Python bot"

    for d in DEVICES:
        serial = d["serial"]

        # connect ADB
        print(adb_utils.connect(serial))
        time.sleep(1)

        state = adb_utils.check(serial)
        print("state:", state)

        if "device" not in state:
            print("[SKIP] Device tidak online")
            continue

        comment_tiktok(serial, comment)
        time.sleep(2)


if __name__ == "__main__":
    main()
