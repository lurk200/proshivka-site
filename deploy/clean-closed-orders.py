#!/usr/bin/env python3
"""Удаляет закрытые заказы type=regular (тестовые) и осиротевшие устройства."""
import json
from pathlib import Path

p = Path("/var/www/proshivka/server/crm/data.json")
bak = p.with_suffix(".json.bak-before-clean")
data = json.loads(p.read_text(encoding="utf-8"))
bak.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

closed = {"completed", "issued", "cancelled"}
before = len(data.get("orders") or [])
keep_orders = []
removed = []
for o in data.get("orders") or []:
    st = o.get("status")
    typ = o.get("type") or "regular"
    if typ == "regular" and st in closed:
        removed.append(o.get("orderNumber") or o.get("number") or o.get("id"))
        continue
    keep_orders.append(o)

data["orders"] = keep_orders
used = {o.get("deviceId") for o in keep_orders if o.get("deviceId")}
devs_before = len(data.get("devices") or [])
data["devices"] = [d for d in (data.get("devices") or []) if d.get("id") in used]
devs_removed = devs_before - len(data["devices"])

p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"orders: {before} -> {len(keep_orders)}; removed: {removed}")
print(f"devices: {devs_before} -> {len(data['devices'])}; removed {devs_removed}")
print(f"backup: {bak}")
