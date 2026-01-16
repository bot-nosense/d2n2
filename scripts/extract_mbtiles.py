#!/usr/bin/env python3
import os
import sqlite3
import argparse
from pathlib import Path

def flip_y(z: int, y: int) -> int:
    # MBTiles dùng TMS (y đảo) rất hay gặp. Nếu tiles bị “lộn”, bật --tms
    return (1 << z) - 1 - y

def main():
    ap = argparse.ArgumentParser(description="Extract MBTiles to XYZ tile folder.")
    ap.add_argument("mbtiles", help="input .mbtiles path")
    ap.add_argument("outdir", help="output tiles folder (e.g. ./tiles)")
    ap.add_argument("--tms", action="store_true", help="MBTiles uses TMS scheme (flip y)")
    ap.add_argument("--ext", default=None, help="force extension (png/jpg/pbf). default auto by metadata/guess")
    args = ap.parse_args()

    mb = args.mbtiles
    out = Path(args.outdir)
    out.mkdir(parents=True, exist_ok=True)

    con = sqlite3.connect(mb)
    cur = con.cursor()

    # Try detect format from metadata
    fmt = None
    try:
        cur.execute("SELECT value FROM metadata WHERE name='format'")
        row = cur.fetchone()
        if row:
            fmt = row[0].lower()
    except sqlite3.Error:
        pass

    ext = args.ext
    if ext is None:
        if fmt in ("png", "jpg", "jpeg", "pbf", "webp"):
            ext = "jpg" if fmt == "jpeg" else fmt
        else:
            ext = "png"  # default

    # tiles table spec
    cur.execute("SELECT zoom_level, tile_column, tile_row, tile_data FROM tiles")
    n = 0
    for z, x, y, data in cur:
        if args.tms:
            y = flip_y(int(z), int(y))
        tile_path = out / str(z) / str(x)
        tile_path.mkdir(parents=True, exist_ok=True)
        fp = tile_path / f"{y}.{ext}"
        with open(fp, "wb") as f:
            f.write(data)
        n += 1
        if n % 5000 == 0:
            print(f"Extracted {n} tiles...")

    con.close()
    print(f"Done. Extracted {n} tiles to {out.resolve()}")

if __name__ == "__main__":
    main()
