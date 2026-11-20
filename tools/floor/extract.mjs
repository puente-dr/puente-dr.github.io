// One extractor for every site, so Puente is measured exactly the way Linear
// and Notion are. Runs inside the page (Playwright `page.evaluate`).
//
// Features are deliberately structural and observable — things a reader can
// see or use — not guesses about intent. Each returns true/false; measurements
// return numbers. Nothing here knows which site it is on.
export function extractArticle() {
  const main = document.querySelector('main article') || document.querySelector('main')
    || document.querySelector('[role=main]') || document.body;
  const text = (main.innerText || '').trim();
  const visible = (el) => el && el.getClientRects().length > 0
    && getComputedStyle(el).visibility !== 'hidden';

  // Screenshots and screen recordings: media of real size inside the article.
  // Icons, avatars and logos (< 120px on either side) do not count.
  const media = [...main.querySelectorAll('img, video, picture > img')].filter((m) => {
    const r = m.getBoundingClientRect();
    const w = r.width || m.naturalWidth || +m.getAttribute('width') || 0;
    const h = r.height || m.naturalHeight || +m.getAttribute('height') || 0;
    return w >= 120 && h >= 80;
  });
  // Embedded walkthrough videos (YouTube, Vimeo, Loom) do the same job.
  const videos = [...main.querySelectorAll('iframe')].filter((f) => /youtube|vimeo|loom|wistia/.test(f.src));
  const uniqueMedia = new Set([...media.map((m) => m.currentSrc || m.src || m.querySelector?.('source')?.src), ...videos.map((f) => f.src)]);

  const headings = (sel) => [...main.querySelectorAll(sel)].filter(visible);
  const h2 = headings('h2').filter((h) => !/^(suggested|related|on this page|more resources)/i.test(h.innerText.trim()));
  // An on-page contents list: links to this page's own headings, from outside
  // those headings (Linear puts it in a side column, Notion inside the article).
  const headingIds = new Set([...main.querySelectorAll('h2[id], h3[id], h2 [id], h3 [id], [id] > h2, [id] > h3')]
    .map((h) => h.id || h.parentElement.id || h.querySelector('[id]')?.id).filter(Boolean));
  const anchors = [...document.querySelectorAll('a[href*="#"]')].filter((a) => {
    if (!visible(a) || !a.hash || a.hash.length < 2 || a.closest('h1,h2,h3,h4')) return false;
    let u; try { u = new URL(a.href); } catch (e) { return false; }
    return u.pathname === location.pathname && (headingIds.size === 0 || headingIds.has(decodeURIComponent(a.hash.slice(1))));
  });

  const bodyText = document.body.innerText;
  const has = (re) => re.test(bodyText);
  const linkTo = (re) => [...document.querySelectorAll('a')].some((a) => re.test(a.href) || re.test(a.innerText));

  const breadcrumbEl = document.querySelector(
    '[aria-label*="readcrumb" i], [aria-label*="uta de navegaci" i], [class*="breadcrumb" i], [class*="crumbs" i], ol[itemtype*="BreadcrumbList"]');
  // Linear renders the trail as "Section / Page" text above the article.
  const breadcrumbText = [...document.querySelectorAll('header *, main > div > div:first-child *')]
    .some((el) => el.children.length === 0 && / \/ /.test(el.textContent || '') && (el.textContent || '').length < 120);

  const relatedHeading = [...document.querySelectorAll('h2,h3,h4,p,div,span,nav')]
    .some((el) => el.children.length <= 3 && (el.textContent || '').length < 160 && /^(suggested articles|related( articles| guides| resources)?|more resources|keep reading|learn more|see also|artículos relacionados|relacionado)/i
      .test((el.textContent || '').trim()));

  const searchEl = document.querySelector(
    'input[type=search], [role=search], button[aria-label*="earch" i], button[aria-label*="uscar" i], site-search, [data-search], input[placeholder*="earch" i]');

  const sidebarLinks = [...document.querySelectorAll('nav a, aside a')]
    .filter((a) => visible(a) && !main.contains(a) && !a.hash).length;

  return {
    title: (main.querySelector('h1') || document.querySelector('h1'))?.innerText.trim() || document.title,
    words: text ? text.split(/\s+/).length : 0,
    h2: h2.length,
    h3: headings('h3').length,
    media: uniqueMedia.size,
    features: {
      search: !!searchEl,
      sidebarNav: sidebarLinks >= 15,
      breadcrumbs: !!breadcrumbEl || breadcrumbText,
      onPageToc: anchors.length >= 3,
      relatedArticles: relatedHeading,
      lastUpdated: has(/(last updated|updated on|last edited|última actualización|actualizado)/i)
        || !!document.querySelector('time'),
      feedbackOrContact: has(/(was this (page|article) helpful|helpful\?|feedback|contact (us|support)|still need help|¿te (fue|resultó) útil|contáctanos)/i)
        || linkTo(/contact|support|mailto:/i),
      callouts: !!main.querySelector('aside, blockquote, [role=note], [class*="callout" i], [class*="admonition" i], [class*="note" i]'),
      steps: !!main.querySelector('ol li'),
      tables: !!main.querySelector('table'),
    },
  };
}

export function extractSite() {
  const css = [...document.styleSheets].map((s) => {
    try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch (e) { return ''; }
  }).join('\n');
  const themeToggle = !!document.querySelector(
    '[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i], starlight-theme-select, select[aria-label*="tema" i]')
    || [...document.querySelectorAll('button')].some((b) => /theme|dark|light|sun|moon/i.test(b.className + b.innerHTML.slice(0, 200)));
  return {
    darkMode: /prefers-color-scheme:\s*dark/.test(css) || /\[data-theme=["']?dark/.test(css) || themeToggle,
    languageSwitcher: !!document.querySelector('starlight-lang-select, select[aria-label*="anguage" i], [aria-label*="anguage" i], a[hreflang]'),
  };
}
