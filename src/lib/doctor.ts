// Demo doctor profile (fictional)
export const DOCTOR = {
  name: "Dr. Ananya Mehta",
  initials: "AM",
  title: "General Physician & Diabetologist",
  degrees: "MBBS, MD (General Medicine)",
  regNo: "MMC 2011/04/1234",
  experience: 14,
  languages: ["English", "Hindi", "Marathi"],
  clinic: "Mehta Family Clinic",
  address: "2nd Floor, Sunrise Plaza, FC Road, Shivajinagar, Pune 411005",
  phone: "+91 98765 43210",
  about:
    "Dr. Ananya Mehta has 14 years of experience treating fevers, infections, diabetes, thyroid, blood pressure and lifestyle conditions. She focuses on preventive care and long-term management for the whole family.",
  services: [
    "Fever & infections",
    "Diabetes care",
    "Thyroid disorders",
    "Blood pressure",
    "Health check-ups",
    "Vaccinations",
    "Lifestyle & diet advice",
    "Online consultation",
  ],
  education: [
    { what: "MD, General Medicine", where: "B.J. Medical College, Pune", year: 2011 },
    { what: "MBBS", where: "Seth GS Medical College, Mumbai", year: 2007 },
  ],
};

export const MEDICINE_LIBRARY = [
  { name: "Paracetamol 650 mg", dose: "1 tab", frequency: "1-1-1", days: 3, instructions: "After food" },
  { name: "Azithromycin 500 mg", dose: "1 tab", frequency: "1-0-0", days: 3, instructions: "Before food" },
  { name: "Cetirizine 10 mg", dose: "1 tab", frequency: "0-0-1", days: 5, instructions: "At bedtime" },
  { name: "Pantoprazole 40 mg", dose: "1 tab", frequency: "1-0-0", days: 7, instructions: "Empty stomach" },
  { name: "Metformin 500 mg", dose: "1 tab", frequency: "1-0-1", days: 30, instructions: "After food" },
  { name: "Glimepiride 1 mg", dose: "1 tab", frequency: "1-0-0", days: 30, instructions: "Before breakfast" },
  { name: "Telmisartan 40 mg", dose: "1 tab", frequency: "1-0-0", days: 30, instructions: "Morning" },
  { name: "Amlodipine 5 mg", dose: "1 tab", frequency: "0-0-1", days: 30, instructions: "Night" },
  { name: "Thyroxine 50 mcg", dose: "1 tab", frequency: "1-0-0", days: 30, instructions: "Empty stomach, 30 min before breakfast" },
  { name: "Vitamin D3 60000 IU", dose: "1 cap", frequency: "weekly", days: 56, instructions: "Once a week with milk" },
  { name: "ORS sachet", dose: "1 sachet in 1 L water", frequency: "sip often", days: 3, instructions: "Through the day" },
  { name: "Cough syrup (Dextromethorphan)", dose: "10 ml", frequency: "1-1-1", days: 5, instructions: "After food" },
  { name: "Ibuprofen 400 mg", dose: "1 tab", frequency: "1-0-1", days: 3, instructions: "After food" },
  { name: "Montelukast 10 mg", dose: "1 tab", frequency: "0-0-1", days: 10, instructions: "Night" },
];

export const RX_TEMPLATES = [
  {
    name: "Viral fever",
    diagnosis: "Acute viral fever",
    meds: ["Paracetamol 650 mg", "Cetirizine 10 mg", "ORS sachet"],
    tests: ["CBC"],
    advice: "Rest, plenty of fluids, light diet. Come back if fever lasts more than 3 days.",
  },
  {
    name: "Diabetes follow-up",
    diagnosis: "Type 2 diabetes mellitus — on treatment",
    meds: ["Metformin 500 mg", "Glimepiride 1 mg"],
    tests: ["HbA1c", "Fasting blood sugar"],
    advice: "30 min walk daily, avoid sweets and refined carbs, monitor sugar twice a week.",
  },
  {
    name: "Hypertension",
    diagnosis: "Essential hypertension",
    meds: ["Telmisartan 40 mg"],
    tests: ["Lipid profile", "Serum creatinine"],
    advice: "Low salt diet, daily walk, check BP every morning and keep a log.",
  },
  {
    name: "Acidity",
    diagnosis: "Gastritis / acid reflux",
    meds: ["Pantoprazole 40 mg"],
    tests: [],
    advice: "Small frequent meals, avoid spicy and oily food, no lying down for 2 h after meals.",
  },
];
