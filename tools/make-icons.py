"""Génère les icônes de la PWA (PNG + SVG) sans dépendance : python tools/make-icons.py

Motif : les trois couleurs de la combinaison Wada n° 161 en bandes 60/30/10 (convention MML),
sur fond encre. L'icône « maskable » garde le motif dans la zone sûre (cercle de 80 %)."""
import json
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COMBO = 161
BG = (0x1B, 0x1B, 0x19)
PROPS = [60, 30, 10]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def colors():
    data = json.loads((ROOT / "data" / "wada-348.json").read_text(encoding="utf-8"))
    combo = next(c for c in data["combinaisons"] if c["numero"] == COMBO)
    return combo["couleurs"]


def bands(size, inset):
    """Rectangles (x0, y0, x1, y1, couleur) des bandes horizontales dans le carré intérieur."""
    a, b = round(size * inset), round(size * (1 - inset))
    out, y = [], a
    cols = colors()
    for i, (c, p) in enumerate(zip(cols, PROPS)):
        y1 = b if i == len(cols) - 1 else y + round((b - a) * p / 100)
        out.append((a, y, b, y1, c))
        y = y1
    return out


def png(size, inset, path):
    rects = [(x0, y0, x1, y1, hex_rgb(c)) for x0, y0, x1, y1, c in bands(size, inset)]
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            px = BG
            for x0, y0, x1, y1, c in rects:
                if x0 <= x < x1 and y0 <= y < y1:
                    px = c
                    break
            rows.extend(px)

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)

    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(rows), 9)) + chunk(b"IEND", b"")
    path.write_bytes(data)


def svg(path):
    size, rx = 512, 96
    parts = [f'<rect width="{size}" height="{size}" rx="{rx}" fill="#1b1b19"/>']
    for x0, y0, x1, y1, c in bands(size, 0.16):
        parts.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="{c}"/>')
    path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">' + "".join(parts) + "</svg>\n", encoding="utf-8")


if __name__ == "__main__":
    out = ROOT / "icons"
    out.mkdir(exist_ok=True)
    png(192, 0.16, out / "icon-192.png")
    png(512, 0.16, out / "icon-512.png")
    png(512, 0.24, out / "icon-maskable-512.png")
    svg(out / "icon.svg")
    print("Icônes écrites dans", out, "— couleurs", colors())
