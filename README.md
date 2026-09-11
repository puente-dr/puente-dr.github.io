# puente-dr.github.io

Public GitHub Pages for Puente guides. Published at
**<https://puente-dr.github.io/>**

There is nothing to build. Edit the HTML and push to `main`.

| Path | Guide |
|---|---|
| [`guides/`](guides/) | [Guide index](https://puente-dr.github.io/guides/) |
| [`guides/how-to-create-and-manage-orgs/`](guides/how-to-create-and-manage-orgs/) | [How to create and manage organizations](https://puente-dr.github.io/guides/how-to-create-and-manage-orgs/) |
| [`guides/collecting-without-a-signal/`](guides/collecting-without-a-signal/) | [Collecting without a signal](https://puente-dr.github.io/guides/collecting-without-a-signal/) |
| [`guides/building-a-form/`](guides/building-a-form/) | [Building a form that exports cleanly](https://puente-dr.github.io/guides/building-a-form/) |
| [`guides/finding-someone-you-already-surveyed/`](guides/finding-someone-you-already-surveyed/) | [Finding someone you already surveyed](https://puente-dr.github.io/guides/finding-someone-you-already-surveyed/) |
| [`guides/getting-your-data-out/`](guides/getting-your-data-out/) | [Getting your data out](https://puente-dr.github.io/guides/getting-your-data-out/) |

The old path `/how-to-create-and-manage-orgs/` redirects to the guide above.

## Every guide is bilingual

English and Spanish live in the same `index.html`, as sibling nodes marked
`lang="en"` / `lang="es"`, and the toggle in the masthead switches between them.
The screenshots switch too: `assets/img/` is English and `assets/img/es/` is
Spanish, paired on each `<img>` by `data-src-en` / `data-src-es`.

**A node written in only one language does not fall back — it disappears.** The
stylesheet hides the other language outright, so an untranslated paragraph is a
silent gap on the Spanish page rather than an English paragraph. Check before
pushing:

```bash
python3 check-guides.py
```

It verifies that every translatable node exists in both languages, that every
image referenced is actually present, and that the hand-edited HTML closes. All
three failures are invisible in a browser until someone hits them — the first
two only in Spanish.

`how-to-create-and-manage-orgs` is the one guide whose screenshots are still
English only; its own README says what is needed.

## Publishing

GitHub Pages, served from the default branch root of this repository
(`puente-dr/puente-dr.github.io`):

**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**

A guide lives at `https://puente-dr.github.io/guides/<folder>/` when that folder
contains an `index.html`. `.nojekyll` at the repo root serves the files as-is
instead of running them through Jekyll.

Questions: info@puente-dr.org
