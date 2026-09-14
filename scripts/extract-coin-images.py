"""Extract coin images from public/wl-config.json into /uploads/coins."""
from __future__ import annotations

import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CFG = ROOT / "public" / "wl-config.json"
MIME_EXT = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
}


def main() -> None:
    data = json.loads(CFG.read_text(encoding="utf-8"))
    coins = data.get("coins") or []
    dests = [
        ROOT / "public" / "uploads" / "coins",
        ROOT / "uploads" / "coins",
    ]
    for dest in dests:
        dest.mkdir(parents=True, exist_ok=True)

    written = 0
    for coin in coins:
        cid = re.sub(r"[^a-z0-9_-]", "", str(coin.get("id") or ""), flags=re.I)
        url = str(coin.get("imageUrl") or "")
        m = re.match(r"^data:([^;]+);base64,(.+)$", url, re.S)
        if not cid or not m:
            continue
        mime, b64 = m.group(1).lower(), m.group(2)
        ext = MIME_EXT.get(mime, "png")
        raw = base64.b64decode(b64)
        for dest in dests:
            (dest / f"{cid}.{ext}").write_bytes(raw)
        written += 1
        print(f"wrote {cid}.{ext} ({len(raw)} bytes)")

    print(f"done, {written} coins")


if __name__ == "__main__":
    main()
