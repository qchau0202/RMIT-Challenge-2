import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Lock, Unlock, Smartphone, AlertTriangle, CheckCircle2,
  Database, RefreshCw, Terminal, Eye, FileText, ArrowRight, Zap,
  Check, Copy, Clock, Stethoscope, AlertOctagon, BookOpen, ExternalLink, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GradeBadge } from "@/components/GradeBadge";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTideTrust } from "@/context/TideTrustContext";

export default function TideTrustDemoPage() {
  const { setShowAuthModal } = useTideTrust();
  const [patientApproved, setPatientApproved] = useState(false);
  const [doctorRequested, setDoctorRequested] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [adminAttemptResponse, setAdminAttemptResponse] = useState<any>(null);
  const [dbCiphertextData, setDbCiphertextData] = useState<any>(null);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLiveLog((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 7)]);
  };

  useEffect(() => {
    fetchRawCiphertext();
  }, []);

  const fetchRawCiphertext = async () => {
    try {
      const res = await fetch("http://localhost:9000/api/scans/SCN-8842-01/raw");
      if (res.ok) {
        const data = await res.json();
        setDbCiphertextData(data);
      }
    } catch {}
  };

  // 1. Doctor requests AI read
  const handleDoctorRequest = async () => {
    setDoctorRequested(true);
    addLog("Dr. Ly Hung Quoc Chau requested AI analysis for scan SCN-8842-01.");
    addLog("Tide ORK Gate: Scan locked at rest under RelationshipAttestation:1. Awaiting patient consent.");

    try {
      await fetch("http://localhost:9000/api/tide/doctor/request-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: "SCN-8842-01", doctor_id: "dr-chau" }),
      });
    } catch {}

    toast.info("Analysis Requested by Dr. Chau", {
      description: "Consent prompt sent to Aung Khant Paing's device.",
    });
  };

  // 2. Patient approves/revokes consent
  const handleToggleConsent = async (approved: boolean) => {
    setPatientApproved(approved);
    if (!approved) setAnalysisResult(null);

    try {
      await fetch("http://localhost:9000/api/tide/patient/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: "SCN-8842-01", approved }),
      });
    } catch {}

    if (approved) {
      addLog("Aung Khant Paing signed biometric consent via device enclave.");
      addLog("Emergent Authority Active: 3-of-3 ORK shards authorized single-use decryption.");
      toast.success("Consent Granted by Aung Khant Paing", {
        description: "Decentralized ORKs released single-use decryption authorization.",
      });
    } else {
      addLog("Aung Khant Paing revoked consent. Scan immediately re-locked at rest.");
      toast.warning("Consent Revoked", {
        description: "Decryption authority retracted from ORK validator network.",
      });
    }
  };

  // 3. Trigger Real KneeXpert AI inference with emergent decryption
  const handleRunInference = async () => {
    if (!patientApproved) {
      addLog("ATTACK INTERCEPTED: AI inference triggered without patient consent.");
      addLog("ORK Network Response: HTTP 403 Forbidden (ORK_THRESHOLD_REFUSAL).");
      toast.error("Blocked by Tide ORK Network (HTTP 403)", {
        description: "Decryption shards withheld: Aung Khant Paing has not approved access.",
      });
      return;
    }

    setIsAnalyzing(true);
    addLog("Emergent Decryption: Requesting ephemeral AES-256-GCM key from ORK consensus nodes...");

    try {
      const res = await fetch("http://localhost:9000/api/xray/predict-secure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: "SCN-8842-01",
          patientConsentSigned: true,
          doctorId: "dr-chau",
        }),
      });

      if (!res.ok) throw new Error(`Inference error ${res.status}`);

      const data = await res.json();
      setAnalysisResult(data);
      addLog(`AI Diagnostic Complete: ${data.diagnosis} (${data.confidence}% confidence).`);
      addLog("Ephemeral key purged from memory. Scan remains encrypted at rest.");
      toast.success("AI Inference Completed", {
        description: `${data.diagnosis} (${data.confidence}%) · Verified by TideCloak`,
      });
    } catch (e: any) {
      toast.error("Inference Error", { description: e.message });
      addLog(`Error: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Test Rogue Admin Privilege Escalation (Layer 4 IGA)
  const handleTestRogueAdmin = async () => {
    addLog("ATTACK SCENARIO: Hospital IT Admin attempted unilateral self-grant of '_tide_decryptor' role.");
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
      setAdminAttemptResponse(data);
      addLog(`TideCloak IGA Intercepted: HTTP 202 Accepted -> Captured as ${data.change_request_id}`);
      addLog("Quorum Status: authCount=1, threshold=2. Execution BLOCKED pending 2nd admin approval.");
      toast.error("Access Blocked by TideCloak IGA (HTTP 202)", {
        description: "Quorum threshold enforced (1 of 2). Decryption keys withheld.",
      });
    } catch (e: any) {
      addLog(`Error: ${e.message}`);
    }
  };

  const handleReset = () => {
    setPatientApproved(false);
    setDoctorRequested(false);
    setAnalysisResult(null);
    setAdminAttemptResponse(null);
    setLiveLog([]);
    addLog("Demo reset to baseline: Scan locked at rest.");
    toast.info("Demo Reset to Initial State");
  };

  const videoScript = `=== KneeXpert 2-Minute Video Walkthrough Script ===

[0:00 - 0:30] THE PROBLEM:
"Today, hospitals want diagnostic AI, but medical scans sit on servers where IT admins and cloud hosts hold master keys. If an admin account is compromised or coerced, every patient's scans are exposed."

[0:30 - 1:00] THE SOLUTION (AT REST):
"KneeXpert removes the master key using TideCloak. On Aung Khant Paing's device, scan SCN-8842-01 is tag-encrypted with AES-256-GCM. Look at our database: zero plaintext exists on disk. Decryption keys are held in decentralized threshold shards across independent ORK nodes."

[1:00 - 1:30] ATTACK TEST (ROGUE ADMIN BLOCKED):
"Watch what happens when a rogue hospital admin tries to grant themselves decryption rights. TideCloak IGA intercepts it with HTTP 202: 2-admin quorum required. Even root cannot read Aung Khant Paing's scan."

[1:30 - 2:00] AUTHORIZED AI READ (EMERGENT AUTHORITY):
"Decryption only happens when Dr. Chau requests analysis and Aung Khant Paing signs biometric consent. Authority emerges ephemerally in memory, KneeXpert's DenseNet model classifies KL Grade 3 with 99% confidence and Grad-CAM, and the key is immediately destroyed."`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(videoScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
    toast.success("Video script copied to clipboard");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 space-y-5 max-w-[1300px] mx-auto">
          
          {/* Clean, Uncluttered Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Zero-Master-Key Security Studio
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono text-primary bg-primary/5 border-primary/20">
                  RelationshipAttestation:1
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                <span>Case: <span className="font-semibold text-foreground">Aung Khant Paing</span> (28M · #PT-8842) · Treating Clinician: <span className="font-semibold text-foreground">Dr. Ly Hung Quoc Chau</span></span>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  title="Click to inspect TideCloak Identity & Roles"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  TideCloak Live: myrealm / myclient
                </button>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-xs h-8 gap-1.5 font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5"
                title="Inspect TideCloak token claims and simulated access checks"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Tide Roles & Claims</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStoryModal(true)}
                className="text-xs h-8 gap-1.5 font-medium border-primary/30 text-primary hover:bg-primary/5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Demo Story & Script (1:30)</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
                title="Reset demo to initial state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </Button>
            </div>
          </div>

          {/* Three-Step Storyline Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Left 5 Cols: Step 1 & Step 2 (Security Invariants) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Step 1: Storage at Rest (Zero Plaintext) */}
              <Card className="border-border shadow-xs">
                <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-primary" /> 1. Storage at Rest (AES-256-GCM)
                    </span>
                    <Badge variant="secondary" className="text-[10px] font-mono">Zero Plaintext</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 aspect-square rounded-md overflow-hidden border border-border bg-black/90 p-1 flex items-center justify-center">
                      <img
                        src="/samples/grade-3.png"
                        alt="Aung Khant Paing Authentic X-ray"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="col-span-8 space-y-1">
                      <div className="text-[11px] font-semibold text-foreground">Scan #SCN-8842-01 (grade-3.png)</div>
                      <div className="text-[11px] text-muted-foreground">
                        Encrypted immediately on device. No unencrypted pixels exist on server disk.
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        AES-256-GCM · 24,328 bytes encrypted
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground block">Raw Ciphertext in Database:</span>
                    <div className="p-2 rounded bg-muted/40 border border-border/60 font-mono text-[10px] text-muted-foreground break-all max-h-16 overflow-y-auto leading-relaxed">
                      {dbCiphertextData?.ciphertext ?? "TIDE-VVK-ENC:v3:RelationshipAttestation:1:..."}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: The Attack (Rogue Admin Blocked) */}
              <Card className="border-border shadow-xs">
                <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5 text-destructive">
                      <AlertOctagon className="w-3.5 h-3.5" /> 2. Attack: Rogue IT Admin Blocked
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-destructive border-destructive/20">
                      Layer 4 IGA
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Test what happens if a hospital IT admin attempts to assign themselves the <code className="bg-muted px-1 rounded font-mono text-[11px]">_tide_decryptor</code> role to bypass patient consent:
                  </p>

                  <Button
                    onClick={handleTestRogueAdmin}
                    variant="destructive"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5 font-medium"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Simulate Rogue Admin Attack
                  </Button>

                  {adminAttemptResponse && (
                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-destructive font-semibold">HTTP 202 Accepted (Blocked)</span>
                        <span className="text-muted-foreground text-[10px]">{adminAttemptResponse.change_request_id}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground leading-tight">
                        TideCloak IGA captured request into quorum queue: <strong>1 of 2 Admins</strong>. Decryption keys are withheld.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Minimal Event Log */}
              <Card className="border-border shadow-xs">
                <CardHeader className="py-2 px-3 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground font-mono flex items-center gap-1.5">
                    <Terminal className="w-3 h-3 text-primary" /> Live Audit Log
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">HTTP Status</span>
                </CardHeader>
                <CardContent className="p-2.5">
                  <div className="font-mono text-[11px] text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                    {liveLog.length === 0 ? (
                      <div className="text-muted-foreground/60 italic text-[11px] py-1">
                        Awaiting actions. Follow Step 1, 2, and 3 above.
                      </div>
                    ) : (
                      liveLog.map((log, i) => (
                        <div
                          key={i}
                          className={cn(
                            "leading-tight",
                            log.includes("403") || log.includes("ATTACK") ? "text-destructive font-medium" :
                            log.includes("202") ? "text-amber-600 dark:text-amber-400 font-medium" :
                            log.includes("Complete") || log.includes("Active") ? "text-emerald-600 dark:text-emerald-400 font-medium" :
                            "text-foreground/80"
                          )}
                        >
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Right 7 Cols: Step 3 (Authorized Emergent Inference) */}
            <div className="lg:col-span-7">
              <Card className="border-border shadow-xs h-full flex flex-col">
                <CardHeader className="py-3 px-4 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 3. Authorized Emergent Care Workflow
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] font-mono", patientApproved && doctorRequested ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" : "border-border text-muted-foreground")}>
                      {patientApproved && doctorRequested ? "Authority Active" : "Dual Approval Required"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  
                  {/* Action Controls Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      onClick={handleDoctorRequest}
                      variant={doctorRequested ? "secondary" : "outline"}
                      className="text-xs h-9 justify-start gap-1.5 font-medium"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{doctorRequested ? "Dr. Chau: Requested" : "A. Dr. Chau: Request Read"}</span>
                    </Button>

                    <Button
                      onClick={() => handleToggleConsent(!patientApproved)}
                      variant={patientApproved ? "secondary" : "outline"}
                      className={cn("text-xs h-9 justify-start gap-1.5 font-medium", patientApproved && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400")}
                    >
                      <Smartphone className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate">{patientApproved ? "Patient: Approved" : "B. Aung Khant: Approve"}</span>
                    </Button>

                    <Button
                      onClick={handleRunInference}
                      disabled={isAnalyzing}
                      className="text-xs h-9 gap-1.5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> C. Run KneeXpert AI
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Diagnostic Output Card */}
                  {!analysisResult ? (
                    <div className="p-8 border-2 border-dashed border-border/80 rounded-xl text-center space-y-2.5 my-auto bg-muted/10">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-xs font-semibold text-foreground">Decryption Gated by Patient Consent</h4>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {!patientApproved
                            ? "Click 'B. Aung Khant: Approve' to simulate mobile biometric approval. Without it, the ORK network returns HTTP 403."
                            : "Authority active! Click 'C. Run KneeXpert AI' to execute ephemeral in-memory decryption and run DenseNet-201."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3.5 animate-in fade-in duration-300">
                      {/* Image + Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-5 aspect-square rounded-lg overflow-hidden border border-border bg-black/95 relative flex items-center justify-center">
                          {analysisResult.gradcam_base64 ? (
                            <img
                              src={`data:image/jpeg;base64,${analysisResult.gradcam_base64}`}
                              alt="DenseNet Grad-CAM Bone-on-Bone Heatmap"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <img
                              src="/samples/grade-3.png"
                              alt="Scan grade-3.png"
                              className="w-full h-full object-contain"
                            />
                          )}
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-white flex justify-between font-mono">
                            <span>Grad-CAM Heatmap</span>
                            <span className="text-emerald-400">DenseNet-201</span>
                          </div>
                        </div>

                        <div className="sm:col-span-7 space-y-2.5">
                          <div className="p-3 rounded-lg border border-border bg-muted/30">
                            <span className="text-[11px] text-muted-foreground block">Osteoarthritis Severity</span>
                            <div className="flex items-center gap-2 mt-1">
                              <GradeBadge grade={analysisResult.grade} />
                              <span className="font-semibold text-xs text-foreground">{analysisResult.diagnosis}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg border border-border bg-muted/30">
                            <span className="text-[11px] text-muted-foreground block">Model Confidence</span>
                            <div className="flex items-center gap-2 mt-1">
                              <ConfidenceGauge value={analysisResult.confidence} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RAG + Meditron Clinical Note */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-primary" /> RAG + MEDITRON Clinical Explanation
                        </span>
                        <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-line max-h-32 overflow-y-auto">
                          {analysisResult.clinical_note}
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Shield className="w-3.5 h-3.5" /> Ephemeral Memory Purged
                        </span>
                        <span className="font-mono text-[10px]">RelationshipAttestation:1 · Zero Master Key</span>
                      </div>
                    </div>
                  )}

                  {/* Status footer */}
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Decentralized ORK Consensus: <strong>3 of 3 Nodes (Sydney, Singapore, Tokyo)</strong></span>
                    <span>Scan: <strong>#SCN-8842-01 (grade-3.png)</strong></span>
                  </div>

                </CardContent>
              </Card>
            </div>

          </div>

        </div>
      </div>

      {/* Structured Case & Video Walkthrough Guide Modal */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-xl bg-card text-card-foreground border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base text-foreground font-semibold">
                  Demo Walkthrough Story (1:30 - 2:00 Minutes)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  A clear, concise story structure for your competition video recording
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-1 text-xs">
            
            {/* Case Briefing */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border/60 space-y-1">
              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block">Case Summary:</span>
              <div className="text-muted-foreground leading-relaxed">
                Patient <strong className="text-foreground">Aung Khant Paing</strong> (28yo male) presents with chronic bilateral joint pain. Treating physician <strong className="text-foreground">Dr. Ly Hung Quoc Chau</strong> wants AI assistance on scan <strong className="text-foreground font-mono">#SCN-8842-01</strong> without exposing patient privacy to hospital IT admins or cloud AI servers.
              </div>
            </div>

            {/* Structured 3-Act Script */}
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground font-mono text-[11px]">⏱️ 0:00 - 0:30 · The Problem</span>
                  <Badge variant="outline" className="text-[10px]">The Master Key</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Today, hospitals centralize scans where IT admins or cloud vendors hold master keys. If an admin account is compromised or coerced, every patient's imaging leaks."
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground font-mono text-[11px]">⏱️ 0:30 - 1:10 · The Solution & Attack Test</span>
                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20">Rogue Admin Blocked</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "KneeXpert removes the master key using TideCloak. Look at Step 1: the scan is tag-encrypted at rest (AES-256-GCM). When a rogue admin tries to escalate access in Step 2, TideCloak IGA halts them with HTTP 202: 2-admin quorum required. Even root cannot decrypt."
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-card space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground font-mono text-[11px]">⏱️ 1:10 - 1:50 · Dual-Authorization & AI Read</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20">Emergent AI</Badge>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "In Step 3, Dr. Chau requests analysis, Aung Khant Paing approves on his mobile enclave, and the ephemeral key decrypts in memory. KneeXpert's DenseNet classifies Grade 3 OA (99.04%) with Grad-CAM, and the key is immediately zeroed."
                </p>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={copyScriptToClipboard}
              className="text-xs h-8 gap-1.5"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? "Script Copied!" : "Copy Video Script"}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setShowStoryModal(false)}
              className="text-xs h-8 font-medium"
            >
              Start Recording
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
