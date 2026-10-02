import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, Badge, Empty, inputCls } from '../components/ui';
import AgentTimeline from '../components/AgentTimeline';
import { runAuditPipeline, STEP_META } from '../utils/auditEngine';
import { longDate } from '../utils/medicine';

function Section({ title, count, tone = 'slate', children, open: o = false }) {
  const [open, setOpen] = useState(o);
  return (
    <div className="rounded-xl ring-1 ring-slate-100">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-bold">{title}<Badge tone={count ? tone : 'green'}>{count}</Badge></span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-slate-100 px-4 py-3 text-sm">{count === 0 ? <p className="text-slate-400">Nothing found.</p> : children}</div>}
    </div>
  );
}
const Li = ({ children }) => <li className="py-1.5">{children}</li>;
const LEVEL = { high: ['red', 'Higher likelihood'], medium: ['amber', 'Possible'], low: ['slate', 'Similar names only'] };

function Report({ r }) {
  const e = r.expiry, rc = r.recon;
  const tiles = [['Checked', r.checked], ['Expired', e.expired.length], ['Expiring soon', e.expiring.length], ['Possible duplicates', r.duplicates.length], ['Missing info', r.missing.length + e.missing.length], ['Not found on list', rc ? rc.notFound.length : '-']];
  return (
    <Card title="Audit report" action={<span className="text-xs text-slate-400">{new Date(r.ts).toLocaleString()}</span>}>
      <p className="mb-3 text-sm text-slate-500"><b className="text-navy-900">{r.patientName}</b>. Prescription used: {r.rx ? `${r.rx.doctor || 'Unknown'}, ${longDate(r.rx.date)}` : 'none'}.</p>
      <div className="mb-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {tiles.map(([l, v]) => <div key={l} className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-xl font-extrabold tabular-nums">{v}</p><p className="text-[11px] text-slate-500">{l}</p></div>)}
      </div>
      <div className="space-y-2">
        <Section open title="Expiry findings" count={e.expired.length + e.expiring.length + e.missing.length} tone="amber">
          <ul className="divide-y divide-slate-100">
            {e.expired.map((x) => <Li key={x.medicine.id}><Badge tone="red">Expired</Badge> <b>{x.medicine.name}</b>, {x.days} days ago ({longDate(x.date)})</Li>)}
            {e.expiring.map((x) => <Li key={x.medicine.id}><Badge tone="amber">Expiring soon</Badge> <b>{x.medicine.name}</b>, in {x.days} days ({longDate(x.date)})</Li>)}
            {e.missing.map((x) => <Li key={x.medicine.id}><Badge>No expiry date</Badge> <b>{x.medicine.name}</b></Li>)}
          </ul>
        </Section>
        <Section open title="Possible duplicates (for your review)" count={r.duplicates.length} tone="amber">
          <ul className="divide-y divide-slate-100">
            {r.duplicates.map((d, i) => <Li key={i}><Badge tone={LEVEL[d.level][0]}>{LEVEL[d.level][1]}</Badge> <b>{d.a.name}</b> and <b>{d.b.name}</b><p className="text-xs text-slate-500">{d.reason}</p></Li>)}
          </ul>
          <p className="mt-2 text-xs text-slate-400">A flag is not a diagnosis. Similar medicines are not assumed to be interchangeable.</p>
        </Section>
        <Section title="Missing or uncertain information" count={r.missing.length + r.unverified.length + (r.rxMissing?.length || 0)} tone="amber">
          <ul className="divide-y divide-slate-100">
            {r.missing.map((x) => <Li key={x.medicine.id}><b>{x.medicine.name}</b> is missing: {x.fields.join(', ')}</Li>)}
            {r.unverified.map((x) => <Li key={`u${x.id}`}><b>{x.name}</b> is unverified</Li>)}
            {r.rxMissing?.map((n) => <Li key={n}>Prescription item <b>{n}</b> has no strength</Li>)}
          </ul>
        </Section>
        <Section title="Prescription comparison" count={rc ? rc.matches.length + rc.uncertain.length + rc.notFound.length : 0} tone="slate">
          {rc && (
            <div className="grid gap-3 md:grid-cols-2">
              {[['Possible matches', rc.matches.map((x) => `${x.item} ${x.strength} matches ${x.medicines.map((m) => m.name).join(', ')}`)],
                ['Uncertain matches', rc.uncertain.map((x) => `${x.item} ${x.strength}: ${x.reason} (${x.medicines.map((m) => m.name).join(', ')})`)],
                ['On the list, not found in inventory', rc.notFound.map((x) => `${x.item} ${x.strength}`)],
                ['In inventory, not on the list', rc.extras.map((m) => m.name)]].map(([t, items]) => (
                <div key={t} className="rounded-xl bg-slate-50 p-3"><p className="mb-1 text-xs font-bold">{t} ({items.length})</p>
                  {items.length ? <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-xs text-slate-400">None</p>}</div>))}
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">{rc ? `Compared ${r.checked} inventory medicines with ${rc.matches.length + rc.uncertain.length + rc.notFound.length} list items.` : 'No prescription list was supplied.'}</p>
        </Section>
        <Section open title="Recommended verification actions" count={r.actions.length} tone="teal">
          <ol className="list-decimal space-y-1.5 pl-5">{r.actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
        </Section>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />This audit checks the data you entered. It is not a substitute for review by a pharmacist or doctor, and it gives no treatment advice.</p>
    </Card>
  );
}

export default function Audit() {
  const { patient, patients, setPatient, prescriptions, medicines, audits, saveAudit } = useApp();
  const rxs = prescriptions.filter((p) => p.patientId === patient.id).sort((a, b) => b.date.localeCompare(a.date));
  const [rxId, setRxId] = useState(rxs[0]?.id || '');
  const [live, setLive] = useState(null); const [prog, setProg] = useState({}); const [running, setRunning] = useState(false);
  useEffect(() => { setRxId(rxs[0]?.id || ''); setLive(null); setProg({}); }, [patient.id]); // eslint-disable-line
  const last = audits.find((a) => a.report.patientId === patient.id);
  const shown = live || last;

  const start = async () => {
    setRunning(true); setLive(null); setProg({});
    const res = await runAuditPipeline({ medicines, prescriptions }, patient, rxId, (s) => setProg((p) => ({ ...p, [s.id]: s })));
    saveAudit(res.report, res.steps); setLive(res); setRunning(false);
  };
  const steps = STEP_META.map((m) => (running || live ? prog[m.id] : last?.steps.find((s) => s.id === m.id)) || { ...m, status: 'pending' });
  const doneCount = steps.filter((s) => !['pending', 'running'].includes(s.status)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">AI Medicine Audit</h1>
          <p className="text-sm text-slate-500">Deterministic checks across inventory, prescriptions and profiles.</p></div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold text-slate-600">Patient<select className={`${inputCls} mt-1`} value={patient.id} disabled={running} onChange={(e) => setPatient(e.target.value)}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600">Prescription list<select className={`${inputCls} mt-1`} value={rxId} disabled={running} onChange={(e) => setRxId(e.target.value)}>
            <option value="">None (skip comparison)</option>{rxs.map((p) => <option key={p.id} value={p.id}>{p.doctor || 'Unknown'}, {longDate(p.date)}</option>)}</select></label>
          <button onClick={start} disabled={running} className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-60">
            {running ? <Loader2 size={17} className="animate-spin" /> : shown ? <RefreshCw size={17} /> : <ShieldCheck size={17} />}{running ? 'Running...' : shown ? 'Run again' : 'Run AI Audit'}</button>
        </div>
      </div>
      <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800"><AlertTriangle size={15} className="shrink-0" />This audit is not a substitute for pharmacist or doctor review. Do not stop or change any medicine because of a flag here.</p>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Agent timeline" className="lg:col-span-1 h-fit"
          action={<span className="text-xs font-semibold text-slate-400">{doneCount}/{STEP_META.length} steps</span>}>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500 transition-all duration-300" style={{ width: `${(doneCount / STEP_META.length) * 100}%` }} /></div>
          <AgentTimeline steps={steps} />
        </Card>
        <div className="lg:col-span-2">
          {shown ? <Report r={shown.report} /> : <Empty>{running ? 'Agents are working. The report appears when all steps finish.' : 'No audit yet for this patient. Choose a prescription list and run the audit.'}</Empty>}
        </div>
      </div>
    </div>
  );
}
