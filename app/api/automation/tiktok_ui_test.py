import sys
import os
import subprocess
import xml.etree.ElementTree as ET
import re

serial = sys.argv[1]
comment = sys.argv[2]

def adb(cmd):
    return subprocess.check_output(["adb", "-s", serial] + cmd.split()).decode()

# 1. Dump UI
adb("shell uiautomator dump /sdcard/view.xml")
os.makedirs("automation/xml", exist_ok=True)
os.system(f"adb -s {serial} pull /sdcard/view.xml automation/xml/{serial}.xml")

xml_path = f"automation/xml/{serial}.xml"
tree = ET.parse(xml_path)
root = tree.getroot()

def find_bounds(text=None, cls=None):
    for node in root.iter():
        if text and node.attrib.get("text") == text:
            return node.attrib.get("bounds")
        if cls and node.attrib.get("class") and cls in node.attrib.get("class"):
            return node.attrib.get("bounds")
    return None

def to_xy(bounds):
    pts = re.findall(r"\[(\d+),(\d+)\]", bounds)
    (x1,y1),(x2,y2) = pts
    return ( (int(x1)+int(x2))//2, (int(y1)+int(y2))//2 )

# Cari tombol comment
comment_btn = find_bounds(text="Comment") or find_bounds(cls="ImageView")
if comment_btn:
    x,y = to_xy(comment_btn)
    adb(f"shell input tap {x} {y}")

# Cari text field
field = find_bounds(cls="EditText")
if field:
    x,y = to_xy(field)
    adb(f"shell input tap {x} {y}")

# Input komentar
adb(f'shell input text "{comment}"')

# Cari tombol SEND
send_btn = find_bounds(text="Send")
if send_btn:
    x,y = to_xy(send_btn)
    adb(f"shell input tap {x} {y}")

print("Automation selesai")
