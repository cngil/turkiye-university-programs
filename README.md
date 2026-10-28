# Türkiye University Programs Dataset

A clean, connected dataset of Turkish higher-education programs: the full 2026
program catalogue (associate and bachelor), yearly admission statistics from
2015 to 2026, and the DGS vertical-transfer map (which bachelor programs each
associate field can transfer into).

All values that name a real entity (university, faculty, program) are kept in
Turkish, as published by the official sources. Column names, codes, and
documentation are in English.

## Coverage

- **21,493** distinct 2026 programs (9,254 associate, 12,239 bachelor)
- **215,219** program-year rows spanning **2015-2026** (35,937 distinct programs)
- **20,030** of the 2026 programs carry at least one earlier year of history
- **13,426** DGS associate-to-bachelor transfer pairs

## Files

All files are UTF-8 CSV in `data/`. Missing values are empty strings.

### `programs.csv` - programs and yearly statistics (one row per program-year)

The single main table. One row per (`program_code`, `year`); a program's
identity columns repeat on each of its yearly rows. The first column, `source`,
records which aggregator the row's statistics came from (see Sources).

Program identity:

| column | description |
|---|---|
| `program_code` | Stable YÖK Atlas program id. |
| `year` | Admission year, 2015-2026. |
| `level` | `Ön Lisans` (2-year associate) or `Lisans` (4-year+ bachelor). |
| `university` | University name (Turkish). |
| `university_type` | `Devlet` (state), `Vakıf` (foundation), `KKTC` (Northern Cyprus), or `Yurt Dışı` (abroad). |
| `city` | University province. A few special institutions may be blank. |
| `faculty` | Faculty / vocational school name (Turkish). |
| `program_name` | Program name (Turkish). |
| `score_type` | Score type: `TYT`, `SAY`, `EA`, `SÖZ`, `DİL`. |
| `duration_years` | Nominal program length in years (2025/2026 catalogue programs only). |
| `is_kktc_quota` | `true` if the program is a Northern-Cyprus-nationals sub-quota (2025/2026 catalogue programs only). |
| `previous_program_code` | For 2026 programs whose ÖSYM code changed, the code they had before (`eskiKilavuzKodu`). Rows under the old code hold the earlier years. |

Yearly statistics (for that program in that year):

| column | description |
|---|---|
| `quota` | Quota that year. `izcir`/`morphax` rows: total quota. `yokatlas` rows (2025-2026): general quota (genel kontenjan) only; the sub-quotas are in the `quota_*` columns. |
| `placed_count` | Students placed. `yokatlas` rows: placed through the general quota, which includes unfilled sub-quota seats moved into it, so it can exceed `quota`. |
| `min_placement_score` | Lowest placement score (taban puanı). |
| `max_placement_score` | Highest placement score, where available (2020-2024). |
| `last_placed_rank` | Success rank of the last placed student (başarı sırası). |
| `placed_male`, `placed_female` | Placed students by gender. |
| `avg_secondary_score` | Average secondary-school achievement points (OBP) of placed students. |
| `total_preferences` | Total number of preferences listing this program. |
| `demand_per_quota` | Preferences per quota slot. |
| `avg_preference_rank` | Average position of this program on applicants' preference lists. |

Quota breakdown (populated only on `year` = 2025 and 2026 rows):

| column | description |
|---|---|
| `quota_general` | General quota. |
| `quota_school_first` | High-school-valedictorian quota. |
| `quota_martyr_veteran` | Martyr / veteran relatives quota. |
| `quota_woman_34plus` | Women aged 34+ quota. |
| `quota_earthquake` | Earthquake-victim quota (2025 only; the YÖK Atlas listing no longer reports it for 2026). |

Not every column is populated for every year; older years carry fewer fields.
A program's identity columns come from the most recent year it appears in.
Programs that are not in the 2026 catalogue keep the identity of their latest
earlier year.

### `dgs_map.csv` - DGS vertical-transfer map (2026)

Which bachelor programs an associate-degree field may transfer into via the DGS
exam. **Note:** the codes here are ÖSYM field (alan) codes, not the 9-digit
`program_code` used in the catalogue.

| column | description |
|---|---|
| `group_id` | Transfer group. An associate field may appear in more than one group. |
| `associate_field_code` | Associate field (alan) code. |
| `associate_field_name` | Associate field name (Turkish). |
| `bachelor_program_name` | Target bachelor program name (Turkish). |
| `bachelor_field_code` | Target bachelor field (alan) code. |
| `score_type` | Score type of the target bachelor program. |

## Sources

| `source` value | Origin | Years | License |
|---|---|---|---|
| `morphax` | [MorphaxTheDeveloper/yokatlas-dataset-2025](https://github.com/MorphaxTheDeveloper/yokatlas-dataset-2025) | 2015-2018 | none stated |
| `izcir` | [izcir/turkish-university-admissions-dataset](https://github.com/izcir/turkish-university-admissions-dataset) | 2019-2024 | MIT |
| `yokatlas` | Live [YÖK Atlas](https://yokatlas.yok.gov.tr) fetch via [yokatlas-py](https://github.com/saidsurucu/yokatlas-py) / its tercih-kılavuz API | 2025-2026 | public data |
| *(empty)* | 2025 catalogue program with no published statistics | 2025 | - |

The 2025 catalogue and the DGS transfer map are parsed from the official 2025
ÖSYM and 2026 DGS guides. The 2026 catalogue and statistics come from the YÖK
Atlas tercih-kılavuz listing (fetched 2026-10-28); where a program's name,
faculty or university agrees with the 2025 guide, the guide's spelling is kept.
The two community datasets share the
same underlying YÖK Atlas data and overlap on 2019-2024, so each era is taken
from a single source to avoid conflicting duplicates. See `ATTRIBUTION.md`.

## Notes and caveats

- `min_placement_score` is computed with the secondary-school-points (OBP)
  coefficient in force that year: 0.12 before 2022, 0.18 from 2022 on.
  `last_placed_rank` is the stable metric for cross-year comparison.
- 2025-2026 statistics come from YÖK Atlas; programs that were not filled or
  are newly opened have no scores, so those fields are blank. Placement gender,
  OBP and preference statistics are not published there, so they are blank too.
- Because `quota` is the total quota up to 2024 and the general quota from 2025,
  it is not directly comparable across that boundary; use `quota_general` plus
  the other `quota_*` columns for a 2025/2026 total.
- Missing values are normalized to empty strings across all sources; the
  `morphax` source's `-1` "no data" sentinel and impossible zero scores/ranks
  are cleaned to empty, and a program-year row with no data at all is dropped.
  Also cleaned to empty: the truncated quota `32767` (int16 max), zero quotas
  (and the zero placed count on those rows), zero OBP averages, zero average
  preference ranks, and a zero placed count on rows that do have a placement score.
- Corrected parsing errors in the 2025 guide data: 659 rows of foreign
  universities (Manas, Hoca Ahmet Yesevi, Saraybosna, Balkan, Tiran,
  Azerbaycan Devlet Pedagoji) had been filed under `YAKIN DOĞU ÜNİVERSİTESİ` or
  the İçişleri/MSB SBÜ heading, so no 2025 program was `Yurt Dışı`. In the DGS
  map, wrapped-line fragments glued onto names ("Turizm Rehberliği Tur",
  "Kontrolü Gıda Mühendisliği"), footnote stars and all-caps names were
  normalized.
- 2025 programs that had no statistics got their 2025 quota, score and rank
  from the 2026 listing's previous-year fields.
- Known upstream anomalies that are kept as published:
  - `morphax` ranks for 2015, 2016 and 2018 are mostly rounded to the nearest
    thousand.
  - `placed_male + placed_female` differs from `placed_count` on about 3,800
    rows in 2021, 2,600 in 2018 and 50 in 2024.
  - About 670 rows in 2021 (`izcir`) and 290 in 2017 (`morphax`) have a rank
    but no score.
  - For roughly 8-9% of 2023-2024 programs, the `izcir` minimum score differs
    slightly (usually higher, median +0.3 points) from the value YÖK Atlas
    publishes today.
- Values are otherwise passed through from upstream sources.

## License

This compilation is released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Upstream components retain their own terms; see `ATTRIBUTION.md`.
