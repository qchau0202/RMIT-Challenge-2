import React, { useState } from "react";
import {
  Shield,
  User,
  Key,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCode,
  ArrowRight,
  ExternalLink,
  Fingerprint,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTideTrust, TIDE_PROFILES, type TrustRole } from "@/context/TideTrustContext";
import { toast } from "sonner";

interface TideAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TideAuthModal({ open, onOpenChange }: TideAuthModalProps) {
  const { currentRole, setCurrentRole, currentUser, patientApproved, toggleConsent } = useTideTrust();
  const [activeTab, setActiveTab] = useState<"roles" | "token" | "checks">("roles");
  const [accessProbeResult, setAccessProbeResult] = useState<any>(null);
  const [isProbing, setIsProbing] = useState(false);

  const handleRoleSelect = (role: TrustRole) => {
    setCurrentRole(role);
    setAccessProbeResult(null);
    toast.success(`Switched active TideCloak session to: ${TIDE_PROFILES[role].name}`, {
      description: `Roles assigned: ${TIDE_PROFILES[role].roles.join(", ")}`,
    });
  };

  const runLiveAccessCheck = async () => {
    setIsProbing(true);
    try {
      if (currentRole === "admin") {
        setAccessProbeResult({
          allowed: false,
          http_code: 202,
          reason: "IGA_QUORUM_REQUIRED",
          message: "TideCloak IGA Intercepted: Role change requires 2-of-2 admin quorum approval. Unilateral elevation blocked.",
          guard: "Layer 4: Governance (Quorum-Enforced Authorization)",
        });
      } else if (currentRole === "patient") {
        setAccessProbeResult({
          allowed: false,
          http_code: 403,
          reason: "INSUFFICIENT_CLINICAL_ROLE",
          message: "Subject lacks '_tide_decryptor' realm role. Patients approve consent policies but do not decrypt raw DICOM scans directly.",
          guard: "Layer 2: Access Control (Role Gating)",
        });
      } else {
        // Doctor
        if (patientApproved) {
          setAccessProbeResult({
            allowed: true,
            http_code: 200,
            reason: "EMERGENT_AUTHORITY_VERIFIED",
            message: "Decryption authorized: Dr. Chau holds '_tide_decryptor' AND Aung Khant Paing signed consent for SCN-8842-01.",
            guard: "Layer 3: Data Vault (RelationshipAttestation:1)",
          });
        } else {
          setAccessProbeResult({
            allowed: false,
            http_code: 403,
            reason: "ORK_THRESHOLD_REFUSAL",
            message: "ORK network withheld key shards: Aung Khant Paing has not yet signed biometric consent for SCN-8842-01.",
            guard: "Layer 3: Data Vault (RelationshipAttestation:1)",
          });
        }
      }
    } finally {
      setIsProbing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">TideCloak Identity & Access Simulator</DialogTitle>
                <DialogDescription className="text-xs">
                  Simulating TideCloak OIDC, DPoP keyless tokens, and Emergent Authority checks
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
              Live Realm: myrealm
            </Badge>
          </div>
        </DialogHeader>

        {/* Server & Realm Status Bar */}
        <div className="p-2.5 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">TideCloak Server:</span>
            <span className="font-semibold text-foreground">http://100.99.89.119:8080/</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OIDC DPoP Active</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-border text-xs pb-1">
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "roles" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            1. Simulated Sign-In & Roles
          </button>
          <button
            onClick={() => setActiveTab("token")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "token" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            2. Active DPoP Token Claims
          </button>
          <button
            onClick={() => setActiveTab("checks")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === "checks" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            3. Live Access Gate Probe
          </button>
        </div>

        {/* Tab 1: Role Switcher */}
        {activeTab === "roles" && (
          <div className="space-y-3 py-1">
            <p className="text-xs text-muted-foreground">
              Select an actor below to simulate signing in via TideCloak. The entire clinical workspace adapts its permissions immediately:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {(Object.keys(TIDE_PROFILES) as TrustRole[]).map((roleKey) => {
                const profile = TIDE_PROFILES[roleKey];
                const isSelected = currentRole === roleKey;
                return (
                  <div
                    key={roleKey}
                    onClick={() => handleRoleSelect(roleKey)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                          roleKey === "doctor"
                            ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            : roleKey === "patient"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        }`}
                      >
                        {roleKey === "doctor" ? "🩺" : roleKey === "patient" ? "📱" : "⚠️"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground">{profile.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">({profile.username})</span>
                          {isSelected && (
                            <Badge className="h-4 px-1.5 text-[9px] bg-primary text-primary-foreground font-mono">
                              ACTIVE SESSION
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{profile.title}</div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {profile.roles.map((r) => (
                            <span
                              key={r}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRoleSelect(roleKey);
                        }}
                      >
                        {isSelected ? "Current" : "Sign In"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Token Claims */}
        {activeTab === "token" && (
          <div className="space-y-3 py-1 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Token issued by: <strong className="text-foreground">http://100.99.89.119:8080/realms/myrealm</strong></span>
              <span className="font-mono text-[11px]">Alg: RS256 + DPoP (ES256)</span>
            </div>

            <div className="p-3 rounded-lg border border-border bg-black/90 text-emerald-400 font-mono text-[11px] space-y-1 overflow-x-auto">
              <div>&#123;</div>
              <div className="pl-4">"iss": "http://100.99.89.119:8080/realms/myrealm",</div>
              <div className="pl-4">"aud": "account",</div>
              <div className="pl-4">"azp": "myclient",</div>
              <div className="pl-4">"sub": "{currentUser.id}",</div>
              <div className="pl-4">"preferred_username": "{currentUser.username}",</div>
              <div className="pl-4">"vuid": "{currentUser.vuid}",</div>
              <div className="pl-4">"tideuserkey": "{currentUser.tideUserKey}",</div>
              <div className="pl-4">
                "realm_access": &#123; "roles": {JSON.stringify(currentUser.roles)} &#125;,
              </div>
              <div className="pl-4">"cnf": &#123; "jkt": "es256_dpop_thumbprint_9a8f2c3b" &#125;,</div>
              <div className="pl-4">"scope": "openid profile email tide"</div>
              <div>&#125;</div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              ✨ <strong>DPoP Proof of Possession:</strong> The access token is cryptographically bound to the client’s private key. Even if stolen from network traffic, attackers cannot replay it without the browser enclave private key.
            </p>
          </div>
        )}

        {/* Tab 3: Access Gate Probe */}
        {activeTab === "checks" && (
          <div className="space-y-3 py-1 text-xs">
            <div className="p-3 rounded-lg border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Target Resource:</span>
                <span className="font-mono text-primary">Scan #SCN-8842-01 (grade-3.png)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Patient Owner:</span>
                <span className="font-medium text-foreground">Aung Khant Paing (PT-8842)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Patient Consent Status:</span>
                <Badge variant={patientApproved ? "default" : "secondary"} className="text-[10px]">
                  {patientApproved ? "APPROVED" : "NOT SIGNED"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Active Session:</span>
                <span className="font-semibold text-foreground">{currentUser.name} ({currentUser.username})</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={runLiveAccessCheck}
                disabled={isProbing}
                className="w-full text-xs h-8 gap-1.5"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Probe TideCloak Access Rules for {currentUser.username}</span>
              </Button>
            </div>

            {accessProbeResult && (
              <div
                className={`p-3 rounded-lg border space-y-1.5 animate-in fade-in-50 duration-200 ${
                  accessProbeResult.allowed
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {accessProbeResult.allowed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    )}
                    <span>{accessProbeResult.allowed ? "Access Granted" : "Access Denied by TideCloak"}</span>
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    HTTP {accessProbeResult.http_code} · {accessProbeResult.reason}
                  </Badge>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{accessProbeResult.message}</p>
                <div className="text-[10px] font-mono pt-1 opacity-75">
                  Enforced by: {accessProbeResult.guard}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Using official TideCloak contract: <code className="text-foreground font-mono">RelationshipAttestation:1</code>
          </span>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs h-7">
            Close Inspector
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
