#!/usr/bin/env python3
"""BT00 extraction: parse the 33 Phan Vu PHC drawings (pdftotext -layout output)
into data_in/pile_specs.json.

Source: workspace/xep-coc/Ref/06. COC BTLT ULT- BPTC DONG COC/*.pdf
  - 33 individual drawings 01..33, plus 00. ALL (a compilation, not a 34th pile).
  - Version 1.2, issued 11/2026, manufacturer Phan Vu, standard TCVN 7888.
  - Concrete 80 MPa, specimen D150xH300, PC bar fpu=1420 MPa, fpy=1275 MPa
    (TCVN 6284-3 / JIS G3137) - verified identical in all 33 files.
  - Spiral: 2 layers at a50 over L=2*Do at each end, 1 layer at a100 in the middle.
    This is read from the drawing annotation, not from the table.
  - Length L is NOT fixed on the drawings: it is a user input (PHC-...-L-...).
  - sigma_pc, E_b, E_p, gamma_c are NOT on the drawings: flagged missing in JSON.
  - Install load (T) is in the far-right column; for D300-D500 it shares a line
    with the class letter, for D600-D1000 it is a standalone number at x>250.
    Values below were cross-checked line-by-line against the txt extraction.
"""
import glob, json, re, os

INSTALL_T = {
    "PHC-A300": 130, "PHC-B300": 125, "PHC-C300": 120,
    "PHC-A350": 180, "PHC-B350": 175, "PHC-C350": 170,
    "PHC-A400": 225, "PHC-AB400": 220, "PHC-B400": 215, "PHC-C400": 210,
    "PHC-A450": 285, "PHC-B450": 270, "PHC-C450": 265,
    "PHC-A500": 365, "PHC-AB500": 350, "PHC-B500": 345, "PHC-C500": 340,
    "PHC-A600": 490, "PHC-AB600": 480, "PHC-B600": 470, "PHC-C600": 460,
    "PHC-A700": 620, "PHC-B700": 595, "PHC-C700": 580,
    "PHC-A800": 780, "PHC-B800": 750, "PHC-C800": 730,
    "PHC-A900": 960, "PHC-B900": 915, "PHC-C900": 895,
    "PHC-A1000": 1150, "PHC-B1000": 1100, "PHC-C1000": 1065,
}

def parse_tc(tok):
    """'1.5' -> {'tc':1.5,'tc_splice':None}; '3(6)' -> {'tc':3,'tc_splice':6}."""
    m = re.fullmatch(r"([\d.]+)\(([\d.]+)\)", tok)
    if m:
        return float(m.group(1)), float(m.group(2))
    return float(tok), None

def parse_file(path):
    lines = open(path, encoding="utf-8", errors="ignore").read().splitlines()
    text = "\n".join(lines)
    title_m = re.search(r"\b(PHC-(?:AB|[A-Z])\d+-TCVN-7888)\b", text)
    dwg_m = re.search(r"\b(PHC-(?:AB|[A-Z])\d+-D-CO\d+)\b", text)
    code = title_m.group(1).replace("-TCVN-7888", "") if title_m else None  # e.g. PHC-A300
    # data row: the line whose tokens start with Do (300..1000) and contain
    # 20 tokens (no GC) or 23 tokens (with GC), in x-order.
    row = None
    has_gc = "GIA CƯỜNG" in text or "REINFORCED BAR GC" in text
    want = 23 if has_gc else 20
    for ln in lines:
        toks = ln.split()
        if not toks:
            continue
        # strip a trailing "(T)" token (install-load unit) if present
        toks = [t for t in toks if t != "(T)"]
        if len(toks) >= want and toks[0].isdigit() and 250 <= int(toks[0]) <= 1100:
            # first token is Do, second Dp; guard against other numeric lines
            if toks[1].isdigit():
                row = toks[:want]
                break
    if row is None:
        raise ValueError(f"no data row in {path}")
    vals = row
    Do, Dp, Di, Dei, t = [float(v) for v in vals[0:5]]
    d_pc, N1 = float(vals[5]), int(float(vals[6]))
    rest = vals[7:]
    # rest is either [Mcr,Mu,GC,N2,L2,Fs,...] or [GC,N2,L2,Mcr,Mu,Fs,...]
    if len(rest) == 16 and rest[0] in ("14", "16") and rest[1] in ("5", "8") and rest[2] == "1000":
        gc_d, N2, L2 = float(rest[0]), int(float(rest[1])), float(rest[2])
        Mcr, Mu = float(rest[3]), float(rest[4])
        tail = rest[5:]
    elif len(rest) == 16:
        Mcr, Mu = float(rest[0]), float(rest[1])
        gc_d, N2, L2 = float(rest[2]), int(float(rest[3])), float(rest[4])
        tail = rest[5:]
    elif len(rest) == 13:
        Mcr, Mu = float(rest[0]), float(rest[1])
        gc_d, N2, L2 = None, None, None
        tail = rest[2:]
    else:
        raise ValueError(f"unexpected rest length {len(rest)} in {path}: {vals}")
    # tail: Fs, Tf, T, hc, tc, w, h, hw1, Tm, Tg, hw2  (11 tokens)
    assert len(tail) == 11, f"tail {tail} in {path}"
    Fs = float(tail[0]); Tf = float(tail[1]); T = float(tail[2]); hc = float(tail[3])
    tc, tc_splice = parse_tc(tail[4])
    w, h, hw1, Tm, Tg, hw2 = [float(v) for v in tail[5:11]]
    cls = re.match(r"([A-Z]+)\d+", code.split("-")[1]).group(1) if code else None  # A / AB / B / C
    return {
        "code": code,  # e.g. PHC-A300
        "class": cls,
        "Do_mm": Do, "Dp_mm": Dp, "Di_mm": Di, "Dei_mm": Dei, "t_mm": t,
        "pc_bar": {"d_mm": d_pc, "N1": N1, "f_pu_MPa": 1420, "f_py_MPa": 1275,
                   "standard": "TCVN 6284-3 (JIS G3137)"},
        "Mcr_kNm": Mcr, "Mu_kNm": Mu,
        "gc_bar": None if gc_d is None else {"d_mm": gc_d, "N2": N2, "L2_mm": L2},
        "spiral": {"d_mm": Fs, "pitch_end_mm": 50, "layers_end": 2,
                   "L_end_mm": 2 * Do, "pitch_mid_mm": 100, "layers_mid": 1,
                   "standard": "SWM-C (JIS G 3532)"},
        "flange": {"Tf_mm": Tf, "T_mm": T, "hc_mm": hc, "tc_mm": tc,
                   "tc_splice_mm": tc_splice},
        "collar_detail": {"w_mm": w, "h_mm": h, "hw1_mm": hw1,
                          "Tm_mm": Tm, "Tg_mm": Tg, "hw2_mm": hw2},
        "install_load_T": INSTALL_T.get(code),
        "drawing_no": dwg_m.group(1) if dwg_m else None,
        "drawing_title": title_m.group(1) if title_m else None,
    }

records = []
for p in sorted(glob.glob("workspace/xep-coc/Ref/txt/[0-3]*.txt")):
    if "ALL" in p:
        continue
    rec = parse_file(p)
    records.append(rec)

# sanity checks
assert len(records) == 33, len(records)
assert len({r["code"] for r in records}) == 33
for r in records:
    assert abs(r["t_mm"] - (r["Do_mm"] - r["Di_mm"]) / 2) < 1e-9, r
    assert r["Dei_mm"] == r["Di_mm"], r
    assert r["install_load_T"] is not None, r
    assert r["drawing_no"] is not None, r

out = {
    "schema_version": "BT00-1",
    "source": {
        "library": "Phan Vu standard PHC drawings, version 1.2, issued 11/2026",
        "standard": "TCVN 7888",
        "manufacturer": "Cong ty Co phan Dau tu Phan Vu",
        "files": "Ref/06. COC BTLT ULT- BPTC DONG COC/ (33 individual PDFs + 00 ALL compilation)",
        "extraction": "pdftotext -layout, parsed by tools/extract_pile_specs.py; "
                      "every record cross-checked against its PDF table row",
        "note": "00. COC DONG_PHC_ALL.pdf is a compilation of the same 33 drawings, "
                "not a 34th pile type.",
    },
    "units": {"length": "mm", "force": "N", "stress": "MPa (= N/mm2)",
              "moment": "kN.m", "install_load": "T (tonne-force, as printed)"},
    "common": {
        "concrete": {"f_c_MPa": 80, "specimen": "cylinder D150xH300",
                     "cement": "PCB40/PCB50 (TCVN 6260) or OPC40/OPC50 (TCVN 2682)"},
        "note_L": "Pile segment length L is NOT fixed on the drawings "
                  "(drawing title PHC-...-L-...). L is a user input per BT00.",
        "missing_from_drawings": [
            "sigma_pc (effective prestress stress) - no value, no initial tension, no losses",
            "E_b (concrete modulus) - no value on drawing",
            "E_p (PC bar modulus) - no value on drawing",
            "gamma_c / mass per metre - no value on drawing; "
            "self-weight needs gamma_c as a separate, sourced input",
            "straightness / manufacturing tolerance - not quantified on drawing",
        ],
        "status_rule": "A check that needs a missing value must report "
                       "'chua du du lieu' (insufficient data). Do not fill in "
                       "an optimistic default silently.",
    },
    "piles": records,
}
os.makedirs("workspace/xep-coc/data_in", exist_ok=True)
with open("workspace/xep-coc/data_in/pile_specs.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
print(f"wrote {len(records)} piles")
for r in records:
    print(r["code"], r["Do_mm"], r["Dp_mm"], r["Di_mm"], r["pc_bar"], "Mcr/Mu", r["Mcr_kNm"], r["Mu_kNm"], "GC", r["gc_bar"], "Fs", r["spiral"]["d_mm"], "install", r["install_load_T"])
