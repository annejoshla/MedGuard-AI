import { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 ${className}`}>
    {(title || action) && (
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {action}
      </header>
    )}
    {children}
  </section>
);

const tones = {
  teal: 'bg-teal-50 text-teal-700', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700', slate: 'bg-slate-100 text-slate-600',
};
export const Badge = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
);

const statTone = { teal: 'text-teal-600 bg-teal-50', amber: 'text-amber-600 bg-amber-50', red: 'text-red-600 bg-red-50', navy: 'text-navy-700 bg-slate-100' };
export const StatCard = ({ label, value, hint, icon: Icon, tone = 'navy', onClick }) => (
  <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
    className="flex items-start justify-between rounded-2xl bg-white p-4 text-left shadow-card ring-1 ring-slate-100 transition hover:ring-teal-500/40">
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
    <span className={`rounded-xl p-2.5 ${statTone[tone]}`}><Icon size={18} /></span>
  </motion.button>
);

export const Empty = ({ children }) => <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">{children}</p>;

export const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-navy-900 outline-none focus:border-teal-500';
export const Field = ({ label, children, className = '' }) => (
  <label className={`block text-xs font-semibold text-slate-600 ${className}`}>{label}<div className="mt-1">{children}</div></label>
);
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} role="dialog" aria-modal="true" aria-label={title}
        className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 hover:bg-slate-100"><X size={18} /></button></div>
        {children}
      </motion.div>
    </motion.div>
  );
}
