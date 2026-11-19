// Lay the built site out the way GitHub Pages serves this repository.
//
//   _site/                       Pages root (puente-dr.github.io)
//   _site/docs/                  the documentation (Astro's dist/)
//   _site/index.html             redirect to /docs/
//   _site/404.html               the docs' not-found page
//   _site/guides/delete-your-account/
//                                redirect to the new deletion page. Google Play's
//                                data-safety form links this URL, and Play needs
//                                it to work. Remove only after that form changes.
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';

const OUT = '_site';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/docs`, { recursive: true });
cpSync('dist', `${OUT}/docs`, { recursive: true });
if (existsSync('dist/404.html')) cpSync('dist/404.html', `${OUT}/404.html`);
writeFileSync(`${OUT}/.nojekyll`, '');

const redirect = (to, title) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${title}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="https://puente-dr.github.io${to}">
<meta http-equiv="refresh" content="0; url=${to}">
</head><body><p><a href="${to}">${title}</a></p></body></html>
`;
writeFileSync(`${OUT}/index.html`, redirect('/docs/', 'Puente Docs'));
mkdirSync(`${OUT}/guides/delete-your-account`, { recursive: true });
writeFileSync(`${OUT}/guides/delete-your-account/index.html`,
  redirect('/docs/privacy/delete-your-account/', 'Delete your Puente account or data'));
console.log('assembled _site/ for GitHub Pages');
