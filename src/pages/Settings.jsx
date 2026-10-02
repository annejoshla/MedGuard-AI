import { Card } from '../components/ui';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const { patients, patient, setPatient, resetData } = useApp();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <Card title="Selected patient">
        <select value={patient.id} onChange={(e) => setPatient(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.relation})</option>)}
        </select>
      </Card>
      <Card title="Demo data">
        <p className="mb-3 text-sm text-slate-500">All changes are saved in this browser. Reset restores the original sample data.</p>
        <button onClick={() => window.confirm('Reset all data to the sample set?') && resetData()} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Reset sample data</button>
      </Card>
    </div>
  );
}
