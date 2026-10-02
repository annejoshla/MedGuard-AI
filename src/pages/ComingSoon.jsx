import { Hammer } from 'lucide-react';
import { NAV } from '../config/nav';
import { Card } from '../components/ui';
import { useApp } from '../context/AppContext';

export default function ComingSoon({ id }) {
  const { navigate } = useApp();
  const item = NAV.find((n) => n.id === id);
  const Icon = item?.icon || Hammer;
  return (
    <Card className="mx-auto mt-10 max-w-lg text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-50 text-teal-600"><Icon size={26} /></span>
      <h1 className="mt-4 text-xl font-extrabold">{item?.label}</h1>
      <p className="mt-1 text-sm text-slate-500">This page is planned for Stage {item?.stage}. Nothing here is faked in Stage 1.</p>
      <button onClick={() => navigate('dashboard')} className="mt-5 rounded-xl bg-navy-900 px-4 py-2 text-sm font-semibold text-white">Back to dashboard</button>
    </Card>
  );
}
