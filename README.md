# ClinicFlow — Doctor Appointment Booking (Demo)

A demo appointment booking app for a single-doctor clinic, built with Next.js 15, React 19 and Tailwind CSS 4.
All data is fake and lives in the browser (localStorage) — there is no database or backend.

## What's inside

**Patient app** (`/patient`)
- Doctor profile / clinic website (`/`) with live clinic status
- Mobile OTP sign-in (simulated)
- Slot booking for self or family members, new vs follow-up, clinic or video
- Demo payment (UPI / card / pay at clinic)
- **Live queue tracker with wait-time prediction** — "You are #4, expected at 11:35, leave home by 11:15"
- **Upload old prescriptions, lab reports and scans** (photo or PDF) and attach them to a visit
- Digital prescriptions (printable / PDF), daily medicine reminders, health timeline
- Reschedule, cancel, rate visits, follow-up reminders, notifications

**Doctor dashboard** (`/doctor`)
- Today's queue: call next, skip, no-show, walk-ins, live consult timer
- "Running late" broadcast that updates every waiting patient's predicted time
- Prescription writer with templates, medicine search, allergy warning, follow-up
- Calendar, patient records with uploads, analytics (peak hours, no-show rate, revenue), reviews
- Availability, fees and leave management

Open the patient and doctor views in two browser tabs — they stay in sync.
Use **Reset demo data** in the menu to start over.

## How wait-time prediction works

`src/lib/predict.ts` learns the doctor's average consultation time per visit type from completed visits,
then for each waiting patient: `eta = now + remaining time of current consult + Σ expected time of patients ahead + announced delay`,
never earlier than the booked slot, with a ± range from the historical spread.

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Render)

Build command `npm install && npm run build`, start command `npm run start` (see `render.yaml`).
