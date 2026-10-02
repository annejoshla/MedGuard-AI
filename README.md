# MedGuard AI
npm install && npm run dev
Add pages in src/pages, register them in src/App.jsx (PAGES) and src/config/nav.js.

## Stage 6: AI Health Assistant (`#/assistant`)
- `src/utils/safety.js`: deterministic emergency and urgent rules. They run before any reply is generated and show a static emergency card (no follow-up questions, no loading delay). Also holds the output guard that blocks diagnoses, medicine names/doses and reassurance in any generated text.
- `src/utils/assistant.js`: labelled sample replies (default) and an optional real-service call. Set `VITE_ASSISTANT_URL` to POST `{ system, messages, profile }` and read `{ reply }`. Safety rules and the output guard still apply. Profile data would leave the browser, so enable only with a service you trust.
- `src/utils/visitPrep.js`: plain-text notes builder for doctor visits.
- Data added to the saved state (migration `migrate6`): `symptoms`, `chats`, `visitNotes`. Older saved data upgrades automatically.
- Emergency numbers are for India (112, 108, Tele-MANAS 14416). Confirm before any real-world use.
- The rules are a prototype, have not been clinically validated, and can miss warning signs. Have a clinician review them before any real use.

## Stage 7: Emergency contacts and SOS (`#/contacts`, `#/sos`)
- **Contacts** (`pages/Contacts.jsx`): add, edit, delete family, caregivers, doctors, hospitals and ambulance services, each with notes, a primary flag (one per person) and a "Receive SOS alerts" switch. Older sample contacts upgrade automatically (migration `migrate7`) and are labelled Sample: their numbers are made up.
- **SOS button** (`components/sos/SosUi.jsx`): on the dashboard, the mobile header, the sidebar and the SOS page. It only opens a confirmation screen. Emergency type (General emergency is preselected), per-alert contact choice, and optional location and medical details (all OFF unless ticked). Sending needs a press-and-hold (or two taps for people who cannot hold).
- **Calling**: `tel:` links for 112 (emergency), 108 (ambulance), the primary family contact and doctor. They are at the top of the confirmation screen, the active screen and the banner, so they never depend on an alert being created. The app cannot place calls or know if one connected, and never says so.
- **Active alert** (`components/sos/ActiveEmergency.jsx`): SOS ACTIVE screen and a banner on every page until the alert is cancelled or marked resolved. Both need confirmation, and the dialog says it does not end a call or stop help. Optional simulated "status update" to contacts.
- **Notifications are simulated.** `services/notifications.js` is the only module that creates or delivers notifications. Statuses: Simulated sent, Pending, Failed (with Retry). Failures come from: no network, an invalid phone number, or the demo switch on the SOS page. All are labelled Simulated in the UI. Alerts that were pending when the page closed are shown as Failed.
- **Backend later**: add a provider `{ send({ notification, message }) => Promise<{ status: 'sent'|'failed', error? }> }` to `PROVIDERS` in `services/notifications.js` and set `NOTIFY_PROVIDER` in `config/sos.js`. A real service also needs consent for messaging, phone verification, delivery receipts, retries and a server-side audit log.
- **Privacy**: location and medical details go into a message only when ticked for that alert. "Remember these choices" is off by default. Everything, including coordinates, is stored in this browser's LocalStorage. Real medical data should not be stored or sent like this.
- **Limits**: the caregiver dashboard shows alerts only because patient and caregiver share one browser. Emergency numbers are for India; confirm before real use. Not clinically or legally reviewed.
