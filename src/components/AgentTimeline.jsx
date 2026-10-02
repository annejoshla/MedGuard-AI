import { Loader2, CheckCircle2, AlertTriangle, MinusCircle, Circle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ICON = {
  running: <Loader2 size={18} className="animate-spin text-navy-700" />, done: <CheckCircle2 size={18} className="text-teal-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />, skipped: <MinusCircle size={18} className="text-slate-400" />,
  pending: <Circle size={18} className="text-slate-300" />, error: <XCircle size={18} className="text-red-500" />,
};
const LABEL = { running: 'Running', done: 'Done', warning: 'Needs review', skipped: 'Skipped', pending: 'Pending', error: 'Error' };

export default function AgentTimeline({ steps }) {
  return (
    <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[8px] before:top-2 before:w-px before:bg-slate-200">
      {steps.map((s) => (
        <motion.li key={s.id} layout initial={{ opacity: 0.4 }} animate={{ opacity: s.status === 'pending' ? 0.5 : 1 }} className="relative flex gap-3">
          <span className="z-10 grid h-[18px] w-[18px] place-items-center rounded-full bg-white">{ICON[s.status]}</span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold">{s.agent}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{LABEL[s.status]}</span>
              {s.ts && s.status !== 'pending' && <span className="text-[11px] text-slate-400">{new Date(s.ts).toLocaleTimeString()}</span>}
            </div>
            <p className="text-xs text-slate-500">{s.action}</p>
            {s.result && s.status !== 'running' && <p className="mt-0.5 text-xs font-semibold text-navy-800">{s.result}</p>}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
