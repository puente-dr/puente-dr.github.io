# How to create and manage organizations in Puente

A guide for coordinators and administrators, in English and Spanish, published at
**<https://puente-dr.github.io/guides/how-to-create-and-manage-orgs/>**

An *organization* in Puente is the name on the folder that holds a group's
survey records and their team's accounts. It decides which records each person
can see. This guide covers how a new one is created — from the phone app or by
Puente staff — and how to look after one: nicknames, approvals, deactivating
someone who has left, and retiring or merging.

The page has an English / Español toggle in the header. Spanish is Latin
American (*ustedes*). The choice is kept in `localStorage` and can be shared
with `?lang=es`.

## What is in here

| File | Purpose |
|---|---|
| `index.html` | The guide. Self-contained: no build step, no dependencies. A few lines of JavaScript run the language toggle. |
| `assets/img/` | Screenshots. The product UI in these images is not translated. |
| `.nojekyll` | Serves the files as-is instead of running them through Jekyll. |

## Publishing

This folder is served from [`puente-dr/puente-dr.github.io`](https://github.com/puente-dr/puente-dr.github.io)
at the path above. GitHub Pages uses the default branch root of that
repository:

**Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)`**

There is nothing to build. Editing `index.html` and pushing republishes the
page.

## The rule for screenshots

**Every organization, person and email address in these images is invented.**

Puente holds household survey data gathered in person, often in vulnerable
circumstances. The people surveyed consented to a survey, not to being
illustration material. So no image published here may contain real survey
records, real household or community names, real partner organization names, or
the details of any person in the data — not blurred, and not "just for the
demo".

The screenshots here were produced by running the real interface with its
backend responses replaced by synthetic data, so the interface is genuine while
none of the content is real. Keep it that way when updating them.

## Licence

Puente Manage, which this guide documents, is source-available under the
Business Source License 1.1 and converts to the Apache License 2.0 on
5 June 2029.

Questions: info@puente-dr.org

## The screenshots are in both languages

`assets/img/` is English, `assets/img/es/` is Spanish, and the language toggle
swaps them along with the text. All nine images, both languages.

The web screens come from `e2e/capture-org-docs.mjs` in
`puente-react-nextjs-platform`, which walks the same capture twice — once at
`/`, once at `/spa` — with every backend answer stubbed. The three phone screens
come from `.maestro/capture-org-signup-docs.yaml` in `puente-reactnative-collect`,
run by `.maestro/capture-guide-docs.sh both`.

**The only organization shown in the phone images is "Puente" — our own.** The
search term is `Pu`, which on staging matches exactly one organization; verified
against staging (59 organizations) before capturing. Do not broaden it: a
shorter prefix returns real partner organizations, and these images are
published. Every organization in the web images is invented.
