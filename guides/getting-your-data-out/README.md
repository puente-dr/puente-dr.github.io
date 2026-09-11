# Getting your data out

A guide for coordinators, in English and Spanish, published at
**<https://puente-dr.github.io/guides/getting-your-data-out/>**

What the Export button gives you: one file per form, one row per record, and the
handful of places where the spreadsheet means something slightly different from
what the app showed.

## Why this guide exists

The export is the copy that leaves Puente. It is what a funder, a ministry or an
analyst actually reads, usually months later and without anyone to ask. Every
transformation between the phone screen and that file is invisible at the moment
it matters, so each one is written down here.

Four of them will mislead a careful person who is not expecting them:

- the people file **de-duplicates**, so its row count is not a record count
- `age` is **this year minus the birth year**, not an age
- **accents are stripped from custom-form exports only**, so the same community
  is spelled two ways across two files
- **"no records yet" and "could not be completed" are different things**

## Every claim was run, not read off the code

The transformations were exercised directly against the export service's own
functions with **invented records**, on 2026-09-11. Nothing in this guide came
from reading the source and inferring what it would do, and no production
records were touched — an export IS partner data.

```
3 person records in  ->  2 rows out          # two agreeing records collapse
dob 1983-12-26       ->  age 43              # on 11 Sep 2026, when she is 42
dob "Mon Dec 26 1983 11:53:53 GMT-0800 (…)"  ->  age blank, row still exported
1 person, 3 visits   ->  3 rows              # person columns repeated
visit with no person ->  1 row, person columns blank

Comunidad Peña   -> Comunidad Peña   in Vitals / people / env-health
Comunidad Peña   -> Comunidad Pena   in a custom-form export
"¿Tiene baño?"   -> "Tiene bano?"    column heading, custom-form export
```

The accent asymmetry is the one a code-read gets wrong: the stripping lives in
the custom-form flattening step, so it never touches the four Puente exports.

## The screenshots

Captured from the real interface by `e2e/capture-export-docs.mjs` in
`puente-react-nextjs-platform`, with every backend answer stubbed:

```
yarn dev                          # in another shell
node e2e/capture-export-docs.mjs  # writes both languages
```

| Image | Shows | Section |
|---|---|---|
| `export-01-form-manager` | Form Manager, one Export button per form | §2 |
| `export-02-export-buttons` | the table of Puente forms and their buttons | — |
| `export-03-no-records-yet` | the message for a form with no results | §10 |
| `export-04-export-failed` | the message for a download that broke | §10 |

**Every organization, form and person in these images is invented.** The screen
lists a real organization's forms and its record counts, and the export itself
is partner data, so this capture never logs in — the interface is genuine and
every backend answer is a stub.

### The screenshots are in both languages

`assets/img/` is English, `assets/img/es/` is Spanish, and the language toggle
swaps them along with the text. The capture script drives the app twice, once
per locale, in a single run.

This is new as of 2026-09-11; the four earlier guides shipped English
screenshots on their Spanish pages. Their pages carry the same swapping code, so
each becomes bilingual as soon as its Spanish capture set lands.

Photographing the Spanish page is also what found two buttons that had never
been translated — the Spanish Form Manager rendered `Export` and `+ Create
form` in English. Fixed in `puente-react-nextjs-platform` before these images
were taken.

## Publishing

Served from [`puente-dr/puente-dr.github.io`](https://github.com/puente-dr/puente-dr.github.io).
Nothing to build; edit `index.html` and push.

## Licence

Puente Collect, which this guide documents, is source-available under the
Business Source License 1.1 and converts to the Apache License 2.0 on
5 June 2029.

Questions: info@puente-dr.org
