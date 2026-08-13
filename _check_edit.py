from pathlib import Path
p = Path(r"c:\apps\petto\client\app\profile\edit.tsx")
t = p.read_text(encoding="utf-8")
# restore placeholder properly with petPhotoSource using pet type if available
# Find pet variable
for line in t.splitlines():
    if "const [pet" in line or "setPet(" in line or "pet =" in line:
        print(line)
