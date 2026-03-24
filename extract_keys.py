import re
import os

path = "dist/assets/index-CDJQv_WX.js"
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Supabase URL pattern
    url_m = re.search(r"https://[a-z0-9]+\.supabase\.co", content)
    # Supabase Key pattern (usually long eyJh...)
    key_m = re.search(r"eyJh[a-zA-Z0-9\._-]{100,}", content)
    
    with open("found_keys.txt", "w") as f_out:
        if url_m: f_out.write(f"URL: {url_m.group(0)}\n")
        if key_m: f_out.write(f"KEY: {key_m.group(0)}\n")
else:
    with open("found_keys.txt", "w") as f_out:
        f_out.write("File not found.")
