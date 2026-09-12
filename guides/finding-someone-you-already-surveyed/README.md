# Finding someone you already surveyed

A guide for surveyors and coordinators, in English and Spanish, published at
**<https://puente-dr.github.io/guides/finding-someone-you-already-surveyed/>**

How to look a resident up before creating them again: which fields the search
reads, why typing a full name finds nothing, how ID search works, and how any of
it behaves with no signal.

## Why this guide exists

Resident search is the step that decides whether a visit joins a person's
history or starts a second one beside it. Nothing breaks when someone is entered
twice — which is exactly why it needs saying out loud. The app does not warn,
and the cost lands months later on whoever has to untangle it.

## Behaviour documented here is Collect 15.7.2 and later

§4, "Searching by ID", describes search matching `cedulaNumber` and
`householdId`. **Before 15.7.2 the placeholder said "Search by name or ID" and
the query only ever read `fname` and `lname`** — a cédula returned nothing.
`nickname` was also matched offline but not online, so the same search gave
different answers depending on signal. Do not backport §4's wording to an older
build.

## Every claim was measured, not assumed

The prefix behaviour in §3 is the most useful thing in the guide and the easiest
to get wrong, so it was checked against staging (app id `ZvGwjA7c…`,
2026-09-11) rather than read off the regex:

```
"Paciente"          -> 1    first name
"Ejemplo"           -> 2    last name
"Paciente Ejemplo"  -> 0    a full name matches NOTHING
"ciente"            -> 0    the middle of a word matches nothing
"PACIENTE"          -> 1    case is irrelevant
"paciente"          -> 1
```

The search anchors on the **start of one field** (`^query`, case-insensitive)
across `fname`, `lname`, `nickname`, `cedulaNumber` and `householdId`. It is an
OR across five fields, never a match spanning two of them — which is why a full
name finds no one.

`cedulaNumber` is labelled "License Number" in `en.json` and "Número de cedula"
in `es.json`. The guide calls it the cédula because that is what a surveyor
holding the card calls it.

## The screenshots

Captured from the real app by `.maestro/capture-find-records-docs.yaml` in
`puente-reactnative-collect`, against a booted simulator on staging:

```
yarn start:staging-clear            # Metro FIRST
yarn maestro .maestro/capture-find-records-docs.yaml
```

| Image | Shows | Section |
|---|---|---|
| `find-01-search-by-name` | a surname matching two residents | §2 |
| `find-02-search-by-id` | a cédula prefix matching one | §4 |
| `find-03-resident` | the resident page, with View Record History | §5 |
| `find-04-record-history` | what has already been collected about them | §5 |
| `find-05-storage-limit` | Settings → Find Records, stored count and limit | §6 |

**Every person in these images is invented.** "Paciente Ejemplo" (nickname
"Fulano") and "Ejemplo Ramirez" are synthetic staging fixtures. Resident search
shows REAL residents, so the search terms in the capture flow are deliberately
chosen to return only those two — verified before capture. **Do not broaden
them.** A single letter returns real people, and staging carries production
organization names since 2026-09-08. If staging is reseeded and these rows
disappear, re-derive terms that return only invented records rather than
capturing whatever comes back.

The two search shots tap a result card once before capturing. That first tap is
consumed dismissing the keyboard and leaves the list in place, which is the only
reason the images show results instead of half a keyboard.

### The screenshots are in both languages

`assets/img/` is English, `assets/img/es/` is Spanish, and the language toggle
swaps them along with the text. Fixed 2026-09-11; it was a known gap before
that, and the Spanish page showed an English app.

`.maestro/capture-guide-docs.sh both` in `puente-reactnative-collect` does the
whole thing: it sets the simulator's language, restarts it (Collect reads the
locale once at launch, so relaunching the app is not enough), and runs both
capture flows per language.

The flow selectors match **English or Spanish** — Maestro matches text as a
regex, so `"Search Individual|Buscar individuo"` covers both. That is
deliberately not a variable: a flow-file `env:` default *overrides* `-e` on the
command line in this version of Maestro, which silently kept the English
selectors through an entire Spanish run before it was found.

## Publishing

Served from [`puente-dr/puente-dr.github.io`](https://github.com/puente-dr/puente-dr.github.io).
Nothing to build; edit `index.html` and push.

## Licence

Puente Collect, which this guide documents, is source-available under the
Business Source License 1.1 and converts to the Apache License 2.0 on
5 June 2029.

Questions: info@puente-dr.org
