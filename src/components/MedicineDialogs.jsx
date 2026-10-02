import { useState } from 'react';
import { Pencil, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Modal, Field, Badge, inputCls } from './ui';
import { useApp } from '../context/AppContext';
import { expiryStatus, longDate } from '../utils/medicine';

const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Gel', 'Inhaler', 'Drops', 'Injection', 'Other'];

function MedicineForm({ initial, onClose }) {
  const { patients, prescriptions, saveMedicine, selectedPatientId } = useApp();
  const [f, setF] = useState({ name: '', generic: '', strength: '', form: 'Tablet', qty: '', minQty: '', expiry: '', patientId: selectedPatientId, rxId: '', verified: 'unverified', ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.name.trim() && f.generic.trim() && f.expiry && f.qty !== '' && Number(f.qty) >= 0;
  const rxs = prescriptions.filter((p) => p.patientId === f.patientId);
  const submit = (e) => {
    e.preventDefault(); if (!ok) return;
    saveMedicine({ ...f, name: f.name.trim(), generic: f.generic.trim(), strength: f.strength.trim(), qty: Number(f.qty), minQty: Number(f.minQty || 0), cost: Number(f.cost || 0), rxId: f.rxId || null });
    onClose();
  };
  return (
    <Modal title={initial?.id ? 'Edit medicine' : 'Add medicine'} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <Field label="Medicine name *" className="col-span-2"><input className={inputCls} value={f.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Active ingredient *"><input className={inputCls} value={f.generic} onChange={set('generic')} /></Field>
        <Field label="Strength"><input className={inputCls} value={f.strength} onChange={set('strength')} placeholder="e.g. 500 mg" /></Field>
        <Field label="Dosage form"><select className={inputCls} value={f.form} onChange={set('form')}>{FORMS.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Expiry date *"><input type="date" className={inputCls} value={f.expiry} onChange={set('expiry')} /></Field>
        <Field label="Quantity in stock *"><input type="number" min="0" className={inputCls} value={f.qty} onChange={set('qty')} /></Field>
        <Field label="Minimum quantity"><input type="number" min="0" className={inputCls} value={f.minQty} onChange={set('minQty')} /></Field>
        <Field label="Family member"><select className={inputCls} value={f.patientId} onChange={(e) => setF({ ...f, patientId: e.target.value, rxId: '' })}>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Prescription"><select className={inputCls} value={f.rxId || ''} onChange={set('rxId')}><option value="">None</option>{rxs.map((p) => <option key={p.id} value={p.id}>{p.doctor || 'Unknown'}, {longDate(p.date)}</option>)}</select></Field>
        <Field label="Verification" className="col-span-2">
          <select className={inputCls} value={f.verified} onChange={set('verified')}><option value="unverified">Unverified</option><option value="verified">Verified against label or prescription</option></select>
        </Field>
        <div className="col-span-2 mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button>
          <button disabled={!ok} className="rounded-xl bg-teal-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-40">Save medicine</button>
        </div>
      </form>
    </Modal>
  );
}

function MedicineDetail({ medicine: m, onClose, onEdit }) {
  const { patients, prescriptions, deleteMedicine } = useApp();
  const st = expiryStatus(m.expiry);
  const rx = prescriptions.find((p) => p.id === m.rxId);
  const rows = [
    ['Active ingredient', m.generic], ['Strength', m.strength || 'Not set'], ['Dosage form', m.form],
    ['Quantity', `${m.qty}${m.minQty ? ` (minimum ${m.minQty})` : ''}`], ['Expiry date', `${longDate(m.expiry)} (${st.days < 0 ? `${-st.days} days ago` : `in ${st.days} days`})`],
    ['Family member', patients.find((p) => p.id === m.patientId)?.name], ['Prescription', rx ? `${rx.doctor || 'Unknown doctor'}, ${longDate(rx.date)}` : 'None linked'],
  ];
  return (
    <Modal title={m.name} onClose={onClose}>
      <div className="mb-4 flex gap-2">
        <Badge tone={st.tone}>{st.label}</Badge>
        {m.verified === 'verified' ? <Badge tone="teal"><ShieldCheck size={12} className="mr-1" />Verified</Badge> : <Badge tone="slate"><ShieldAlert size={12} className="mr-1" />Unverified</Badge>}
      </div>
      <dl className="divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={() => window.confirm(`Delete ${m.name}? This also removes its reminders.`) && (deleteMedicine(m.id), onClose())} className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={15} />Delete</button>
        <button onClick={onEdit} className="flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white"><Pencil size={15} />Edit</button>
      </div>
    </Modal>
  );
}

// Shared by Inventory, Medicine Box and Prescriptions.
export function useMedicineDialogs() {
  const { medicines } = useApp();
  const [v, setV] = useState(null);
  const close = () => setV(null);
  const med = v?.id && medicines.find((m) => m.id === v.id);
  let node = null;
  if (v?.mode === 'form') node = <MedicineForm initial={v.initial} onClose={close} />;
  else if (v?.mode === 'view' && med) node = <MedicineDetail medicine={med} onClose={close} onEdit={() => setV({ mode: 'form', initial: med })} />;
  return { open: (m) => setV({ mode: 'view', id: m.id }), create: (initial) => setV({ mode: 'form', initial }), node };
}
