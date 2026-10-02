// Deterministic audit engine. Every step runs real JavaScript checks on the app data.
import { daysUntil } from './dates';

const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const strengthOf = (s = '') => norm(s).replace(/\s/g, '');
const baseName = (s = '') => norm(s).replace(/\b\d+\s?(mg|mcg|ml|g)\b/g, '').replace(/\d+/g, '').replace(/\s+/g, ' ').trim();
const validDate = (d) => !!d && !isNaN(new Date(d));
const ref = (m) => ({ id: m.id, name: m.name, strength: m.strength || '' });
const bigrams = (s) => { const t = s.replace(/ /g, ''); const o = []; for (let i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 2)); return o; };
const dice = (a, b) => {
  const x = bigrams(a), y = bigrams(b); if (!x.length || !y.length) return 0;
  const m = new Map(); x.forEach((g) => m.set(g, (m.get(g) || 0) + 1));
  let hit = 0; y.forEach((g) => { if ((m.get(g) || 0) > 0) { hit++; m.set(g, m.get(g) - 1); } });
  return (2 * hit) / (x.length + y.length);
};
const SOON = 60;

export const STEP_META = [
  { id: 's1', agent: 'Inventory Agent', action: 'Retrieve the patient\'s medicine inventory' },
  { id: 's2', agent: 'Prescription Agent', action: 'Retrieve the selected prescription list' },
  { id: 's3', agent: 'Validation Agent', action: 'Validate medicine data fields' },
  { id: 's4', agent: 'Expiry Agent', action: 'Analyze expiry dates' },
  { id: 's5', agent: 'Duplicate Agent', action: 'Compare ingredient, strength and name' },
  { id: 's6', agent: 'Reconciliation Agent', action: 'Compare inventory with the prescription list' },
  { id: 's7', agent: 'Uncertainty Agent', action: 'Collect missing and uncertain data' },
  { id: 's8', agent: 'Report Agent', action: 'Generate the audit report' },
];

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const RUN = {
  s1: (c) => { c.meds = c.state.medicines.filter((m) => m.patientId === c.patient.id);
    return { status: c.meds.length ? 'done' : 'warning', result: `Retrieved ${plural(c.meds.length, 'medicine')} for ${c.patient.name}` }; },
  s2: (c) => { c.rx = c.state.prescriptions.find((p) => p.id === c.rxId) || null; c.list = c.rx ? c.rx.items : [];
    return c.rx ? { status: 'done', result: `Loaded prescription from ${c.rx.doctor || 'unknown doctor'} with ${plural(c.list.length, 'item')}` }
      : { status: 'warning', result: 'No prescription list selected. Reconciliation will be skipped.' }; },
  s3: (c) => {
    c.missing = c.meds.map((m) => { const f = [];
      if (!m.generic?.trim()) f.push('active ingredient'); if (!m.strength?.trim()) f.push('strength');
      if (!validDate(m.expiry)) f.push('expiry date'); if (typeof m.qty !== 'number' || m.qty < 0) f.push('quantity');
      return { medicine: ref(m), fields: f }; }).filter((x) => x.fields.length);
    c.unverified = c.meds.filter((m) => m.verified !== 'verified').map(ref);
    c.rxMissing = c.list.filter((i) => !i.strength?.trim()).map((i) => i.name);
    const n = c.missing.length + c.rxMissing.length;
    return { status: n ? 'warning' : 'done', result: n ? `${plural(c.missing.length, 'medicine')} and ${plural(c.rxMissing.length, 'list item')} have missing fields` : 'All required fields present' }; },
  s4: (c) => {
    const e = { expired: [], expiring: [], missing: [] };
    c.meds.forEach((m) => { if (!validDate(m.expiry)) return e.missing.push({ medicine: ref(m) });
      const d = daysUntil(m.expiry); if (d < 0) e.expired.push({ medicine: ref(m), days: -d, date: m.expiry });
      else if (d <= SOON) e.expiring.push({ medicine: ref(m), days: d, date: m.expiry }); });
    c.expiry = e; const n = e.expired.length + e.expiring.length + e.missing.length;
    return { status: n ? 'warning' : 'done', result: `${e.expired.length} expired, ${e.expiring.length} expiring within ${SOON} days, ${e.missing.length} missing dates` }; },
  s5: (c) => {
    c.dups = [];
    for (let i = 0; i < c.meds.length; i++) for (let j = i + 1; j < c.meds.length; j++) {
      const a = c.meds[i], b = c.meds[j], ia = norm(a.generic), ib = norm(b.generic);
      const na = baseName(a.name), nb = baseName(b.name);
      if (ia && ia === ib) {
        const same = strengthOf(a.strength) && strengthOf(a.strength) === strengthOf(b.strength);
        c.dups.push({ a: ref(a), b: ref(b), level: same ? 'high' : 'medium',
          reason: same ? `Same active ingredient (${a.generic}) and same strength (${a.strength})` : `Same active ingredient (${a.generic}); strength differs or is missing` });
      } else if ((na && na === nb) || dice(na, nb) >= 0.75) {
        c.dups.push({ a: ref(a), b: ref(b), level: 'low', reason: 'Names look similar but active ingredients differ or are missing. They may not be interchangeable.' });
      } }
    return { status: c.dups.length ? 'warning' : 'done', result: `${plural(c.dups.length, 'possible duplicate pair')} flagged for review` }; },
  s6: (c) => {
    if (!c.rx) { c.recon = null; return { status: 'skipped', result: 'Skipped: no prescription list supplied' }; }
    const r = { matches: [], uncertain: [], notFound: [], extras: [] }; const used = new Set();
    c.list.forEach((it) => {
      const iname = baseName(it.name), istr = strengthOf(it.strength);
      const cands = c.meds.map((m) => ({ m, nameEq: !!iname && (baseName(m.name) === iname || norm(m.generic) === iname),
        fuzzy: dice(baseName(m.name), iname) >= 0.75 || dice(norm(m.generic), iname) >= 0.75 })).filter((x) => x.nameEq || x.fuzzy);
      cands.forEach((x) => used.add(x.m.id));
      const exact = cands.filter((x) => x.nameEq && istr && strengthOf(x.m.strength) === istr);
      if (exact.length) r.matches.push({ item: it.name, strength: it.strength, medicines: exact.map((x) => ref(x.m)) });
      else if (cands.length) r.uncertain.push({ item: it.name, strength: it.strength, medicines: cands.map((x) => ref(x.m)),
        reason: cands.some((x) => x.nameEq) ? 'Name matches but strength differs or is missing' : 'Only a similar name; not confirmed' });
      else r.notFound.push({ item: it.name, strength: it.strength });
    });
    r.extras = c.meds.filter((m) => !used.has(m.id)).map(ref); c.recon = r;
    return { status: r.notFound.length || r.uncertain.length ? 'warning' : 'done', result: `${r.matches.length} possible matches, ${r.uncertain.length} uncertain, ${r.notFound.length} not found` }; },
  s7: (c) => {
    const u = [];
    if (c.unverified.length) u.push(`${plural(c.unverified.length, 'medicine')} not yet verified against a label or prescription`);
    if (c.missing.length) u.push(`${plural(c.missing.length, 'medicine')} with missing fields`);
    if (c.recon?.uncertain.length) u.push(`${plural(c.recon.uncertain.length, 'prescription item')} with uncertain matches`);
    if (c.rx?.source === 'scan') u.push('Prescription was entered through simulated OCR, so its text may be wrong');
    if (!c.rx) u.push('No prescription list was supplied for comparison');
    c.uncertainty = u; return { status: u.length ? 'warning' : 'done', result: u.length ? `${plural(u.length, 'uncertainty')} recorded` : 'No uncertainties recorded' }; },
  s8: (c) => {
    const A = [];
    c.expiry.expired.forEach((x) => A.push(`Check the printed expiry date on the ${x.medicine.name} packaging, and ask a pharmacist about safe disposal.`));
    c.expiry.expiring.forEach((x) => A.push(`Check the expiry date on the ${x.medicine.name} packaging (about ${x.days} days left by the recorded date).`));
    c.expiry.missing.forEach((x) => A.push(`Find the expiry date for ${x.medicine.name} on its packaging and add it.`));
    c.dups.forEach((d) => A.push(`Ask a pharmacist or doctor to review ${d.a.name} and ${d.b.name}. Do not change how either is taken without their advice.`));
    c.missing.forEach((x) => A.push(`Add the missing ${x.fields.join(', ')} for ${x.medicine.name} from its label.`));
    c.recon?.notFound.forEach((x) => A.push(`Ask the prescriber or pharmacist whether ${x.item} is still current and whether it is meant to be in stock.`));
    c.recon?.uncertain.forEach((x) => A.push(`Compare ${x.item} with ${x.medicines.map((m) => m.name).join(' / ')} on the label. The match is not confirmed.`));
    if (c.unverified.length) A.push('Mark medicines as verified only after checking them against their label or prescription.');
    A.push('Share this report with a pharmacist or doctor for review.');
    c.actions = A; return { status: 'done', result: `Report generated with ${plural(A.length, 'verification action')}` }; },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// pace = short pause between steps so people can follow the timeline (cosmetic only).
export async function runAuditPipeline(state, patient, rxId, onStep, pace = 450) {
  const c = { state, patient, rxId, meds: [], list: [] };
  const steps = [];
  for (const meta of STEP_META) {
    onStep({ ...meta, status: 'running', ts: Date.now() });
    await sleep(pace);
    let out; try { out = RUN[meta.id](c); } catch (e) { out = { status: 'error', result: `Step failed: ${e.message}` }; }
    const step = { ...meta, ...out, ts: Date.now() }; steps.push(step); onStep(step);
  }
  const findings = c.expiry.expired.length + c.expiry.expiring.length + c.expiry.missing.length + c.dups.length + c.missing.length;
  return { steps, report: {
    id: `au${Date.now()}`, ts: Date.now(), patientId: patient.id, patientName: patient.name,
    rx: c.rx ? { id: c.rx.id, doctor: c.rx.doctor, date: c.rx.date, source: c.rx.source } : null,
    checked: c.meds.length, expiry: c.expiry, duplicates: c.dups, missing: c.missing, unverified: c.unverified,
    recon: c.recon, rxMissing: c.rxMissing, uncertainty: c.uncertainty, actions: c.actions, findings } };
}
