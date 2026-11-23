import type {
  AppState,
  Appointment,
  Patient,
  Prescription,
  Review,
  Upload,
  Notification,
} from "./types";
import { addDays, fromMins, parseDate, todayStr } from "./time";

export const STATE_VERSION = 3;

// Small deterministic PRNG so the demo data looks the same every reset
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FIRST = [
  "Aarav", "Priya", "Rohan", "Sneha", "Vikram", "Kavya", "Arjun", "Isha", "Karan", "Meera",
  "Siddharth", "Ananya", "Nikhil", "Pooja", "Aditya", "Riya", "Manish", "Neha", "Suresh", "Divya",
  "Rajesh", "Swati", "Amit", "Shruti", "Gaurav", "Tanvi", "Harish", "Lata", "Omkar", "Bhavna",
];
const LAST = [
  "Sharma", "Patil", "Kulkarni", "Deshpande", "Joshi", "Iyer", "Nair", "Gupta", "Reddy", "Shah",
  "Kapoor", "Singh", "Jain", "Pawar", "Bhosale", "Menon", "Rao", "Chavan",
];
const SYMPTOMS = [
  "Fever and body ache for 2 days",
  "Cough and cold since last week",
  "Diabetes follow-up, sugar readings attached",
  "BP check and medicine refill",
  "Stomach pain and acidity",
  "Headache and weakness",
  "Thyroid report review",
  "Skin rash and itching",
  "Routine health check-up",
  "Sore throat",
  "Joint pain in knees",
  "Follow-up after blood tests",
];
const REVIEW_TEXT = [
  "Very patient and explains everything clearly. The live queue update saved me an hour of waiting!",
  "Booked in 1 minute and knew exactly when to reach the clinic. Highly recommended.",
  "Doctor is very knowledgeable. Prescription on the phone is super convenient.",
  "Good experience, clinic is clean and staff are polite.",
  "Uploaded my old reports before the visit and doctor had already gone through them.",
  "Took time to understand my diabetes history. Feeling much better now.",
  "Online consultation was smooth. Got the prescription within minutes.",
  "Waiting time was a bit more than predicted but they informed us in advance.",
];

export function makeSeed(now: number = Date.now()): AppState {
  const r = rng(20261123);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const today = todayStr();

  // ---- patients ----
  const patients: Patient[] = [
    {
      id: "p1",
      name: "Rahul Verma",
      age: 34,
      gender: "Male",
      phone: "+91 90000 11111",
      bloodGroup: "B+",
      allergies: ["Penicillin"],
      conditions: ["Mild asthma"],
      travelMins: 20,
    },
    {
      id: "p2",
      name: "Sunita Verma",
      age: 62,
      gender: "Female",
      phone: "+91 90000 11111",
      bloodGroup: "O+",
      allergies: [],
      conditions: ["Type 2 diabetes", "Hypertension"],
      familyOf: "p1",
      relation: "Mother",
      travelMins: 20,
    },
    {
      id: "p3",
      name: "Aarush Verma",
      age: 7,
      gender: "Male",
      phone: "+91 90000 11111",
      bloodGroup: "B+",
      allergies: [],
      conditions: [],
      familyOf: "p1",
      relation: "Son",
      travelMins: 20,
    },
  ];
  for (let i = 0; i < 40; i++) {
    const g = r() > 0.5 ? "Male" : "Female";
    patients.push({
      id: `p${i + 10}`,
      name: `${pick(FIRST)} ${pick(LAST)}`,
      age: 18 + Math.floor(r() * 60),
      gender: g,
      phone: `+91 9${Math.floor(100000000 + r() * 899999999)}`.replace(/(\d{5})(\d{5})$/, "$1 $2"),
      bloodGroup: pick(["A+", "B+", "O+", "AB+", "O-", "A-"]),
      allergies: r() > 0.85 ? [pick(["Sulfa drugs", "Peanuts", "Dust"])] : [],
      conditions: r() > 0.6 ? [pick(["Type 2 diabetes", "Hypertension", "Hypothyroidism", "Asthma"])] : [],
    });
  }
  const others = patients.slice(3);

  const appointments: Appointment[] = [];
  let aid = 1;
  const newId = () => `a${aid++}`;

  // ---- history: last 45 days ----
  const sessionSlots: string[] = [];
  for (let m = 9 * 60; m < 13 * 60; m += 15) sessionSlots.push(fromMins(m));
  for (let m = 17 * 60; m < 20 * 60 + 30; m += 15) sessionSlots.push(fromMins(m));

  for (let d = 45; d >= 1; d--) {
    const date = addDays(today, -d);
    const dow = parseDate(date).getDay();
    if (dow === 0) continue; // Sunday closed
    const count = 9 + Math.floor(r() * 12) + (dow === 1 ? 4 : 0);
    const slots = [...sessionSlots].sort(() => r() - 0.5).slice(0, count).sort();
    slots.forEach((time, idx) => {
      const p = pick(others);
      const type = r() > 0.4 ? "followup" : "new";
      const roll = r();
      const status = roll < 0.08 ? "no-show" : roll < 0.12 ? "cancelled" : "done";
      const consult = type === "new" ? 11 + Math.round(r() * 7) : 6 + Math.round(r() * 6);
      const mode = r() > 0.85 ? "video" : "clinic";
      appointments.push({
        id: newId(),
        patientId: p.id,
        date,
        time,
        token: idx + 1,
        type,
        mode,
        status,
        symptoms: pick(SYMPTOMS),
        fee: mode === "video" ? 400 : type === "new" ? 600 : 400,
        paid: status === "done",
        payMethod: status === "done" ? pick(["UPI", "UPI", "Card", "Clinic"] as const) : undefined,
        consultMins: status === "done" ? consult : undefined,
        rating: status === "done" && r() > 0.7 ? (r() > 0.25 ? 5 : 4) : undefined,
      });
    });
  }

  // ---- past visits for the demo family ----
  const rahulPast: Appointment = {
    id: newId(),
    patientId: "p1",
    date: addDays(today, -21),
    time: "10:15",
    token: 4,
    type: "new",
    mode: "clinic",
    status: "done",
    symptoms: "Fever, cough and body ache for 3 days",
    fee: 600,
    paid: true,
    payMethod: "UPI",
    consultMins: 13,
    rating: 5,
    review: "Explained everything clearly.",
  };
  const sunitaPast: Appointment = {
    id: newId(),
    patientId: "p2",
    date: addDays(today, -35),
    time: "18:00",
    token: 3,
    type: "followup",
    mode: "clinic",
    status: "done",
    symptoms: "Diabetes follow-up",
    fee: 400,
    paid: true,
    payMethod: "Card",
    consultMins: 9,
  };
  appointments.push(rahulPast, sunitaPast);

  // ---- today: a live queue built around the current time ----
  const d = new Date(now);
  const nowMins = d.getHours() * 60 + d.getMinutes();
  const base = Math.min(Math.floor(nowMins / 15) * 15 - 75, 23 * 60 + 45 - 13 * 15); // first slot 75 min ago, never past midnight
  const todayList: Appointment[] = [];
  const TODAY_COUNT = 14;
  const YOU_TOKEN = 9;
  const IN_CONSULT_TOKEN = 6;
  for (let t = 1; t <= TODAY_COUNT; t++) {
    const isYou = t === YOU_TOKEN;
    const p = isYou ? patients[0] : others[(t * 7) % others.length];
    const type = isYou ? "followup" : t % 3 === 0 ? "new" : "followup";
    let status: Appointment["status"] = "booked";
    if (t < IN_CONSULT_TOKEN) status = t === 3 ? "no-show" : "done";
    if (t === IN_CONSULT_TOKEN) status = "in-consult";
    if (t === 7 || t === 8) status = "checked-in";
    const consult = type === "new" ? 13 : 8;
    todayList.push({
      id: newId(),
      patientId: p.id,
      date: today,
      time: fromMins(base + (t - 1) * 15),
      token: t,
      type,
      mode: t === 12 ? "video" : "clinic",
      status,
      symptoms: isYou ? "Follow-up for cough; uploaded my chest X-ray report" : pick(SYMPTOMS),
      fee: type === "new" ? 600 : 400,
      paid: status === "done" || isYou || t % 2 === 0,
      payMethod: status === "done" || isYou ? "UPI" : t % 2 === 0 ? "UPI" : undefined,
      consultMins: status === "done" ? consult + (t % 2) * 3 : undefined,
      startedAt: status === "in-consult" ? now - 4 * 60000 : undefined,
      walkIn: t === 11,
      uploadIds: isYou ? ["u2"] : undefined,
    });
  }
  appointments.push(...todayList);

  // ---- upcoming ----
  for (let dd = 1; dd <= 6; dd++) {
    const date = addDays(today, dd);
    if (parseDate(date).getDay() === 0) continue;
    const n = 5 + Math.floor(r() * 6);
    const slots = [...sessionSlots].sort(() => r() - 0.5).slice(0, n).sort();
    slots.forEach((time, idx) => {
      const p = pick(others);
      appointments.push({
        id: newId(),
        patientId: p.id,
        date,
        time,
        token: idx + 1,
        type: r() > 0.5 ? "followup" : "new",
        mode: r() > 0.8 ? "video" : "clinic",
        status: "booked",
        symptoms: pick(SYMPTOMS),
        fee: 500,
        paid: r() > 0.5,
        payMethod: undefined,
      });
    });
  }
  // Sunita has an upcoming diabetes follow-up
  appointments.push({
    id: newId(),
    patientId: "p2",
    date: addDays(today, 3),
    time: "18:30",
    token: 2,
    type: "followup",
    mode: "video",
    status: "booked",
    symptoms: "Diabetes follow-up, HbA1c report uploaded",
    fee: 400,
    paid: false,
  });

  // ---- prescriptions ----
  const prescriptions: Prescription[] = [
    {
      id: "rx1",
      appointmentId: rahulPast.id,
      patientId: "p1",
      date: rahulPast.date,
      diagnosis: "Lower respiratory tract infection",
      vitals: { bp: "122/80", pulse: "88", temp: "100.8 Â°F", weight: "74 kg" },
      medicines: [
        { name: "Azithromycin 500 mg", dose: "1 tab", frequency: "1-0-0", days: 3, instructions: "Before food" },
        { name: "Paracetamol 650 mg", dose: "1 tab", frequency: "1-1-1", days: 3, instructions: "After food, only if fever" },
        { name: "Montelukast 10 mg", dose: "1 tab", frequency: "0-0-1", days: 10, instructions: "Night" },
        { name: "Cough syrup (Dextromethorphan)", dose: "10 ml", frequency: "1-1-1", days: 5, instructions: "After food" },
      ],
      tests: ["Chest X-ray", "CBC"],
      advice: "Steam inhalation twice daily, warm fluids. Avoid cold drinks. Review with X-ray report.",
      followUpDate: today,
    },
    {
      id: "rx2",
      appointmentId: sunitaPast.id,
      patientId: "p2",
      date: sunitaPast.date,
      diagnosis: "Type 2 diabetes mellitus with hypertension",
      vitals: { bp: "138/86", pulse: "76", weight: "68 kg" },
      medicines: [
        { name: "Metformin 500 mg", dose: "1 tab", frequency: "1-0-1", days: 90, instructions: "After food" },
        { name: "Telmisartan 40 mg", dose: "1 tab", frequency: "1-0-0", days: 90, instructions: "Morning" },
        { name: "Vitamin D3 60000 IU", dose: "1 cap", frequency: "weekly", days: 56, instructions: "Once a week with milk" },
      ],
      tests: ["HbA1c", "Lipid profile"],
      advice: "Daily 30 min walk. Avoid sweets. Check sugar twice a week.",
      followUpDate: addDays(today, 3),
    },
  ];

  // ---- uploads (no file bytes for seeded ones) ----
  const uploads: Upload[] = [
    {
      id: "u1",
      patientId: "p1",
      name: "Old prescription - Dr. Kale 2025.jpg",
      kind: "prescription",
      date: addDays(today, -120),
      mime: "image/jpeg",
      size: 412000,
      note: "Asthma inhaler prescription from previous doctor",
    },
    {
      id: "u2",
      patientId: "p1",
      name: "Chest X-ray report.pdf",
      kind: "scan",
      date: addDays(today, -2),
      mime: "application/pdf",
      size: 890000,
      note: "X-ray advised at last visit",
    },
    {
      id: "u3",
      patientId: "p2",
      name: "HbA1c - Metro Labs.pdf",
      kind: "lab",
      date: addDays(today, -1),
      mime: "application/pdf",
      size: 240000,
      note: "HbA1c 7.4%",
    },
  ];

  const reviews: Review[] = REVIEW_TEXT.map((text, i) => ({
    id: `rv${i + 1}`,
    patientName: `${pick(FIRST)} ${pick(LAST).charAt(0)}.`,
    rating: i === 7 ? 4 : r() > 0.2 ? 5 : 4,
    text,
    date: addDays(today, -(i * 4 + 1)),
    reply: i === 0 ? "Thank you! Wishing you good health." : undefined,
  }));

  const notifications: Notification[] = [
    {
      id: "n1",
      to: "patient",
      patientId: "p1",
      text: "Reminder: your follow-up with Dr. Ananya Mehta is today. Token #9.",
      at: now - 3 * 3600000,
      read: false,
    },
    {
      id: "n2",
      to: "patient",
      patientId: "p2",
      text: "Sunita's diabetes follow-up (video) is in 3 days. Please upload the HbA1c report.",
      at: now - 26 * 3600000,
      read: true,
    },
    {
      id: "n3",
      to: "doctor",
      text: "Rahul Verma uploaded a new report: Chest X-ray report.pdf",
      at: now - 2 * 86400000,
      read: false,
    },
    {
      id: "n4",
      to: "doctor",
      text: "New booking: Sunita Verma â€” video consult in 3 days",
      at: now - 26 * 3600000,
      read: true,
    },
  ];

  return {
    version: STATE_VERSION,
    seededFor: today,
    currentPatientId: "p1",
    patients,
    appointments,
    prescriptions,
    uploads,
    notifications,
    reviews,
    settings: {
      sessions: [
        { start: "09:00", end: "13:00" },
        { start: "17:00", end: "21:00" },
      ],
      slotMins: 15,
      maxPerDay: 30,
      fee: 600,
      followupFee: 400,
      videoFee: 400,
      leaves: [addDays(today, 10), addDays(today, 11)],
      delayMins: 0,
    },
    doseLog: {},
  };
}
