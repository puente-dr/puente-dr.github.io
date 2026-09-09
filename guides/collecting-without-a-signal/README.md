# Collecting without a signal

A guide for surveyors and coordinators, in English and Spanish, published at
**<https://puente-dr.github.io/guides/collecting-without-a-signal/>**

What Puente Collect does with a survey when there is no connection: how it is
saved, where it waits, how to send it later, what a partial sync means, and why
discarding is permanent.

The page has an English / Español toggle in the header. Spanish is Latin
American. The choice is kept in `localStorage` and can be shared with `?lang=es`.

## Every quoted phrase is the app's own wording

The strings in this guide were taken from Collect's translation files
(`modules/i18n/english/en.json` and `modules/i18n/spanish/es.json`), not
paraphrased. A guide that names a button differently from the app is worse than
no guide, because it makes the reader doubt they are in the right place.

If a string changes in the app, change it here too. The keys used are:

| Section | Keys |
|---|---|
| Knowing you are offline | `forms.offlineBanner`, `bottomTab.offline` |
| Saving a survey | `forms.successfullySubmitted`, `forms.savedOffline` |
| Where they wait | `offlineSync.title`, `.queuedTitle`, `.queuedMany`, `.noForms`, `.lastSync` |
| Sending them | `header.submitOffline`, `header.retry`, `header.justSubmitted` |
| When none go | `offlineSync.failedOffline`, `.failedOnline`, `.stillOnDevice` |
| Discarding | `offlineSync.discardTitle`, `.discardWarning`, `.discardConfirm` |
| Before you log out | `accountSettings.logoutUnsyncedWarning`, `.logoutBlockedOfflineTitle` |

Note one deliberate inconsistency left as-is: the app's Spanish mixes *tú*
(`forms.offlineBanner`) with *usted* (`header.justSubmitted`). Quotes here match
the app exactly rather than smoothing it over. Worth fixing in the app, not in
the guide.

## Behaviour documented here is Collect 15.7.1 and later

Section 6, "When some go and some do not", describes behaviour introduced in
**15.7.1**. Before that release a partially-failed sync reported total failure
and kept the whole queue, so a retry could create duplicate health records.
Do not backport this section's wording to describe an older build.

## What is missing

**Screenshots.** This guide ships text-only. The organizations guide is
illustrated and this one should be too — the offline states are visual and hard
to describe. The images needed:

| Wanted | Where it comes from |
|---|---|
| The offline banner on a form | `.maestro/offline-resident-id.yaml` |
| The Offline Sync screen with a queue | `.maestro/offline-multiple-forms.yaml` |
| "All caught up" empty state | `.maestro/offline-sync.yaml` |
| The discard confirmation | `.maestro/offline-discard-queued-form.yaml` |

Those Maestro flows already walk through exactly these states, so capturing them
is a matter of adding `takeScreenshot` steps rather than staging anything by
hand.

**The screenshot rule applies.** Every organization, person and email in a
published image must be invented. Note that staging was seeded with real
production organization names on 2026-09-08, so a screenshot taken against
staging can now capture real partner names — it could not before. Point capture
runs at synthetic data, or use an obviously fake organization.

## Publishing

Served from [`puente-dr/puente-dr.github.io`](https://github.com/puente-dr/puente-dr.github.io)
at the path above. GitHub Pages uses the default branch root. There is nothing
to build; editing `index.html` and pushing republishes the page.

## Licence

Puente Collect, which this guide documents, is source-available under the
Business Source License 1.1 and converts to the Apache License 2.0 on
5 June 2029.

Questions: info@puente-dr.org
