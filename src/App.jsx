import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Prescriptions from './pages/Prescriptions';
import Audit from './pages/Audit';
import Tracker from './pages/Tracker';
import Reminders from './pages/Reminders';
import Family from './pages/Family';
import Caregiver from './pages/Caregiver';
import Appointments from './pages/Appointments';
import Refill from './pages/Refill';
import Assistant from './pages/Assistant';
import Contacts from './pages/Contacts';
import Sos from './pages/Sos';
import { SosUiProvider, SosButton, ActiveBanner } from './components/sos/SosUi';
import { useReminderNotifier } from './utils/notify';
import MedicineBox from './pages/MedicineBox';
import ComingSoon from './pages/ComingSoon';
import { useApp } from './context/AppContext';

// Register new pages here as each stage is built.
const PAGES = { dashboard: Dashboard, settings: Settings, inventory: Inventory, prescriptions: Prescriptions, box: MedicineBox, audit: Audit, tracker: Tracker, reminders: Reminders, refill: Refill, family: Family, caregiver: Caregiver, appointments: Appointments, assistant: Assistant, contacts: Contacts, sos: Sos };

export default function App() {
  const { page } = useApp();
  useReminderNotifier();
  const [open, setOpen] = useState(false);
  const Page = PAGES[page];
  return (
    <SosUiProvider>
      <div className="min-h-screen">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="lg:pl-64">
          <div className="sticky top-0 z-20">
            <header className="flex items-center gap-3 bg-slate-50/90 px-4 py-3 backdrop-blur lg:hidden">
              <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
              <span className="flex-1 font-extrabold">MedGuard AI</span>
              <SosButton />
            </header>
            <ActiveBanner />
          </div>
          <main className="mx-auto max-w-6xl p-4 lg:p-8">{Page ? <Page /> : <ComingSoon id={page} />}</main>
        </div>
      </div>
    </SosUiProvider>
  );
}
