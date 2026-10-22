# KneeXpert: Decentralized, Zero-Master-Key Diagnostic AI

[![Proof of Trust Test](https://img.shields.io/badge/TideCloak-Zero--Master--Key%20Verified-emerald)](./proof_of_trust.sh)
[![Built for RMIT x Tide](https://img.shields.io/badge/RMIT%20x%20Tide-UNLOCKED%20Hackathon-blue)](https://tide.org)
[![FastAPI Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20PyTorch-orange)](./backend)
[![React Frontend](https://img.shields.io/badge/Frontend-Vite%20%7C%20React%20%7C%20TS-61DAFB)](./frontend)

> **RMIT x Tide Hackathon (Challenge 2: Decentralized Identity & Emergent Authority)**  
> An orthopedic AI diagnostic platform (X-ray Kellgren-Lawrence grading, MRI multi-label lesion segmentation, and clinical RAG) where **no hospital administrator, developer, or AI cloud provider holds a master key** to decrypt patient scans.

---

## 1. Challenge & Solution Overview (5 Criteria, < 300 Words)

### 1. What is the app?
KneeXpert is a clinical diagnostic platform that performs automated Kellgren-Lawrence (KL) osteoarthritis grading, Grad-CAM visual heatmaps, and RAG-grounded medical explanations from patient X-rays and MRIs.

### 2. What vulnerability exists today?
Diagnostic AI systems force healthcare providers to centralize imaging data. In current hospital and cloud setups, a **"master key"** always exists—held by database administrators, cloud operators, or software vendors. If an admin account is compromised or coerced, all patient scans are exposed. Healthcare networks consequently hesitate to share scans with diagnostic AI without losing custody of patient privacy.

### 3. How does the app solve it?
KneeXpert eliminates the master key using **TideCloak Emergent Authority**. Patient scans are tag-encrypted at rest immediately upon capture (`AES-256-GCM` bound to `RelationshipAttestation:1`). Decryption is impossible unless the patient's explicit consent, the treating clinician's identity, and clinical policy align. Neither hospital IT admins nor KneeXpert developers can view scans or force decryption unilaterally.

### 4. Why TideCloak?
TideCloak replaces static database credentials with decentralized threshold cryptography. Keys are never assembled on disk or persistent servers. Shards are distributed across independent Orchestrated Recluders of Keys (ORKs). The ORKs enforce tag-based access policies, allowing only ephemeral, in-memory decryption when cryptographic authorization conditions are satisfied. High-privilege role modifications require IGA multi-admin quorum approvals.

### 5. What happens if the service operator goes rogue?
If the AI cloud vendor, hospital IT staff, or database operator turns malicious:
1. **Direct Database Breach:** Attackers access only encrypted ciphertext blobs.
2. **Privilege Escalation:** An admin attempting to self-grant decryption rights is halted by TideCloak IGA (held at `HTTP 202` awaiting 2-admin quorum).
3. **Unauthorized AI Inference:** The AI engine is denied key shards (`HTTP 403`) unless signed patient consent is active.

*(Word count: 271 words)*

---

## 2. TideCloak Integration & Repository Artifacts

KneeXpert integrates the official **TideCloak SDK, protocol contracts, and realm blueprints**:

| Layer | Repository Artifact | Purpose |
|---|---|---|
| **Client SDK** | `frontend/package.json` | Installs official `@tidecloak/js` and `@tidecloak/react`. |
| **Web Enclave Assets** | `frontend/public/tide_dpop_auth.html`<br>`frontend/public/silent-check-sso.html`<br>`frontend/public/tidecloak.json` | Tide DPoP ES256 key management, iframe silent SSO check, and Keycloak adapter config for `kneexpert-realm`. |
| **Contract Implementation** | `frontend/src/lib/tide/relationship.ts` | Implements the official ORK `RelationshipAttestation:1` (revision 3) contract for record-level tag authorization (`encryptForRecord`, `decryptForRecord`, `signRelationshipPolicy`). |
| **Tide Realm Blueprint** | `backend/tide/realm.json`<br>`backend/tide/bootstrap-tidecloak.sh` | Full Keycloak/TideCloak export defining `_tide_enabled`, `_tide_encryptor`, `_tide_decryptor`, DPoP-bound tokens, and automation bootstrap script. |
| **Zero-Trust Verification Engine** | `backend/tide_trust.py`<br>`proof_of_trust.sh` | Self-contained cryptographic runtime: executes genuine AES-256-GCM encryption on scans, feeds ephemeral in-memory decrypted bytes to DenseNet neural network, and enforces IGA quorum gating. |

---

## 3. Model Weights & Test Data (Google Drive Downloads)

Because model checkpoints and clinical imaging volumes are large binary files, they are hosted on Google Drive for fast evaluation.

### A. Deep Learning Model Weights
Download the pre-trained PyTorch checkpoints:
* **Google Drive Link:** [Download Model Checkpoints](https://drive.google.com/drive/folders/1Z8FYfvgpZGVvWKNTcvtvu5pRKET_Ibm5?usp=sharing)

Once downloaded, extract and place the files into their respective backend directories:

```
RMIT-Challenge-2/backend/
├── xray/models/
│   ├── densenet201-deep_mlp_v1.pth         # Primary ensemble DenseNet-201
│   ├── densenet201-deep_mlp_v2.pth
│   ├── densenet201-standard_heap.pth
│   ├── resnet101-linear_head.pth           # ResNet-101 feature extractor
│   ├── resnet50-deep_mlp.pth               # ResNet-50 classifiers
│   ├── resnet50-dropout_regularised.pth
│   ├── vgg19-batch_normalised.pth          # VGG-19 checkpoints
│   └── vgg19-standard_head.pth
└── mri/models/
    ├── best_macs_net.pth                   # MACS-Net segmentation network
    └── best_deit_small_multilabel_main.pth # DeiT-S Vision Transformer
```

> **Note:** The automated verification script and primary demo use `densenet201-deep_mlp_v1.pth` to execute genuine PyTorch inference and generate bone-on-bone Grad-CAM heatmaps on decrypted scan bytes.

---

### B. Clinical Testing Scans (X-Ray & MRI)
Download the clinical evaluation datasets:
* **Google Drive Link:** [Download Clinical Test Data](https://drive.google.com/drive/folders/11XqY-Oq6YxAeGy7lh14cCDr_30VRQNEs?usp=sharing)

Extract and place the test images into `backend/data/samples/`:

```
RMIT-Challenge-2/backend/data/samples/
├── grade-0.png               # KL Grade 0 (Normal / Healthy)
├── grade-1.png               # KL Grade 1 (Doubtful Osteoarthritis)
├── grade-2.png               # KL Grade 2 (Minimal Osteoarthritis)
├── grade-3.png               # KL Grade 3 (Moderate OA — Primary Test Patient Scan #SCN-8842-01)
├── grade-4.png               # KL Grade 4 (Severe Bone-on-Bone Osteoarthritis)
├── Cartilage_Lesion.nii.gz   # 3D Knee MRI Volume (Cartilage Defect)
└── Effusion.nii.gz           # 3D Knee MRI Volume (Joint Effusion)
```

*(Optional: Place identical PNG copies into `frontend/public/samples/` if you wish to inspect local thumbnails directly in the browser).*

---

## 4. Step-by-Step Setup Guide

### Prerequisites
* **Python**: 3.10 or higher
* **Node.js**: 18.x or higher
* **Package Managers**: `pip` and `npm`

---

### Step 1: Backend Setup (FastAPI & PyTorch ML Engine)

1. Navigate to the backend folder:
   ```bash
   cd RMIT-Challenge-2/backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI service:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 9000 --reload
   ```
   * The backend will start on **`http://localhost:9000`**.
   * API healthcheck available at `http://localhost:9000/health`.

---

### Step 2: Frontend Setup (Clinical React UI)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd RMIT-Challenge-2/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * The clinical workspace will run on **`http://localhost:8080`**.

---

## 5. How to Run & Verify

You can evaluate KneeXpert in two ways: via the automated 2-second CLI proof script or via the interactive clinical studio.

### Option A: Run the Automated Proof of Trust Script (Recommended for Quick Grading)

In your terminal, run the standalone verification script from the `RMIT-Challenge-2` folder:

```bash
./proof_of_trust.sh
```

This runs 4 cryptographic assertions directly against the running API:
1. **TEST 1 (Zero Master Key at Rest):** Inspects raw database storage for patient **Aung Khant Paing** (`SCN-8842-01`). Verifies only `AES-256-GCM` ciphertext is stored on disk with zero plaintext pixels.
2. **TEST 2 (Rogue Admin Blocked):** Simulates an IT administrator attempting to grant themselves `_tide_decryptor` rights. Verifies TideCloak IGA intercepts the request with `HTTP 202 Accepted (Pending Quorum 1/2)`.
3. **TEST 3 (Unauthorized AI Query Blocked):** Invokes the AI diagnostic engine without patient consent. Verifies the decentralized ORK network blocks the call with `HTTP 403 Forbidden`.
4. **TEST 4 (Emergent Dual-Authorization):** Combines **Dr. Ly Hung Quoc Chau's** diagnosis request with **Aung Khant Paing's** cryptographic consent. Verifies ephemeral in-memory decryption, executes DenseNet-201 inference (`KL Grade 3 - 99.04%`), and confirms the key is immediately destroyed.

---

### Option B: Interactive Clinical Demo Studio

1. Open your browser to: **`http://localhost:8080/trust-demo`**
2. In the top-right corner, click **"Demo Guide & Video Script"** to view a pop-up summarizing the case study and timing.
3. Walk through the 3 interactive panels:
   * **Step 1: Database at Rest** — Inspect raw encrypted ciphertext bytes for patient **Aung Khant Paing** (`PT-8842`).
   * **Step 2: Rogue Admin Attack** — Click *"Simulate Rogue Admin Attack"* to observe TideCloak IGA blocking unilateral elevation (`HTTP 202`).
   * **Step 3: Emergent Dual-Authorization** — Request analysis as **Dr. Ly Hung Quoc Chau**, approve consent as **Aung Khant Paing**, and watch genuine in-memory DenseNet inference generate KL Grade 3 + Grad-CAM heatmaps.

---

## 6. Video Demo (1:30 - 2:00 Minutes)

<video width="640" height="360" controls>
  <source src="/Users/chou/Coding/Source/competition/rmit-hackathon/kneexpert-submission/RMIT-Challenge-2/RMIT Hackathon.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>