"""Clean known data errors and add a new YÖK Atlas year to data/programs.csv.

Usage:
    python scripts/update_from_yokatlas.py [--snapshot yokatlas_2026.json]

Without --snapshot the full tercih-kılavuz listing is fetched from the live
YÖK Atlas API (https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search). The
snapshot year is read from the API response (`yil`). The previous-year fields
of the snapshot (`gk1`, `minPuan1`, `basariSirasi1`) are used to fill or
correct the preceding year's statistics.

The script also fixes the DGS map name artefacts in data/dgs_map.csv.
Running it again with the same snapshot is a no-op.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import urllib.request
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
PROGRAMS = ROOT / "data" / "programs.csv"
DGS = ROOT / "data" / "dgs_map.csv"
API = "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search"

IDENTITY = ["level", "university", "university_type", "city", "faculty", "program_name",
            "score_type", "duration_years", "is_kktc_quota", "previous_program_code"]
LEVEL = {"LISANS": "Lisans", "ÖNLISANS": "Ön Lisans"}
UNI_TYPE = {"DEVLET": "Devlet", "VAKIF": "Vakıf", "KKTC": "KKTC", "YURTDIŞI": "Yurt Dışı"}
# 2025 catalogue headings that the guide parser wrongly carried over onto the
# programs of the following (foreign) universities.
MISPARSED_UNIS = {
    "YAKIN DOĞU ÜNİVERSİTESİ",
    "İÇİŞLERİ BAKANLIĞI VE MİLLİ SAVUNMA BAKANLIĞI ADINA SAĞLIK BİLİMLERİ ÜNİVERSİTESİNDE EĞİTİM ALACAKLAR",
}
LEGIT_API_UNIS = {"YAKIN DOĞU ÜNİVERSİTESİ", "SAĞLIK BİLİMLERİ ÜNİVERSİTESİ"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fetch_snapshot(size: int = 1000) -> list[dict]:
    rows, page = [], 0
    while True:
        body = json.dumps({"filters": {}, "page": page, "size": size,
                           "sortBy": "kilavuzKodu", "direction": "ASC"}).encode()
        req = urllib.request.Request(API, data=body, headers={
            "Content-Type": "application/json", "Accept": "application/json"})
        for attempt in range(5):
            try:
                data = json.load(urllib.request.urlopen(req, timeout=120))
                break
            except OSError:
                time.sleep(2 ** attempt)
        else:
            raise SystemExit(f"failed to fetch page {page}")
        rows += data["content"]
        if data["last"]:
            return rows
        page += 1
        time.sleep(0.5)


def tr_lower(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


def tr_title_word(w: str) -> str:
    w = tr_lower(w)
    return w[:1].replace("i", "İ").replace("ı", "I").upper() + w[1:]


def tr_title(s: str, keep: frozenset[str] = frozenset()) -> str:
    """Title-case an upper-case Turkish name, keeping mixed-case parts and the
    acronyms in `keep` (e.g. ODTÜ, KKTC) as they are."""
    small = {"ve", "ile", "veya", "için"}
    out = []
    for i, tok in enumerate(re.split(r"(\s+|-|/|\(|\))", s)):
        if not tok or re.fullmatch(r"\s+|-|/|\(|\)", tok) or not tok.isupper() or tok in keep:
            out.append(tok)
        elif "." in tok:
            parts = tok.split(".")
            out.append(".".join(p if len(p) <= 1 else tr_title_word(p) for p in parts))
        elif tr_lower(tok) in small and i > 0:
            out.append(tr_lower(tok))
        else:
            out.append(tr_title_word(tok))
    return "".join(out)


def squash(s: str) -> str:
    return re.sub(r"\s{2,}", " ", s).strip()


def num(v) -> str:
    """Format an API number the way the CSV stores it ('' for missing/zero sentinel)."""
    if v is None or v == "" or (isinstance(v, float) and pd.isna(v)):
        return ""
    f = float(v)
    if f == 0:
        return ""
    return str(int(f)) if f.is_integer() else repr(f)


def count(v) -> str:
    """Like num() but keeps a real zero (quotas/placements can be 0)."""
    if v is None or v == "" or (isinstance(v, float) and pd.isna(v)):
        return ""
    return str(int(float(v)))


# ---------------------------------------------------------------------------
# Cleaning of existing rows
# ---------------------------------------------------------------------------

def clean_programs(df: pd.DataFrame) -> None:
    # 32767 is the int16 maximum: a truncated value, not a real quota.
    # A zero quota on a program that received preferences is a missing value;
    # the placed_count of 0 on those rows is the same missing value.
    bad_quota = df.quota.isin(["32767", "0"])
    df.loc[bad_quota & (df.placed_count == "0"), "placed_count"] = ""
    df.loc[bad_quota, "quota"] = ""
    # Impossible zeros (OBP is 250-500; preference ranks start at 1).
    for col in ["avg_secondary_score", "avg_preference_rank", "quota_earthquake"]:
        df.loc[pd.to_numeric(df[col].replace("", None)) == 0, col] = ""
    # placed_count 0 while a placement score exists (morphax 2018): missing.
    df.loc[(df.placed_count == "0") & (df.min_placement_score != ""), "placed_count"] = ""
    for col in ["faculty", "program_name"]:
        df[col] = df[col].map(squash)


# ---------------------------------------------------------------------------
# New year from the API snapshot
# ---------------------------------------------------------------------------

def identity_from_api(api: pd.DataFrame, prev: pd.DataFrame, acronyms: frozenset[str]) -> pd.DataFrame:
    """Build identity columns for the snapshot, reusing the previous catalogue's
    spelling (ÖSYM guide casing, campus suffixes, KKTC towns) where it agrees."""
    uni_api = api.universiteAdi.str.replace(r" \([^()]*\)$", "", regex=True)
    common = api.index.intersection(prev.index)

    # Lookups learnt from programs present in both catalogues.
    p, a = prev.loc[common], api.loc[common]
    ok = ~p.university.isin(MISPARSED_UNIS) | uni_api.loc[common].isin(LEGIT_API_UNIS)
    key = a.universiteId.astype(str) + "|" + a.uniIlAdi.fillna("")
    uni_map = (pd.DataFrame({"k": key[ok], "u": p.university[ok], "t": p.university_type[ok],
                             "c": p.city[ok]})
               .groupby("k").agg(lambda s: s.mode().iat[0]))
    fac_known = pd.DataFrame({"id": a.fymkId.astype(str), "name": a.fymkAdi, "f": p.faculty}).query("f != ''")
    fac_by_id = fac_known.groupby("id").f.agg(lambda s: s.mode().iat[0])
    fac_by_name = fac_known.groupby("name").f.agg(lambda s: s.mode().iat[0])

    out = pd.DataFrame(index=api.index)
    out["level"] = api.birimTuruAdi.map(LEVEL)
    k = api.universiteId.astype(str) + "|" + api.uniIlAdi.fillna("")
    out["university"] = k.map(uni_map.u).fillna(uni_api)
    out["university_type"] = k.map(uni_map.t).fillna(api.universiteTuru.map(UNI_TYPE))
    fallback_city = api.uniIlAdi.where(api.universiteTuru != "YURTDIŞI", "YURTDIŞI").fillna("")
    out["city"] = k.map(uni_map.c).fillna(fallback_city)
    out["faculty"] = (api.fymkId.astype(str).map(fac_by_id)
                      .fillna(api.fymkAdi.map(fac_by_name))
                      .fillna(api.fymkAdi.map(lambda f: tr_title(f, acronyms)))
                      .map(squash))
    out["program_name"] = api.birimAdi.map(squash)
    out["score_type"] = api.puanTuru.fillna("")
    out["duration_years"] = api.ogrenimSuresi.map(count)
    out["is_kktc_quota"] = api.birimAdi.str.contains("KKTC Uyruklu").map({True: "true", False: "false"})
    out["previous_program_code"] = api.eskiKilavuzKodu.map(count)

    # Programs already in the previous catalogue keep its spelling unless the
    # API says the program now belongs to a different university/faculty or
    # was renamed. The guide spelling may add a campus suffix ("(Keşap)"), so
    # an API name that is a case-insensitive prefix of it counts as the same.
    p = prev.reindex(out.index)
    has = p.university.notna()
    same_uni = has & (~p.university.isin(MISPARSED_UNIS) | uni_api.isin(LEGIT_API_UNIS))
    for col in ["university", "university_type", "city"]:
        out.loc[same_uni, col] = p.loc[same_uni, col]
    api_fac = api.fymkAdi.map(tr_title).map(tr_lower)
    prefix = pd.Series([tr_lower(str(f)).startswith(af) for f, af in zip(p.faculty, api_fac)],
                       index=out.index)
    same_fac = has & (p.faculty != "") & prefix
    out.loc[same_fac, "faculty"] = p.loc[same_fac, "faculty"]
    same_name = has & pd.Series([tr_lower(str(o)).startswith(tr_lower(n))
                                 for o, n in zip(p.program_name, out.program_name)], index=out.index)
    out.loc[same_name, "program_name"] = p.loc[same_name, "program_name"]
    no_type = has & (out.score_type == "")
    out.loc[no_type, "score_type"] = p.loc[no_type, "score_type"]
    return out


def stats_from_api(api: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(index=api.index)
    out["quota"] = api.kontenjan.map(count)
    out["placed_count"] = api.gkY.map(count)
    out["min_placement_score"] = api.minPuan.map(num)
    out["last_placed_rank"] = api.basariSirasi.map(num)
    out["quota_general"] = api.kontenjan.map(count)
    out["quota_school_first"] = api.kontenjanObs.map(count)
    out["quota_martyr_veteran"] = api.kontenjanSgy.map(count)
    out["quota_woman_34plus"] = api.kontenjanY34.map(count)
    return out


def apply_previous_year(df: pd.DataFrame, api: pd.DataFrame, prev_year: str) -> None:
    """Fill / refresh the previous year's quota and placement from gk1/minPuan1/basariSirasi1."""
    prev = pd.DataFrame({"quota": api.gk1.map(count),
                         "min_placement_score": api.minPuan1.map(num),
                         "last_placed_rank": api.basariSirasi1.map(num)})
    # Previous-year code -> snapshot row. A program whose code changed carries
    # its old code in eskiKilavuzKodu; its previous-year figures belong to it.
    src = pd.Series(api.index, index=api.index)
    old = api.eskiKilavuzKodu.dropna().astype(int).astype(str)
    old = pd.Series(old.index, index=old.values)
    src = pd.concat([src, old[~old.index.isin(src.index) & ~old.index.duplicated()]])

    rows = df.index[(df.year == prev_year) & df.program_code.isin(src.index)]
    vals = prev.loc[src[df.loc[rows, "program_code"]].values].set_axis(rows)
    empty = df.loc[rows, "source"] == ""
    filled = empty & (vals.quota != "")
    df.loc[rows[filled], "quota"] = vals.quota[filled]
    df.loc[rows[filled], "source"] = "yokatlas"
    # Scores/ranks: fill blanks and pick up later YÖK Atlas revisions.
    for col in ["min_placement_score", "last_placed_rank"]:
        take = vals[col] != ""
        df.loc[rows[take], col] = vals.loc[take, col]


def add_year(df: pd.DataFrame, snapshot: list[dict]) -> pd.DataFrame:
    api = pd.DataFrame(snapshot)
    year = str(int(api.yil.iat[0]))
    prev_year = str(int(year) - 1)
    api.index = api.kilavuzKodu.astype(int).astype(str)
    df = df[df.year != year].copy()            # idempotent re-runs

    prev_cat = df[df.year == prev_year].set_index("program_code")
    apply_previous_year(df, api, prev_year)

    acronyms = frozenset(w for f in df.faculty.unique() for w in re.findall(r"[^\W\d_]+", f)
                         if len(w) > 1 and w.isupper())
    ident = identity_from_api(api, prev_cat, acronyms)
    new = ident.join(stats_from_api(api))
    new.insert(0, "year", year)
    new.insert(0, "program_code", new.index)
    new.insert(0, "source", "yokatlas")
    new = new.reindex(columns=df.columns, fill_value="")

    # A program's identity comes from its most recent year.
    in_new = df.program_code.isin(new.index)
    df.loc[in_new, IDENTITY] = ident.loc[df.loc[in_new, "program_code"], IDENTITY].values
    out = pd.concat([df, new], ignore_index=True)
    out["_y"] = out.year.astype(int)
    return out.sort_values(["program_code", "_y"]).drop(columns="_y").reset_index(drop=True)


# ---------------------------------------------------------------------------
# DGS map
# ---------------------------------------------------------------------------

def clean_dgs(g: pd.DataFrame) -> pd.DataFrame:
    # Footnote markers from the guide (e.g. "Endüstriyel Otomasyon *").
    g["associate_field_name"] = g.associate_field_name.str.replace(r"\s*\*+$", "", regex=True)
    for col in ["associate_field_name", "bachelor_program_name"]:
        g[col] = g[col].map(lambda s: tr_title(s) if s.isupper() else s)
    # Wrapped-line fragments glued onto names ("Turizm Rehberliği Tur",
    # "Kontrolü Gıda Mühendisliği"): a field code has one name, take the
    # most common spelling.
    canon = g.groupby("bachelor_field_code").bachelor_program_name.agg(lambda s: s.mode().iat[0])
    g["bachelor_program_name"] = g.bachelor_field_code.map(canon)
    return g


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", type=Path, help="saved YÖK Atlas search JSON (list of programs)")
    args = ap.parse_args()
    snapshot = json.loads(args.snapshot.read_text()) if args.snapshot else fetch_snapshot()

    df = pd.read_csv(PROGRAMS, dtype=str, keep_default_na=False)
    if "previous_program_code" not in df.columns:
        df.insert(df.columns.get_loc("is_kktc_quota") + 1, "previous_program_code", "")
    clean_programs(df)
    df = add_year(df, snapshot)
    df.to_csv(PROGRAMS, index=False, lineterminator="\n")

    g = clean_dgs(pd.read_csv(DGS, dtype=str, keep_default_na=False))
    g.to_csv(DGS, index=False, lineterminator="\n")


if __name__ == "__main__":
    main()
