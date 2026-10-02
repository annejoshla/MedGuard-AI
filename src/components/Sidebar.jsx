import { Cross, X } from 'lucide-react';
import { NAV } from '../config/nav';
import { useApp } from '../context/AppContext';
import { SosButton } from './sos/SosUi';

export default function Sidebar({ open, onClose }) {
  const { page, navigate, role, setRole, emergencyAlerts } = useApp();
  const activeCount = emergencyAlerts.filter((a) => a.active).length;
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-navy-900/50 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-navy-900 text-slate-300 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500"><Cross size={18} strokeWidth={3} /></span>
            <span className="text-lg font-extrabold tracking-tight">MedGuard <span className="text-teal-500">AI</span></span>
          </div>
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="px-3 pb-3"><SosButton className="w-full" /></div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {NAV.map(({ id, label, icon: Icon, danger }) => {
            const active = page === id;
            return (
              <button key={id} onClick={() => { navigate(id); onClose(); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition
                ${active ? 'bg-teal-500 text-white' : danger ? 'text-red-300 hover:bg-red-500/15' : 'hover:bg-navy-800 hover:text-white'}`}>
                <Icon size={17} /> {label}{id === 'sos' && activeCount > 0 && <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">ACTIVE</span>}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Simulated role</p>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-navy-800 p-1" role="group" aria-label="Role">
            {[['caregiver', 'Caregiver'], ['patient', 'Patient']].map(([k, l]) => (
              <button key={k} aria-pressed={role === k} onClick={() => setRole(k)} className={`rounded-lg py-1.5 text-xs font-bold ${role === k ? 'bg-teal-500 text-white' : 'text-slate-300'}`}>{l}</button>))}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-slate-400">Demo only. There is no login or real access control.</p>
        </div>
      </aside>
    </>
  );
}
