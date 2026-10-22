import { mockPatients, type Patient } from "@/data/patients";

const STORAGE_KEY = "kneexpert_patients_v5";

function hydrateFromMock(stored: Patient[]): Patient[] {
  const storedIds = new Set(stored.map(p => p.id));
  const merged = [...stored];
  for (const seed of mockPatients) {
    if (!storedIds.has(seed.id)) merged.push(seed);
  }
  const hydrated = merged.map(p => {
    const seed = mockPatients.find(m => m.id === p.id);
    if (!seed) return p;
    return {
      ...p,
      name: seed.name,
      age: seed.age,
      gender: seed.gender,
      scans: p.scans?.length ? p.scans : seed.scans,
      timeline: p.timeline?.length ? p.timeline : seed.timeline,
    };
  });

  // Ensure Aung Khant Paing (PT-8842) is always at the top
  const aungIndex = hydrated.findIndex(p => p.id === "PT-8842");
  if (aungIndex > -1) {
    hydrated[aungIndex].name = "Aung Khant Paing";
    const [aung] = hydrated.splice(aungIndex, 1);
    hydrated.unshift(aung);
  } else {
    hydrated.unshift(mockPatients[0]);
  }
  return hydrated;
}

export function loadPatients(): Patient[] | null {
  try {
    // Clear all legacy storage versions
    localStorage.removeItem("kneexpert_patients_v1");
    localStorage.removeItem("kneexpert_patients_v2");
    localStorage.removeItem("kneexpert_patients_v3");
    localStorage.removeItem("kneexpert_patients_v4");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockPatients;
    const parsed = JSON.parse(raw) as Patient[];
    if (!Array.isArray(parsed) || parsed.length === 0) return mockPatients;
    const hydrated = hydrateFromMock(parsed);
    // Safety check: ensure Aung Khant Paing is in the list
    if (!hydrated.some(p => p.name === "Aung Khant Paing")) {
      return mockPatients;
    }
    return hydrated;
  } catch {
    return mockPatients;
  }
}

export function savePatients(patients: Patient[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  } catch (e) {
    console.warn("Failed to persist patients", e);
  }
}

export function clearPatientStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
