#!/usr/bin/env python3
from pathlib import Path

p = Path("/opt/remnanode/Caddyfile")
text = p.read_text()
marker = "# === proshivka.online ==="
block = """
# === proshivka.online ===
http://proshivka.online, http://www.proshivka.online {
    bind 0.0.0.0

    handle /.well-known/acme-challenge/* {
        root * /var/www/html
        file_server
    }

    handle {
        reverse_proxy 127.0.0.1:5174
    }
}
"""
if marker in text:
    print("already present")
else:
    needle = ":80 {"
    if needle not in text:
        raise SystemExit("cannot find :80 block")
    text = text.replace(needle, block + "\n" + needle, 1)
    Path("/opt/remnanode/Caddyfile.bak-before-proshivka").write_text(p.read_text())
    p.write_text(text)
    print("Caddyfile updated")
print("---")
print(p.read_text())
