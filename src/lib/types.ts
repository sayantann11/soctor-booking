export type VisitType = "new" | "followup";
export type VisitMode = "clinic" | "video";
export type ApptStatus =
  | "booked"
  | "checked-in"
  | "in-consult"
  | "done"
  | "no-show"
  | "cancelled";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  bloodGroup?: string;
  allergies: string[];
  conditions: string[];
  /** id of the account holder when this is a family member */
  familyOf?: string;
  relation?: string;
  travelMins?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM slot time
  token: number;
  type: VisitType;
  mode: VisitMode;
  status: ApptStatus;
  symptoms?: string;
  fee: number;
  paid: boolean;
  payMethod?: "UPI" | "Card" | "Clinic";
  startedAt?: number; // epoch ms
  endedAt?: number;
  consultMins?: number;
  rating?: number;
  review?: string;
  walkIn?: boolean;
  cancelReason?: string;
  uploadIds?: string[];
}

export interface Medicine {
  name: string;
  dose: string;
  frequency: string; // e.g. 1-0-1
  days: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  date: string;
  diagnosis: string;
  vitals?: { bp?: string; pulse?: string; temp?: string; weight?: string };
  medicines: Medicine[];
  tests: string[];
  advice: string;
  followUpDate?: string;
}

export type UploadKind = "prescription" | "lab" | "scan" | "other";

export interface Upload {
  id: string;
  patientId: string;
  name: string;
  kind: UploadKind;
  date: string;
  mime: string;
  size: number;
  dataUrl?: string;
  note?: string;
}

export interface Notification {
  id: string;
  to: "patient" | "doctor";
  patientId?: string;
  text: string;
  at: number;
  read: boolean;
}

export interface Review {
  id: string;
  patientName: string;
  rating: number;
  text: string;
  date: string;
  reply?: string;
}

export interface Settings {
  sessions: { start: string; end: string }[];
  slotMins: number;
  maxPerDay: number;
  fee: number;
  videoFee: number;
  followupFee: number;
  leaves: string[];
  delayMins: number;
  delayNote?: string;
}

export interface DoseLog {
  /** key: `${prescriptionId}|${date}|${medIndex}|${slot}` */
  [key: string]: boolean;
}

export interface AppState {
  version: number;
  seededFor: string;
  currentPatientId: string;
  patients: Patient[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  uploads: Upload[];
  notifications: Notification[];
  reviews: Review[];
  settings: Settings;
  doseLog: DoseLog;
}
