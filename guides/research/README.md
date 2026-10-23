# Research guides

A landing page and three guides, in English and Spanish, for a clinic whose data feeds a research
study, published under **<https://puente-dr.github.io/guides/research/>**:

| Guide | For |
|---|---|
| `designing-a-form-for-research/` | before the clinic: columns, pick lists, consent, a test export |
| `running-a-clinic-day/` | the coordinator and on-site tech lead: before, during, each evening, when something breaks |
| `sharing-data-with-researchers/` | what the research file contains, what it leaves out, what to do before sending |

Written for the Rayjon Eyes vision clinics in Constanza and Sosúa (November
2026) and the McMaster University study that uses their data. The plan behind
them is `puente-react-nextjs-platform/docs/vision-clinic-research-prd-edd.md`.

## Every quoted phrase is the app's own wording

Collect strings are copied from `modules/i18n/english/en.json` and
`modules/i18n/spanish/es.json` in `puente-reactnative-collect`
(`forms.offlineBanner`, `forms.savedOffline`, `offlineSync.title`,
`offlineSync.queuedTitle`, `offlineSync.noForms`, `offlineSync.stillOnDevice`,
`header.retry`). Manage strings are copied from `public/locales/{eng,spa}/common.json`
(`form_creator_type_*`, `export_research_button`, `export_full_records_button`,
`form_manager_research_badge`, `form_creator_allow_research_export`). If a string
changes in an app, change it here too.

## What the sharing guide claims, and where it was checked

- **The column list** is `ALLOWED_COLUMNS` in
  `puente-flask-rest-aggregator/api/data_aggregation_v2/dicts/research.py`. The
  allow-list was run against the seven largest custom forms in production on
  2026-10-23; no identifying column reached any of them. Only column names and
  counts were read, never values.
- **"Usually one of the two ages is filled."** On those seven forms, 90–99% of
  rows carry `age_at_visit` or `age_as_reported`. Collect stores `00/00/0000`
  when the birth date is unknown and the surveyor types an age; that typed age
  is what `age_as_reported` carries.
- **Consent rows are NOT removed automatically.** The research file contains
  every submission. The guide tells the coordinator to delete "No" rows by hand
  until the export can do it.

## The pictures

**Manage** screenshots and **animations** (the site's first GIFs) are captured
from the real interface by two scripts in `puente-react-nextjs-platform`. Neither
logs in: every backend answer is a stub, and every form, person and organization
is invented (`e2e/research-export-stubs.mjs`).

```
yarn dev                                   # in another shell
node e2e/capture-research-export-docs.mjs  # screenshots, both languages
node e2e/capture-research-export-gifs.mjs  # animations, both languages (needs ffmpeg)
```

The GIF script draws a cursor and a click ripple, because headless video doesn't
show the mouse and a reader has to see where to click. GIFs are 960px wide at
12 fps, about 1–1.5 MB each, with `loading="lazy"`. Recorded at 1280×800, a
common laptop size, which is also how the Form Manager overflow at 1280px was
found and fixed.

| File | Shows | Used in |
|---|---|---|
| `research-gif-01-turn-on` | name a form, tick Allow research export, publish | designing |
| `research-gif-03-test-copy` | Duplicate, rename with PRUEBA, publish | designing |
| `research-gif-02-export` | expand the row, Refresh, Export research file | sharing |
| `research-00-form-manager` | the two buttons and the badge, beside a plain form | sharing |
| `research-03-allow-research-export` | the checkbox and its sentence | designing |
| `research-04-forms-collected` | Forms collected after Refresh | clinic day |

**Collect** pictures in *Running a clinic day* (`collect-0*`, `find-0*`) are the
real-app captures from *Collecting without a signal* and *Finding someone you
already surveyed*, copied with their alt text. Recapture them with those guides'
Maestro flows, not here.

## Spanish

Latin American Spanish, Claude-authored, **pending native review**, same as the
rest of the site.

## Publishing

Nothing to build; edit `index.html` and push. Run `python3 check-guides.py`
from the repository root first. It now recurses, so these nested guides are
checked too.
