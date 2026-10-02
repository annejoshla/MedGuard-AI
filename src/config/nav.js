import { LayoutDashboard, ShieldCheck, FileText, Pill, Package, CalendarCheck, Bell, RefreshCw, HeartHandshake, Users, CalendarDays, Bot, Activity, BellRing, BarChart3, Trash2, Phone, Siren, Settings } from 'lucide-react';

// stage = the build stage in which the page becomes functional
export const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, stage: 1 },
  { id: 'audit', label: 'AI Medicine Audit', icon: ShieldCheck, stage: 2 },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, stage: 2 },
  { id: 'inventory', label: 'Medicine Inventory', icon: Pill, stage: 2 },
  { id: 'box', label: 'Digital Medicine Box', icon: Package, stage: 2 },
  { id: 'tracker', label: 'Daily Medication Tracker', icon: CalendarCheck, stage: 3 },
  { id: 'reminders', label: 'Reminders', icon: Bell, stage: 3 },
  { id: 'refill', label: 'Supply and Refill Planner', icon: RefreshCw, stage: 3 },
  { id: 'caregiver', label: 'Caregiver Dashboard', icon: HeartHandshake, stage: 4 },
  { id: 'family', label: 'Family Profiles', icon: Users, stage: 4 },
  { id: 'appointments', label: 'Appointments', icon: CalendarDays, stage: 4 },
  { id: 'assistant', label: 'AI Health Assistant', icon: Bot, stage: 5 },
  { id: 'agents', label: 'Agent Activity', icon: Activity, stage: 5 },
  { id: 'notifications', label: 'Notifications', icon: BellRing, stage: 5 },
  { id: 'waste', label: 'Waste Analytics', icon: BarChart3, stage: 6 },
  { id: 'disposal', label: 'Medicine Disposal Guide', icon: Trash2, stage: 6 },
  { id: 'contacts', label: 'Emergency Contacts', icon: Phone, stage: 7 },
  { id: 'sos', label: 'Emergency SOS', icon: Siren, stage: 7, danger: true },
  { id: 'settings', label: 'Settings', icon: Settings, stage: 1 },
];
