# Türkiye University Programs Dataset

A clean, connected dataset of Turkish higher-education programs: the full 2025
program catalogue (associate and bachelor), yearly admission statistics from
2015 to 2025, and the DGS vertical-transfer map (which bachelor programs each
associate field can transfer into).

All values that name a real entity (university, faculty, program) are kept in
Turkish, as published by the official sources. Column names, codes, and
documentation are in English.

## Coverage

- **21,602** distinct 2025 programs (9,337 associate, 12,265 bachelor)
- **193,726** program-year rows spanning **2015-2025**
- **21,476** of the 2025 programs carry at least one year of history
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
| `year` | Admission year, 2015-2025. |
| `level` | `Ön Lisans` (2-year associate) or `Lisans` (4-year+ bachelor). |
| `university` | University name (Turkish). |
| `university_type` | `Devlet` (state), `Vakıf` (foundation), `KKTC` (Northern Cyprus), or `Yurt Dışı` (abroad). |
| `city` | University province. A few special institutions may be blank. |
| `faculty` | Faculty / vocational school name (Turkish). |
| `program_name` | Program name (Turkish). |
| `score_type` | Score type: `TYT`, `SAY`, `EA`, `SÖZ`, `DİL`. |
| `duration_years` | Nominal program length in years (2025 catalogue programs only). |
| `is_kktc_quota` | `true` if the program is a Northern-Cyprus-nationals sub-quota. |

Yearly statistics (for that program in that year):

| column | description |
|---|---|
| `quota` | Total quota that year. |
| `placed_count` | Students placed / enrolled. |
| `min_placement_score` | Lowest placement score (taban puanı). |
| `max_placement_score` | Highest placement score, where available (2020-2024). |
| `last_placed_rank` | Success rank of the last placed student (başarı sırası). |
| `placed_male`, `placed_female` | Placed students by gender. |
| `avg_secondary_score` | Average secondary-school achievement points (OBP) of placed students. |
| `total_preferences` | Total number of preferences listing this program. |
| `demand_per_quota` | Preferences per quota slot. |
| `avg_preference_rank` | Average position of this program on applicants' preference lists. |

2025 quota breakdown (populated only on `year` = 2025 rows):

| column | description |
|---|---|
| `quota_general` | General quota. |
| `quota_school_first` | High-school-valedictorian quota. |
| `quota_martyr_veteran` | Martyr / veteran relatives quota. |
| `quota_woman_34plus` | Women aged 34+ quota. |
| `quota_earthquake` | Earthquake-victim quota. |

Not every column is populated for every year; older years carry fewer fields.
Programs offered before 2025 but not in the 2025 catalogue take their identity
from the most recent year available.

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
| `yokatlas` | Live [YÖK Atlas](https://yokatlas.yok.gov.tr) fetch via [yokatlas-py](https://github.com/saidsurucu/yokatlas-py) | 2025 | public data |

The catalogue and DGS transfer map are parsed from the official 2025 ÖSYM and
2026 DGS guides. The two community datasets share the
same underlying YÖK Atlas data and overlap on 2019-2024, so each era is taken
from a single source to avoid conflicting duplicates. See `ATTRIBUTION.md`.

## Notes and caveats

- `min_placement_score` is computed with the secondary-school-points (OBP)
  coefficient in force that year: 0.12 before 2022, 0.18 from 2022 on.
  `last_placed_rank` is the stable metric for cross-year comparison.
- 2025 statistics come from YÖK Atlas; programs newly opened in 2025 (and some
  restricted ones) have no scores yet, so those fields are blank.
- Missing values are normalized to empty strings across all sources; the
  `morphax` source's `-1` "no data" sentinel and impossible zero scores/ranks
  are cleaned to empty, and a program-year row with no data at all is dropped.
- Values are otherwise passed through from upstream sources; occasional upstream
  anomalies may remain.

## License

This compilation is released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Upstream components retain their own terms; see `ATTRIBUTION.md`.
