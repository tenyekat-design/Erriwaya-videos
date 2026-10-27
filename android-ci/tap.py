"""Tap the first on-screen element whose text/content-desc contains the given string."""
import re, subprocess, sys, time
want = sys.argv[1]
for attempt in range(4):
    subprocess.run(["adb", "shell", "uiautomator", "dump", "/sdcard/u.xml"], capture_output=True)
    xml = subprocess.run(["adb", "shell", "cat", "/sdcard/u.xml"], capture_output=True, text=True).stdout
    for node in re.finditer(r"<node [^>]*>", xml):
        n = node.group(0)
        label = " ".join(re.findall(r'(?:text|content-desc)="([^"]*)"', n))
        if want in label:
            b = re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', n)
            x = (int(b.group(1)) + int(b.group(3))) // 2
            y = (int(b.group(2)) + int(b.group(4))) // 2
            print(f"tap {want!r} at {x},{y}")
            subprocess.run(["adb", "shell", "input", "tap", str(x), str(y)])
            sys.exit(0)
    time.sleep(2)
print(f"NOT FOUND: {want!r}")
print(xml[:3000])
