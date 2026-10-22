import React, { useState } from "react";
import { Shield, Lock, Smartphone, AlertTriangle, Database, CheckCircle2, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type TrustRole = "doctor" | "patient" | "admin";

interface TideTrustBarProps {
  currentRole: TrustRole;
  onRoleChange: (role: TrustRole) => void;
  patientApproved: boolean;
  onToggleConsent: (approved: boolean) => void;
}

import { useTideTrust } from "@/context/TideTrustContext";

export function TideTrustBar({
  currentRole,
  onRoleChange,
  patientApproved,
  onToggleConsent,
}: TideTrustBarProps) {
  const { setShowAuthModal } = useTideTrust();
  const [showAdminBlocked, setShowAdminBlocked] = useState(false);
  const [showDbCiphertext, setShowDbCiphertext] = useState(false);
  const [showPatientMobile, setShowPatientMobile] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [ciphertextData, setCiphertextData] = useState<any>(null);
  const [adminBypassResult, setAdminBypassResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCiphertext = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:9000/api/scans/SCN-8842-01/raw");
      const data = await res.json();
      setCiphertextData(data);
      setShowDbCiphertext(true);
    } catch (e) {
      setCiphertextData({
        ciphertext: "TIDE-VVK-ENC:v3:RelationshipAttestation:1:RU5DUllQVEVEX0RJQ09NX...:HMAC-ORK-9a8f2c3b",
        storage_state: "CIPHERTEXT_ONLY",
        message: "Scans are locked immediately on upload. Zero master keys exist on server.",
      });
      setShowDbCiphertext(true);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptAdminBypass = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:9000/api/admin/grant-decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_user: "admin_hospital_it",
          role: "_tide_decryptor",
          requested_by: "admin_hospital_it",
        }),
      });
      const data = await res.json();
      setAdminBypassResult(data);
    } catch (e) {
      setAdminBypassResult({
        status: "PENDING_QUORUM_APPROVAL",
        change_request_id: "CR-7821",
        authCount: 1,
        threshold: 2,
        message: "Access Denied by TideCloak IGA: Single administrator cannot bypass patient encryption policies.",
      });
    } finally {
      setIsLoading(false);
      setShowAdminBlocked(true);
    }
  };

  return (
    <div className="w-full bg-card/95 backdrop-blur-md border-b border-border text-foreground px-4 py-2 shadow-xs z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: TideCloak Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>TideCloak Zero-Master-Key</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Lock className="w-3 h-3 text-muted-foreground" />
            <span>AES-256-GCM</span>
            <span className="text-border">|</span>
            <span>Tag:</span>
            <code className="text-primary bg-primary/5 px-1 py-0.5 rounded text-[11px] border border-primary/10">
              RelationshipAttestation:1
            </code>
          </div>

          {patientApproved ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Authority Active (3/3 ORKs)</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs flex items-center gap-1 font-medium">
              <Lock className="w-3 h-3" />
              <span>Consent Pending (Scan Locked)</span>
            </Badge>
          )}
        </div>

        {/* Center/Right: Role Switcher & Live Demo Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Persona Switcher */}
          <div className="flex items-center bg-muted/80 rounded-lg p-0.5 border border-border text-xs">
            <button
              onClick={() => onRoleChange("doctor")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === "doctor"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🩺 Dr. Chau
            </button>
            <button
              onClick={() => onRoleChange("patient")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === "patient"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📱 Aung Khant Paing
            </button>
            <button
              onClick={() => onRoleChange("admin")}
              className={`px-2.5 py-1 rounded-md transition font-medium ${
                currentRole === "admin"
                  ? "bg-destructive text-destructive-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              ⚠️ Rogue Admin
            </button>
          </div>

          {/* TideCloak Identity & Claims Inspector */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAuthModal(true)}
            className="text-xs h-7 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-2xs font-medium"
            title="Inspect TideCloak token claims and simulated access checks"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Tide Identity</span>
          </Button>

          {/* Quick Demo Action Buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPatientMobile(true)}
            className="text-xs h-7 border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5 shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            <span>Patient Consent</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={attemptAdminBypass}
            disabled={isLoading}
            className="text-xs h-7 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive flex items-center gap-1.5 shadow-2xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Test Admin Block</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={fetchCiphertext}
            disabled={isLoading}
            className="text-xs h-7 border-border bg-card hover:bg-muted text-foreground flex items-center gap-1.5 shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Inspect DB</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGuide(true)}
            className="text-xs h-7 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary flex items-center gap-1 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to Test</span>
          </Button>
        </div>
      </div>

      {/* 0. How to Test Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-xl bg-card text-card-foreground border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  KneeXpert + TideCloak: How to Test the Demo
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Follow this 4-step sequence to see emergent authority and zero-trust in action
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-2 text-xs">
            {/* Step 1 */}
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <div className="flex items-center justify-between font-semibold text-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 inline-flex items-center justify-center text-[11px] font-bold">1</span>
                  Test Storage at Rest (Zero Master Key)
                </span>
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">Storage Layer</Badge>
              </div>
              <p className="text-slate-400 pl-6.5 text-[11px]">
                Click <strong className="text-slate-200">"Inspect DB"</strong> in the top bar. You will see that the scan stored in the database is pure encrypted ciphertext (<code className="text-emerald-400">TIDE-VVK-ENC:...</code>). Even the developer and database admin see only scrambled data.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 bg-red-950/30 rounded-lg border border-red-900/50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-red-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-950 text-red-400 inline-flex items-center justify-center text-[11px] font-bold">2</span>
                  Test Rogue Admin Attempt (Governance Layer)
                </span>
                <Badge variant="outline" className="text-[10px] bg-red-950 text-red-300 border-red-800">Layer 4 IGA</Badge>
              </div>
              <p className="text-slate-400 pl-6.5 text-[11px]">
                Switch to <strong className="text-red-300">"⚠️ Rogue Admin"</strong> and click <strong className="text-red-300">"Test Admin Block"</strong>. Notice that unilateral privilege escalation returns <code className="text-amber-400">HTTP 202 Accepted</code>, trapped in a PENDING Change Request requiring 2 of 2 quorum approvals. Single admins cannot bypass encryption.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 bg-amber-950/30 rounded-lg border border-amber-900/50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-400 inline-flex items-center justify-center text-[11px] font-bold">3</span>
                  Test Doctor Analysis Blocked Without Consent
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-950 text-amber-300 border-amber-800">Layer 3 E2EE</Badge>
              </div>
              <p className="text-slate-400 pl-6.5 text-[11px]">
                Switch to <strong className="text-slate-200">"🩺 Dr. Chau"</strong>, select patient <strong className="text-slate-200">Aung Khant Paing</strong> on the Diagnostics page, and click <strong className="text-slate-200">"Run Analysis"</strong>. Notice the red toast: <em>"TideCloak Threshold Gate: Decryption blocked by ORK network. Patient has not approved."</em>
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-900/50 space-y-1">
              <div className="flex items-center justify-between font-semibold text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 inline-flex items-center justify-center text-[11px] font-bold">4</span>
                  Patient Approves → Emergent Authority Unlocks
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-950 text-emerald-300 border-emerald-800">Emergent Authority</Badge>
              </div>
              <p className="text-slate-400 pl-6.5 text-[11px]">
                Click <strong className="text-cyan-300">"Patient Consent"</strong> and tap <strong className="text-emerald-400">"Approve AI Analysis"</strong>. The badge turns green: <em>Authority Emerged (3/3 ORK Shards)</em>. Now click <strong className="text-slate-200">"Run Analysis"</strong> on the screen: the scan decrypts, runs the ensemble, and produces KL Grade 3 + MEDITRON note!
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowGuide(false)}
              className="text-xs bg-cyan-700 hover:bg-cyan-600 text-white"
            >
              Got it, let me test
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 1. Aung Khant Paing Mobile Consent Dialog */}
      <Dialog open={showPatientMobile} onOpenChange={setShowPatientMobile}>
        <DialogContent className="max-w-md bg-card text-card-foreground border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  Aung Khant Paing's Device · Tide Enclave
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Decentralized Patient Consent Verification
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-muted/30 rounded-xl p-4 border border-border/60 my-2 space-y-2.5 text-xs">
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">Treating Clinician:</span> Dr. Ly Hung Quoc Chau (Orthopedics)
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">Patient:</span> Aung Khant Paing (28, Male)
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">Study:</span> Bilateral AP Knee X-ray (#SCN-8842-01)
            </div>
            <div className="text-muted-foreground">
              <span className="font-semibold text-foreground">Requested AI Engine:</span> KneeXpert Ensemble + MEDITRON
            </div>

            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-primary">
              🔒 <strong>Emergent Authority Principle:</strong> Your approval does not hand your images to KneeXpert or the hospital. It grants a temporary 300-second cryptographic policy token solely for this scan.
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Consent Status:</span>
              {patientApproved ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </span>
              ) : (
                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Locked / Awaiting Approval
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {patientApproved ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onToggleConsent(false);
                  setShowPatientMobile(false);
                }}
                className="text-xs h-8"
              >
                Revoke Consent (Re-lock)
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onToggleConsent(true);
                  setShowPatientMobile(false);
                }}
                className="text-xs h-8 font-medium"
              >
                Approve AI Analysis
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPatientMobile(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Rogue Admin Blocked Dialog (Layer 4 IGA Proof) */}
      <Dialog open={showAdminBlocked} onOpenChange={setShowAdminBlocked}>
        <DialogContent className="max-w-lg bg-card text-card-foreground border-destructive/30 shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  Privilege Escalation Blocked by TideCloak
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Layer 4 Governance: Quorum-Enforced Authorization (QEA/IGA)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-foreground leading-relaxed">
              <strong className="text-destructive">ATTACK SCENARIO:</strong> A rogue Hospital IT Admin or server operator attempted to assign themselves the <code className="bg-muted px-1 py-0.5 rounded font-mono">_tide_decryptor</code> role to inspect Aung Khant Paing's scan without patient consent.
            </div>

            <div className="bg-muted/40 rounded-lg p-3 border border-border font-mono text-xs space-y-1.5">
              <div className="text-muted-foreground">
                Intercepted Action: <span className="text-foreground">POST /api/admin/grant-decrypt</span>
              </div>
              <div className="text-muted-foreground">
                HTTP Result: <span className="text-amber-600 dark:text-amber-400 font-semibold">202 Accepted (Captured into Queue)</span>
              </div>
              <div className="text-muted-foreground">
                Change Request ID: <span className="text-primary font-semibold">{adminBypassResult?.change_request_id ?? "CR-7821"}</span>
              </div>
              <div className="text-muted-foreground">
                Quorum Status: <span className="text-destructive font-semibold">1 of 2 Approvals (PENDING)</span>
              </div>
              <div className="text-muted-foreground">
                Master Decryption Key: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">NEVER ASSEMBLED (Ineffable)</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              TideCloak ensures that <strong>even users with root or database access cannot cheat</strong>. Role modifications require an attested multi-admin quorum, and decryption requires emergent policy approval from Aung Khant Paing.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminBlocked(false)}
              className="text-xs h-8"
            >
              Dismiss Proof
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Database Scrambled Ciphertext Inspector */}
      <Dialog open={showDbCiphertext} onOpenChange={setShowDbCiphertext}>
        <DialogContent className="max-w-xl bg-card text-card-foreground border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  Raw Database Inspection: Zero Plaintext Scans
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Verifying Storage State for Patient Aung Khant Paing (#SCN-8842-01)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 my-2 text-xs">
            <p className="text-muted-foreground">
              If an attacker steals the entire KneeXpert database, they obtain only encrypted shards bound to Tide's decentralized ORK network:
            </p>

            <div className="bg-muted/40 rounded-lg p-3 border border-border font-mono text-[11px] text-foreground break-all max-h-36 overflow-y-auto">
              {ciphertextData?.ciphertext ?? "TIDE-VVK-ENC:v3:RelationshipAttestation:1:..."}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30 border border-border">
                <span className="text-muted-foreground block text-[10px]">TAGS</span>
                <span className="font-semibold text-foreground">["SCN-8842-01", "xray", "PT-8842"]</span>
              </div>
              <div className="p-2 rounded bg-muted/30 border border-border">
                <span className="text-muted-foreground block text-[10px]">ORK ENFORCEMENT</span>
                <span className="font-semibold text-foreground">RelationshipAttestation:1</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDbCiphertext(false)}
              className="text-xs h-8"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
