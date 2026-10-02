import { useState } from 'react';
import { Pill, Hourglass, Copy, PackageMinus, ShieldCheck, Siren, Check, Loader2, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp, analyze } from '../context/AppContext';
import { Card, Badge, StatCard, Empty } from '../components/ui';
import { SosButton } from '../components/sos/SosUi';
import { EmergencyCalls } from '../components/sos/CallButtons';
import { daysUntil, fmtDate, timeAgo, todayKey } from '../utils/dates';
import { dosesOn, statusOf, needsConfirm, estimateSupply, isLow } from '../utils/schedule';

export default function Dashboard() {
  const { patient, patients, setPatient, medicines, reminders, appointments, activity, alerts, waste, navigate, runAudit, doseLogs, setDoseStatus, settings } = useApp();
  const [scanning, setScanning] = useState(false);

  const meds = medicines.filter((m) => m.patientId === patient.id);
  const found = analyze(medicines, patient.id);
  const count = (t) => found.filter((f) => f.type === t).length;
  const mineRem = reminders.filter((r) => r.patientId === patient.id);
  const todays = dosesOn(mineRem, todayKey());
  const pending = todays.filter((r) => needsConfirm(doseLogs, r, todayKey())).length;
  const supply = meds.map((m) => ({ m, est: estimateSupply(m, reminders) })).filter((x) => isLow(x.m, x.est, settings.refillDays)).sort((a, b) => (a.est.days ?? 999) - (b.est.days ?? 999));
  const done = todays.filter((r) => statusOf(doseLogs, r.id, todayKey()) === 'taken').length;
  const appts = appointments.filter((a) => a.patientId === patient.id && a.date >= todayKey()).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const myAlerts = alerts.filter((a) => a.patientId === patient.id);
  const medName = (id) => medicines.find((m) => m.id === id)?.name;
  const wasteTotal = waste.reduce((s, w) => s + w.expired + w.unused, 0);
  const hour = new Date().getHours();

  const audit = () => { setScanning(true); setTimeout(() => { runAudit(); setScanning(false); }, 1100); };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, welcome back</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            Managing medicines for
            <select value={patient.id} onChange={(e) => setPatient(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-navy-900">
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {patient.conditions.map((c) => <Badge key={c} tone="teal">{c}</Badge>)}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('audit')} disabled={scanning} className="flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-teal-600 disabled:opacity-70">
            {scanning ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />} {scanning ? 'Scanning...' : 'Run AI Audit'}
          </button>
        </div>
      </div>

      <section aria-label="Emergency SOS" className="grid items-center gap-4 rounded-2xl bg-red-50 p-4 ring-2 ring-red-200 md:grid-cols-[auto_1fr_auto]">
        <SosButton size="lg" className="w-full md:w-auto" />
        <div><p className="flex items-center gap-2 text-base font-extrabold text-red-800"><Siren size={18} />Emergency SOS</p>
          <p className="text-sm text-red-900">Pick the emergency type and alert your contacts. Nothing is sent until you confirm. Alerts to contacts are simulated in this prototype.</p>
          <button onClick={() => navigate('contacts')} className="mt-1 text-xs font-bold text-red-700 underline">Manage emergency contacts</button></div>
        <div className="md:w-72"><EmergencyCalls size="md" /></div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total medicines" value={meds.length} hint={`for ${patient.name.split(' ')[0]}`} icon={Pill} onClick={() => navigate('inventory')} />
        <StatCard label="Near or past expiry" value={count('expiring') + count('expired')} hint="within 60 days" icon={Hourglass} tone="amber" onClick={() => navigate('inventory')} />
        <StatCard label="Possible duplicates" value={count('duplicate')} hint="same active ingredient" icon={Copy} tone={count('duplicate') ? 'red' : 'teal'} onClick={() => navigate('audit')} />
        <StatCard label="Low stock" value={count('low')} hint="below minimum" icon={PackageMinus} tone="amber" onClick={() => navigate('refill')} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Today's medication reminders" action={<Badge tone={done === todays.length && todays.length ? 'teal' : 'slate'}>{done} of {todays.length} taken{pending ? `, ${pending} to confirm` : ''}</Badge>}>
            {todays.length === 0 ? <Empty>No reminders for {patient.name}.</Empty> : (
              <ul className="divide-y divide-slate-100">
                {todays.map((r) => {
                  const taken = statusOf(doseLogs, r.id, todayKey()) === 'taken';
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-14 text-sm font-bold tabular-nums text-teal-600">{r.time}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${taken ? 'text-slate-400 line-through' : ''}`}>{medName(r.medicineId)}</p>
                        <p className="text-xs text-slate-400">{r.dose}</p>
                      </div>
                      <button onClick={() => setDoseStatus(r.id, todayKey(), taken ? 'not_confirmed' : 'taken')} aria-pressed={taken}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${taken ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'}`}>
                        <Check size={14} /> {taken ? 'Taken' : 'Mark taken'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Audit findings" action={<Badge tone={myAlerts.length ? 'amber' : 'slate'}>{myAlerts.length} open</Badge>}>
            {myAlerts.length === 0 ? <Empty>No audit results yet. Select Run AI Audit to check {patient.name.split(' ')[0]}'s medicines.</Empty> : (
              <ul className="space-y-2">
                <AnimatePresence>
                  {myAlerts.map((a) => (
                    <motion.li key={a.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className={`flex items-start gap-3 rounded-xl p-3 text-sm ${a.level === 'danger' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                      <Sparkles size={16} className="mt-0.5 shrink-0" /> {a.text}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Card>

          <Card title="Medicine waste, last 6 months" action={<Badge tone="amber">₹{wasteTotal} wasted</Badge>}>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={waste} barGap={4}>
                  <CartesianGrid vertical={false} stroke="#EEF2F6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} formatter={(v) => `₹${v}`} />
                  <Bar dataKey="expired" name="Expired" stackId="w" fill="#F59E0B" />
                  <Bar dataKey="unused" name="Unused" stackId="w" fill="#0FA3A3" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Upcoming appointments">
            {appts.length === 0 ? <Empty>No upcoming appointments. Add one in Appointments.</Empty> : (
              <ul className="space-y-3">
                {appts.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-navy-900 text-white">
                      <span className="text-sm font-extrabold leading-none">{fmtDate(a.date).split(' ')[0]}</span>
                      <span className="text-[10px] leading-none opacity-70">{fmtDate(a.date).split(' ')[1]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{a.doctor}</p>
                      <p className="text-xs text-slate-400">{a.specialty}, {a.time} (in {daysUntil(a.date)} days)</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Low stock and refills" action={<button onClick={() => navigate('refill')} className="text-xs font-bold text-teal-600">Open planner</button>}>
            {supply.length === 0 ? <Empty>No low-stock medicines.</Empty> : (
              <ul className="space-y-2 text-sm">{supply.map(({ m, est }) => (
                <li key={m.id} className="flex items-center justify-between gap-2"><span className="font-semibold">{m.name}</span>
                  <Badge tone="amber">{m.qty} left{est.ok ? `, about ${est.days} days` : ''}</Badge></li>))}</ul>)}
          </Card>

          <Card title="Recent agent activity">
            <ul className="space-y-3">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                  <div>
                    <p className="text-sm"><span className="font-semibold">{a.agent}:</span> {a.text}</p>
                    <p className="text-xs text-slate-400">{timeAgo(a.ts)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
