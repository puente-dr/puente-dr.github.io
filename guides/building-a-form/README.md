# Building a form that exports cleanly

A guide for coordinators and administrators, in English and Spanish, published at
**<https://puente-dr.github.io/guides/building-a-form/>**

The seven blocks Puente's form builder offers, what the phone can do that the
builder deliberately does not expose, and how the question you type becomes the
column heading in your spreadsheet.

## Everything here was verified against the code, not assumed

Two claims in this guide contradict what the team's own internal notes said, so
both were proven by running the real code before publishing.

**The column heading is your question text, not an internal key.** The exporter's
`coalesce_aliased_titles` collapses every alias of a field into one column named
by `field['label'] or field['formikKey']`. Running the real
`flatten_custom_fields`:

```
WITH form specifications:  ['Reading Program?', 'Cuantos ninos?']
WITHOUT specifications:    ['Cuantos ninos', 'Reading Program']
```

So `¿Cuántos niños?` becomes the column `Cuantos ninos?` — accents stripped and
the opening `¿` removed by `replace_spanish_characters`, the closing `?` kept.
`fetch_form_specifications` is best-effort by design ("failure must not fail the
download"), so a failed spec fetch silently falls back to the internal key. That
fallback is what the guide's note in §5 describes.

**Renaming a question no longer orphans its answers.** `nextFormikKey` in
`app/epics/FormCreator/_utils/index.js` takes a `keyFrozen` flag and returns the
existing key on a saved form instead of re-deriving it. With alias coalescing on
the export side, the reading-program failure mode is closed on both ends.

## The seven blocks are the whole palette

Taken from the `COLLECTION` array in `app/epics/FormCreator/index.js` — seven
entries, no more. Their names in the guide are Manage's own translation strings
(`form_creator_type_*` in `public/locales/{eng,spa}/common.json`), not
paraphrases.

Collect's `PaperInputPicker` renders **eighteen** field types. The eleven a
coordinator cannot create are `autofill`, `autofillms`, `household`, `photo`,
`loop`, `loopSameForm`, `multiInputRow`, `multiInputRowNum`,
`inputSideBySideLabel`, `inputSideLabelNum` and
`inputSideLabelTextQuestNumber`. Manage can *display* several of them — the
`NativeApplcationDrawer` preview and a `Loop` component under `FormTemplate` —
but there is no palette entry to create one.

§3 presents that gap as deliberate rather than hiding it. If the product decision
changes and any of those become creatable, §3 is the section to rewrite.

## The screenshots

Captured from the real Form Creator by `e2e/capture-form-docs.mjs` in
`puente-react-nextjs-platform`, with every backend answer stubbed. Sibling of
`capture-org-docs.mjs`, same reasoning and same rules:

```
yarn dev                            # in another shell
node e2e/capture-form-docs.mjs
```

| Image | Shows | Section |
|---|---|---|
| `manage-01-form-creator` | the whole builder | §1 |
| `manage-02-blocks-palette` | all seven blocks | §2 |
| `manage-04-blocks-on-canvas` | a question typed into a Number block | §4 |

Blocks are placed with the **keyboard** (`Space` to lift, arrows, `Space` to
drop) rather than synthetic mouse drags — far more reliable to automate, and it
exercises the accessible path. If a lift stops working, that is a real finding.

**Everything on screen is invented**: the form is "Water access — Example
Community", the user is `ada@example.org`, and no real partner appears.

### One shot deliberately not published

`manage-05-inspector` is captured but **not used**. It shows a Number-response
block labelled "How many people live in this house?" whose **Formik key reads
`geolocation_…`**. Either the key is seeded from the wrong block or the Inspector
renders the wrong one; it was not diagnosed. Publishing it would teach the reader
something untrue about how keys relate to questions. **Worth investigating** —
and if it turns out to be a display bug, this image is the reproduction.

## Publishing

Served from [`puente-dr/puente-dr.github.io`](https://github.com/puente-dr/puente-dr.github.io).
Nothing to build; edit `index.html` and push.

## Licence

Puente Manage, which this guide documents, is source-available under the Business
Source License 1.1 and converts to the Apache License 2.0 on 5 June 2029.

Questions: info@puente-dr.org
