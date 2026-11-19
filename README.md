# Puente Docs

The documentation for Puente Collect and Puente Manage, in English and Spanish.
Published at **<https://puente-dr.github.io/docs/>**.

Built with [Astro Starlight](https://starlight.astro.build/). Pushing to `main`
builds and deploys it with GitHub Actions (`.github/workflows/deploy.yml`).

## Working on it

```bash
npm ci
npm run dev          # http://localhost:4321/docs/ — live reload
npm run build        # builds dist/, then lays out _site/ for GitHub Pages
npm run check        # the evidence check (below); run after build
npm run preview      # serves _site/ at http://localhost:8091/docs/
```

Pages are MDX files in `src/content/docs/`. English is at the root of that
folder and Spanish under `es/`, at the same path. **Every page exists in both
languages**; the check fails otherwise.

| Section | Folder | What belongs there |
|---|---|---|
| Get started | `get-started/` | Welcome, the two "start here" pages, glossary |
| Puente Collect | `collect/` | One article per screen or job in the phone app |
| Puente Manage | `manage/` | One article per screen in the web app |
| Organizations and people | `organizations/` | Organizations, members, administrators, nicknames |
| Data and exports | `data/` | Exporting, reading the files, research exports |
| Privacy and security | `privacy/` | Protecting data, deleting an account (linked from Google Play) |
| Help | `help/` | Troubleshooting, contacting support |
| Guides | `guides/` | Walkthroughs for one of two roles: data collector or data manager |

The sidebar order lives in `astro.config.mjs`. Guides need `roles`, `format`,
`minutes` and `thumbnail` in their front matter; they appear on the guides list
automatically.

## How a page is written

Reference documentation, measured against Linear's docs and Notion's help
guides. A plain opening paragraph; at least five task-shaped `##` sections;
screenshots with alt text and captions; a callout where a warning really
belongs; often an FAQ; `related:` articles in the front matter. No quizzes, no
learning-outcome boxes. No pricing or selling — puente-dr.org owns that.

- **Interface labels** are wrapped in `<UI>…</UI>`, exactly as the app shows them
  in that page's language.
- **Every claim about how the apps behave** carries `{/* claim: id */}` and an
  entry in `tools/check/claims/<section>.json`: the source file and a verbatim
  quote. `node tools/check/pin.mjs <ledger>` fills in the line numbers.
- **Screenshots** are in `src/assets/shots/en/` and `src/assets/shots/es/` under
  the same names, and contain only invented people and organizations. They are
  produced by `tools/capture/manage.mjs` (Manage, every backend answer stubbed)
  and the Maestro flows in `puente-reactnative-collect/.maestro/` (Collect,
  against staging), and cropped where a development-only control showed.

## The checks

`npm run check` (`tools/check/content.mjs`) fails the build when:

1. a quoted interface label is not in the app's own text for that language
   (`tools/check/locales/`, copied from the apps — see its `SOURCE.md`);
2. a claim has no evidence, or — when the app repositories are checked out
   beside this one — its quote is no longer where the ledger says;
3. an internal link or anchor is broken;
4. a page exists in only one language;
5. quiz or course furniture appears.

`npm run floor:check` (`tools/floor/`) measures the built site against Linear's
docs and Notion's help guides — crawled by `npm run floor:crawl` — and fails if
Puente falls below them on article features (search, sidebar, breadcrumbs,
on-page contents, related articles, callouts, feedback), screenshots and sections
per article, dark mode, language switching, or phone layout. It writes a
side-by-side report to `tools/floor/report/index.html`.

## Publishing

GitHub Pages must be set to **Settings → Pages → Source: GitHub Actions**. The
workflow publishes `_site/`:

- `/docs/` — the documentation;
- `/` — redirects to `/docs/`;
- `/guides/delete-your-account/` — redirects to `/docs/privacy/delete-your-account/`.
  Google Play's data-safety form links the old address; keep this redirect until
  that form is updated.

The old hand-written guides that lived under `/guides/` were replaced by this
site in November 2026; their content was carried into the articles here.

Questions: info@puente-dr.org · Privacy policy: <https://www.puente-dr.org/privacy-policy/>
