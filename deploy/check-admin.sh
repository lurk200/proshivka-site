#!/bin/bash
set -e
PID=$(pgrep -n -f 'vite preview' || true)
echo "PID=$PID"
if [[ -n "$PID" ]]; then
  tr '\0' '\n' < /proc/$PID/environ | grep -i PASSWORD || echo "NO_PASSWORD_IN_ENV"
fi
python3 <<'PY'
import json, urllib.request
for pw in ("Lolipop1199", "admin"):
    data = json.dumps({"password": pw}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:5174/api/admin/login",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        body = urllib.request.urlopen(req).read().decode()
        print(pw, "->", body)
    except Exception as e:
        err = e.read().decode() if hasattr(e, "read") else str(e)
        print(pw, "->", err)
PY
