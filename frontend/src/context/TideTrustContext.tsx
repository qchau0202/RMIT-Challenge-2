import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type TrustRole = "doctor" | "patient" | "admin";

export interface TideUserProfile {
  id: string;
  name: string;
  username: string;
  role: TrustRole;
  title: string;
  department: string;
  roles: string[];
  vuid: string;
  tideUserKey: string;
  isDPoPBound: boolean;
  canDecrypt: boolean;
  canEncrypt: boolean;
  governedByIGA: boolean;
}

export const TIDE_PROFILES: Record<TrustRole, TideUserProfile> = {
  doctor: {
    id: "usr-chau-882",
    name: "Dr. Ly Hung Quoc Chau",
    username: "dr-chau",
    role: "doctor",
    title: "Chief Orthopedic Clinician",
    department: "Musculoskeletal Diagnostics",
    roles: ["_tide_enabled", "_tide_decryptor", "_tide_encryptor", "appUser"],
    vuid: "vuid:usr:7b4dd8f3-dr-chau",
    tideUserKey: "dr-chau-key-2026",
    isDPoPBound: true,
    canDecrypt: true,
    canEncrypt: true,
    governedByIGA: false,
  },
  patient: {
    id: "usr-aung-paing-8842",
    name: "Aung Khant Paing",
    username: "aung-paing",
    role: "patient",
    title: "Patient (28M · #PT-8842)",
    department: "Outpatient Clinic",
    roles: ["_tide_enabled", "appUser"],
    vuid: "vuid:usr:9bdbe2a2-aung-paing",
    tideUserKey: "aung-paing-key-8842",
    isDPoPBound: true,
    canDecrypt: false,
    canEncrypt: false,
    governedByIGA: false,
  },
  admin: {
    id: "usr-admin-it-01",
    name: "Hospital IT Administrator",
    username: "admin_hospital_it",
    role: "admin",
    title: "Infrastructure & Systems Admin",
    department: "Health Information Technology",
    roles: ["admin", "default-roles-myrealm"],
    vuid: "vuid:usr:0fae912c-admin-it",
    tideUserKey: "admin-it-key-01",
    isDPoPBound: true,
    canDecrypt: false,
    canEncrypt: false,
    governedByIGA: true,
  },
};

interface TideTrustContextType {
  currentRole: TrustRole;
  setCurrentRole: (role: TrustRole) => void;
  currentUser: TideUserProfile;
  patientApproved: boolean;
  setPatientApproved: (approved: boolean) => void;
  toggleConsent: (approved?: boolean) => Promise<boolean>;
  doctorRequested: boolean;
  setDoctorRequested: (requested: boolean) => void;
  authorityEmerged: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
}

const TideTrustContext = createContext<TideTrustContextType | null>(null);

export function TideTrustProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<TrustRole>("doctor");
  const [patientApproved, setPatientApproved] = useState<boolean>(false);
  const [doctorRequested, setDoctorRequested] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const currentUser = TIDE_PROFILES[currentRole];

  // Sync with backend on startup
  useEffect(() => {
    fetch("http://localhost:9000/api/tide/scans/SCN-8842-01/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.patient_approved !== undefined) {
          setPatientApproved(data.patient_approved);
        }
      })
      .catch(() => {});
  }, []);

  const toggleConsent = useCallback(
    async (approved?: boolean) => {
      const nextState = approved !== undefined ? approved : !patientApproved;
      setPatientApproved(nextState);

      try {
        await fetch("http://localhost:9000/api/tide/patient/consent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scan_id: "SCN-8842-01",
            approved: nextState,
            patient_id: "PT-8842",
          }),
        });
      } catch (e) {
        console.warn("Backend consent sync failed, keeping local state:", e);
      }
      return nextState;
    },
    [patientApproved]
  );

  const authorityEmerged = patientApproved && doctorRequested;

  return (
    <TideTrustContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUser,
        patientApproved,
        setPatientApproved,
        toggleConsent,
        doctorRequested,
        setDoctorRequested,
        authorityEmerged,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </TideTrustContext.Provider>
  );
}

export function useTideTrust() {
  const ctx = useContext(TideTrustContext);
  if (!ctx) {
    throw new Error("useTideTrust must be used within a TideTrustProvider");
  }
  return ctx;
}
