// Screenshots of Puente Manage for the docs, in English and Spanish, with
// ENTIRELY INVENTED data.
//
//   1. A worktree of puente-react-nextjs-platform at origin/master, with the
//      Parse app id in .env.local replaced by a dummy (so nothing can reach a
//      real backend even if a stub is missed), running `yarn dev -p 3010`.
//   2. node tools/capture/manage.mjs            # writes src/assets/shots/{en,es}/manage-*.png
//
// Every request to Parse and to the export service is answered here. The
// interface is the real one; the organization ("Example Health Trust"), the
// people and the numbers are invented. No screen shows a real partner.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:3010';
const OUT = fileURLToPath(new URL('../../src/assets/shots/', import.meta.url));
const APP_ID = 'docs-capture-stub-not-a-real-app';
const ONLY = process.argv.slice(2);

// ── invented world ─────────────────────────────────────────────────────────
const ORG = 'Example Health Trust';
const USER = {
  objectId: 'USRa000001', username: 'ada@example.org', email: 'ada@example.org',
  firstname: 'Ada', lastname: 'Ejemplo', phonenumber: '809-000-0000', organization: ORG,
  role: 'administrator', adminVerified: true, sessionToken: 'r:docs-capture',
  createdAt: '2026-02-01T10:00:00.000Z', updatedAt: '2026-11-01T10:00:00.000Z',
};
const now = Date.now();
const iso = (daysAgo, h = 10) => new Date(now - daysAgo * 864e5 - (12 - h) * 36e5).toISOString();
const date = (s) => ({ __type: 'Date', iso: s });
const COMMUNITIES = ['Comunidad Ejemplo', 'El Río', 'El Rio', 'Los Pinos', 'Barrio Nuevo', 'La Loma'];
const FIRST = ['Ana', 'Luis', 'María', 'José', 'Carmen', 'Pedro', 'Rosa', 'Juan', 'Elena', 'Miguel', 'Lucía', 'Rafael'];
const LAST = ['Ejemplo', 'Ramírez', 'Muestra', 'Prueba', 'Modelo', 'Demo'];
const people = Array.from({ length: 48 }, (_, i) => ({
  objectId: `SDAa${String(i + 1).padStart(6, '0')}`,
  fname: FIRST[i % FIRST.length], lname: LAST[(i * 7) % LAST.length],
  nickname: i % 3 === 0 ? FIRST[(i + 3) % FIRST.length] : '',
  sex: i % 2 ? 'female' : 'male',
  dob: i % 5 === 0 ? '' : `${1950 + (i * 3) % 60}-0${1 + (i % 9)}-1${i % 9}`,
  telephoneNumber: i % 4 === 0 ? '' : `809-000-${String(1000 + i).slice(-4)}`,
  communityname: COMMUNITIES[i % COMMUNITIES.length], city: 'Constanza', province: 'La Vega',
  householdId: i % 6 === 5 ? '' : `HHa${String(Math.floor(i / 3)).padStart(5, '0')}`,
  surveyingUser: ['ada@example.org', 'beto@example.org', 'cami@example.org'][i % 3],
  surveyingOrganization: ORG, educationLevel: 'highschool', occupation: 'farmer',
  createdAt: iso(i % 20), updatedAt: iso(i % 20),
}));
const vitals = people.slice(0, 30).map((p, i) => ({
  objectId: `VITa${String(i + 1).padStart(6, '0')}`, client: { __type: 'Pointer', className: 'SurveyData', objectId: p.objectId },
  height: '160', weight: '64', bloodPressure: '120/80', temp: '36.8', pulse: '72',
  surveyingUser: p.surveyingUser, surveyingOrganization: ORG, createdAt: iso(i % 10), updatedAt: iso(i % 10),
}));
const envHealth = people.slice(0, 20).map((p, i) => ({
  objectId: `EHPa${String(i + 1).padStart(6, '0')}`, client: { __type: 'Pointer', className: 'SurveyData', objectId: p.objectId },
  yearsLivedinthecommunity: '12', waterAccess: 'yes', typeofWaterdoyoudrink: 'bottled',
  surveyingUser: p.surveyingUser, surveyingOrganization: ORG, createdAt: iso(i % 15), updatedAt: iso(i % 15),
}));
const FORMS = [
  {
    objectId: 'FSPa000001', name: 'Water access — Example Community', description: 'Household water source and treatment.',
    organizations: [ORG], typeOfForm: ['Custom'], customForm: true, active: 'true', workflows: [], allowResearchExport: false,
    fields: [
      { label: 'Water source', formikKey: 'water_source', fieldType: 'select', value: [], options: [{ label: 'Tap', value: 'tap' }, { label: 'Well', value: 'well' }, { label: 'Bottled', value: 'bottled' }] },
      { label: 'How many people live in this house?', formikKey: 'people_in_house', fieldType: 'number', value: '' },
      { label: 'Notes — water', formikKey: 'notes_water', fieldType: 'input', value: '' },
    ],
    createdAt: iso(60), updatedAt: iso(5),
  },
  {
    objectId: 'FSPa000002', name: 'Vision exam', description: 'Acuity before and after glasses.',
    organizations: [ORG], typeOfForm: ['Custom'], customForm: true, active: 'true', workflows: [], allowResearchExport: true,
    fields: [{ label: 'Consent for the study', formikKey: 'consent', fieldType: 'select', value: [], options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] }],
    createdAt: iso(30), updatedAt: iso(2),
  },
  {
    objectId: 'FSPa000003', name: 'Clinic sign-in', description: 'Who came to the clinic.',
    organizations: [ORG], typeOfForm: ['Custom'], customForm: true, active: 'true', workflows: [], allowResearchExport: false,
    fields: [], createdAt: iso(25), updatedAt: iso(9),
  },
];
const MARKET = [
  { objectId: 'FSPm000001', name: 'Household water survey', description: 'Water source, storage and treatment for one household.', typeOfForm: ['Marketplace'], organizations: [], active: 'true', fields: FORMS[0].fields, createdAt: iso(200), updatedAt: iso(100) },
  { objectId: 'FSPm000002', name: 'Child growth check', description: 'Height, weight and age for children under five.', typeOfForm: ['Marketplace'], organizations: [], active: 'true', fields: [], createdAt: iso(180), updatedAt: iso(90) },
  { objectId: 'FSPm000003', name: 'Clinic sign-in sheet', description: 'A short record of who attended a clinic day.', typeOfForm: ['Marketplace'], organizations: [], active: 'true', fields: [], createdAt: iso(150), updatedAt: iso(80) },
];
const formResults = Array.from({ length: 37 }, (_, i) => ({
  objectId: `FRSa${String(i + 1).padStart(6, '0')}`, formSpecificationsId: 'FSPa000002', title: 'Vision exam',
  client: { __type: 'Pointer', className: 'SurveyData', objectId: people[i % people.length].objectId },
  fields: [{ title: 'consent', answer: i % 9 === 0 ? 'no' : 'yes' }],
  surveyingUser: people[i % people.length].surveyingUser, surveyingOrganization: ORG,
  createdAt: iso(i % 4), updatedAt: iso(i % 4),
}));
const ORGS = [{ objectId: 'ORGa000001', name: ORG, shortCode: 'example-health-trust', aliases: ['EHT', 'Example Health'], active: true }];
const MEMBERS = [
  { objectId: 'USRa000001', firstname: 'Ada', lastname: 'Ejemplo', email: 'ada@example.org', isAdmin: true, deactivated: false },
  { objectId: 'USRa000002', firstname: 'Beto', lastname: 'Muestra', email: 'beto@example.org', isAdmin: true, deactivated: false },
  { objectId: 'USRa000003', firstname: 'Cami', lastname: 'Prueba', email: 'cami@example.org', isAdmin: false, deactivated: false },
  { objectId: 'USRa000004', firstname: 'Dani', lastname: 'Modelo', email: 'dani@example.org', isAdmin: false, deactivated: true },
];
const CLASSES = {
  SurveyData: people, Vitals: vitals, HistoryEnvironmentalHealth: envHealth, EvaluationMedical: vitals.slice(0, 8).map((v, i) => ({ ...v, objectId: `EVMa${i}`, chronic_condition_hypertension: 'no' })),
  FormResults: formResults, Organization: ORGS, _User: [USER], User: [USER],
};

const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

function answerQuery(cls, body) {
  if (cls === 'FormSpecificationsV2') {
    const s = JSON.stringify(body.where || {});
    const rows = s.includes('Marketplace') ? MARKET : FORMS.filter((f) => !s.includes('"objectId"') || s.includes(f.objectId));
    return { results: body.count && body.limit === 0 ? [] : rows, ...(body.count ? { count: rows.length } : {}) };
  }
  let rows = CLASSES[cls] || [];
  const w = body.where || {};
  const ws = JSON.stringify(w);
  // Data-quality queries (missing fields, orphaned household links) filter on
  // the server. Answer them with a small, believable share of the records.
  if (/PatientID|\$regex/.test(ws)) rows = rows.slice(0, 2);
  else if (/"\$exists":false|"\$in":\[(null|"")/.test(ws)) rows = rows.slice(0, 5);
  if (w.objectId && typeof w.objectId === 'string') rows = rows.filter((r) => r.objectId === w.objectId);
  if (w.formSpecificationsId && typeof w.formSpecificationsId === 'string') rows = rows.filter((r) => r.formSpecificationsId === w.formSpecificationsId);
  const limit = body.limit === undefined ? 100 : body.limit;
  const out = rows.slice(0, limit === 0 ? 0 : limit).map((r) => ({
    ...r, createdAt: r.createdAt, updatedAt: r.updatedAt,
  }));
  return body.count ? { results: out, count: rows.length } : { results: out };
}

const FUNCTIONS = {
  myOrganizationAccess: { isStaff: false, orgAdminOf: ['example-health-trust'] },
  isStaff: false,
  listOrganizationMembers: MEMBERS,
  resolveOrganization: { status: 'resolved', organization: ORGS[0] },
  // Parse decodes cloud-function results; a user must arrive as a Parse Object.
  retrieveUserByObjectId: { __type: 'Object', className: '_User', ...USER },
  queryUser: { __type: 'Object', className: '_User', ...USER },
};

async function install(ctx, lang) {
  await ctx.addInitScript(([user, appId]) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem(`Parse/${appId}/currentUser`, JSON.stringify(user));
  }, [USER, APP_ID]);
  await ctx.route('**/parseapi.back4app.com/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    let body = {};
    try { body = JSON.parse(req.postData() || '{}'); } catch {}
    const path = url.pathname;
    let m;
    if ((m = path.match(/\/functions\/(\w+)/))) {
      const name = m[1];
      if (name in FUNCTIONS) return json(route, { result: FUNCTIONS[name] });
      if (name === 'basicQuery' || name === 'genericQuery') return json(route, { result: CLASSES[body.parseObject || body.className] || people.slice(0, 20) });
      return json(route, { result: [] });
    }
    if (/\/users\/me/.test(path)) return json(route, USER);
    if ((m = path.match(/\/aggregate\/(\w+)/))) {
      return json(route, { results: COMMUNITIES.map((c, i) => ({ objectId: c, count: 12 - i })) });
    }
    if ((m = path.match(/\/classes\/(\w+)/))) return json(route, answerQuery(m[1], body));
    if (/\/batch/.test(path)) return json(route, (body.requests || []).map(() => ({ success: {} })));
    return json(route, { results: [] });
  });
  // The export service, wherever it is pointed.
  await ctx.route((u) => /\/v[23]\/(records|research)/.test(u.pathname) || u.pathname.includes('records-custom-forms'),
    (route) => route.fulfill({ status: 200, contentType: 'text/csv', body: 'objectId,fname\nSDAa000001,Ana\n' }));
}

const shots = [];
async function capture(browser, lang, name, path, steps = async () => {}, opts = {}) {
  if (ONLY.length && !ONLY.some((o) => name.includes(o))) return;
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1360, height: 860 }, deviceScaleFactor: 2, locale: lang === 'es' ? 'es-DO' : 'en-US' });
  await install(ctx, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  const prefix = lang === 'es' ? '/spa' : '';
  await page.goto(`${BASE}${prefix}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  try {
    const target = (await steps(page)) || null;
    await page.waitForTimeout(600);
    const file = `${OUT}${lang}/${name}.png`;
    if (target) await page.locator(target).first().screenshot({ path: file });
    else await page.screenshot({ path: file, fullPage: !!opts.full });
    shots.push(`${lang}/${name}`);
    console.log(`  ✓ ${lang}/${name}${errors.length ? `  (page errors: ${errors.join(' | ')})` : ''}`);
  } catch (e) {
    console.log(`  ✗ ${lang}/${name}: ${String(e).split('\n')[0]}`);
  }
  await ctx.close();
}

const click = (page, re) => page.getByRole('button', { name: re }).first().click();

async function run() {
  const browser = await chromium.launch();
  for (const lang of (process.env.LANGS || 'en,es').split(',')) {
    mkdirSync(`${OUT}${lang}`, { recursive: true });
    console.log(`\n=== ${lang} ===`);
    await capture(browser, lang, 'manage-login', '/account/login');
    await capture(browser, lang, 'manage-register', '/account/register');
    await capture(browser, lang, 'manage-register-not-listed', '/account/register', async (p) => {
      await click(p, /isn't listed|no aparece/i);
      return 'form';
    });
    await capture(browser, lang, 'manage-review', '/quick-start');
    await capture(browser, lang, 'manage-sidebar', '/quick-start', async () => 'aside');
    await capture(browser, lang, 'manage-form-manager', '/forms/form-manager');
    await capture(browser, lang, 'manage-form-manager-expanded', '/forms/form-manager', async (p) => {
      const row = p.locator('tr', { hasText: 'Vision exam' }).first();
      await row.locator('button').first().click();
      await p.waitForTimeout(800);
      await click(p, /^(Refresh|Actualizar)$/);
      await p.waitForTimeout(800);
    });
    await capture(browser, lang, 'manage-form-creator', '/forms/form-creator');
    await capture(browser, lang, 'manage-form-creator-edit', '/forms/form-manager', async (p) => {
      await p.locator('tr', { hasText: 'Water access' }).first().getByRole('button', { name: /^(Edit|Editar)$/ }).click();
      await p.waitForLoadState('networkidle');
      await p.waitForTimeout(2500);
    });
    await capture(browser, lang, 'manage-form-manager-top', '/forms/form-manager');
    await capture(browser, lang, 'manage-data-curation', '/data/data-curation');
    await capture(browser, lang, 'manage-record-inspector', '/data/data-curation', async (p) => {
      await p.locator('tbody tr').first().click();
      await p.waitForTimeout(1200);
    });
    await capture(browser, lang, 'manage-community-audit', '/data/data-curation', async (p) => {
      await p.getByRole('tab', { name: /Community Audit|Auditoría/i }).first().click().catch(() => click(p, /Community Audit|Auditoría/i));
      await p.waitForTimeout(1200);
    });
    await capture(browser, lang, 'manage-marketplace', '/forms/form-marketplace');
    await capture(browser, lang, 'manage-account-settings', '/account/management');
    await capture(browser, lang, 'manage-organizations', '/organization-admin');
  }
  await browser.close();
  console.log(`\n${shots.length} screenshots in src/assets/shots/`);
}
run();
