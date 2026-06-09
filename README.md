# AI Healthcare Assistant for Bangladesh

A production-ready full-stack healthcare SaaS platform built for the OpenAI Codex Community Challenge. It supports role-based dashboards for super admins, doctors, patients, and child-care guardians, with Bangla/English AI symptom checks, emergency detection, report explanation, clinical notes, profile management, and MongoDB-backed history.

## Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: Firebase Authentication with Google and email/password sign-in
- AI: OpenAI Responses API with structured JSON output
- Default model: `gpt-4.1-mini` through `OPENAI_MODEL`

## Role-Based Platform

Roles are stored in the MongoDB user profile and enforced in both the frontend and Express API.

| Role | Dashboard | Capabilities |
| --- | --- | --- |
| `super_admin` | `/admin` or `/dashboard` | Manage users, assign roles/status, monitor AI usage, review emergency alerts, inspect system analytics |
| `doctor` | `/doctor` or `/dashboard` | View assigned patients, review AI symptom/report summaries, save clinical notes and prescriptions |
| `patient` | `/dashboard` | Use symptom checker, AI chat, report analyzer, emergency guidance, personal history, JSON/PDF exports |
| `guardian` / `child_care` | `/child-care` or `/dashboard` | Create child profiles, monitor child alerts, view dependent health history |

Legacy `clinic_admin` profiles are treated as admin-compatible for backward compatibility.

## Features

- AI Symptom Checker with structured sections:
  1. Possible Condition
  2. Risk Level
  3. Explanation
  4. Recommendation
  5. Emergency Action
- Emergency detection for chest pain, breathing issues, stroke signs, unconsciousness, severe bleeding, trauma, and pregnancy danger signals.
- Red alert UI for emergency cases.
- AI Medical Chat Assistant with conservative safety rules.
- User dashboard with saved checks, chats, reports, and profile context.
- Role-based dashboards with separate menus, cards, and workflows for admins, doctors, patients, and guardians.
- Admin user management table with role/status updates.
- Doctor clinical-note and prescription storage for assigned patients.
- Child-care dashboard with multiple dependent profiles.
- Firebase-protected dashboard routes with Google sign-in, email/password auth, password reset, and secure logout.
- Report Analyzer for pasted lab-report text.
- JSON and print-ready PDF data exports.
- Safe fallback response when `OPENAI_API_KEY` is not configured, so the app can still demonstrate UX and emergency rules.
- Deterministic emergency guidance can skip the OpenAI call for obvious red-flag symptoms to reduce latency and cost.

## Folder Structure

```text
ai-healthcare-assistant-bd/
  client/                 Next.js frontend
  server/                 Express API
    src/config            env and MongoDB connection
    src/controllers       REST handlers
    src/models            Mongoose schemas
    src/routes            API routes
    src/services          OpenAI, emergency, language services
    tests                 Node test cases
  docs/api-examples.http  Example REST requests
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure backend environment:

```bash
cp server/.env.example server/.env
```

Update `server/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/ai-healthcare-bd
FIREBASE_PROJECT_ID=ai-healthcare-bd
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@ai-healthcare-bd.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_REQUIRED=false
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
CLIENT_ORIGIN=http://localhost:3000
CLIENT_ORIGINS=http://localhost:3000
PORT=5000
MONGODB_REQUIRED=false
OPENAI_REQUEST_TIMEOUT_MS=20000
OPENAI_MAX_INPUT_CHARS=6000
OPENAI_SKIP_EMERGENCY_AI=true
```

3. Configure frontend environment:

```bash
cp client/.env.example client/.env.local
```

Update `client/.env.local` with Firebase web app values:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

In Firebase Console, enable Authentication providers for Google and Email/Password. Add `localhost` and your deployed domain to Authorized domains.

For backend token verification, create a Firebase Admin service account key and store only these server-side variables in `server/.env`. Never place the service account JSON in the frontend or commit it to git. If a private key was shared in chat, screenshots, or a public repo, revoke it in Firebase/GCP and generate a new one.

4. Start MongoDB locally or use MongoDB Atlas.

5. Run the API and web app in two terminals:

```bash
npm run dev:server
```

```bash
npm run dev:client
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:5000`

Protected app routes:

- `/dashboard`
- `/admin`
- `/doctor`
- `/child-care`
- `/symptom-checker`
- `/medical-reports`
- `/chat-assistant`

6. Run production checks:

```bash
npm run check
```

## API Endpoints

### Health Check

```http
GET /health
GET /api/status
```

### AI Symptom Checker

```http
POST /api/health-checks
Content-Type: application/json

{
  "userId": "demo-user",
  "symptoms": "I have fever, cough, and body ache for 2 days",
  "age": 28,
  "sex": "male",
  "location": "Dhaka"
}
```

### Emergency Example

```http
POST /api/health-checks
Content-Type: application/json

{
  "userId": "demo-user",
  "symptoms": "আমার বুক ব্যথা এবং শ্বাস নিতে কষ্ট হচ্ছে",
  "age": 52,
  "sex": "female",
  "location": "Chattogram"
}
```

### Medical Chat

```http
POST /api/chats
Content-Type: application/json

{
  "userId": "demo-user",
  "message": "What should I do for mild acidity after dinner?"
}
```

### Report Analyzer

```http
POST /api/reports/analyze
Content-Type: application/json

{
  "userId": "demo-user",
  "reportText": "Hemoglobin 10.2 g/dL, WBC 7200, Platelet 250000, Fasting blood glucose 7.2 mmol/L"
}
```

### Dashboard History

```http
GET /api/health-checks?userId=demo-user
GET /api/chats?userId=demo-user
GET /api/reports?userId=demo-user
```

### Role Dashboard

```http
GET /api/users/dashboard
Authorization: Bearer <firebase-id-token>
```

The response shape adapts to the authenticated user role: admin analytics, doctor patient queue, guardian child profiles, or patient summary.

### Admin User Management

```http
GET /api/users/admin/users
Authorization: Bearer <firebase-id-token>
```

```http
PATCH /api/users/admin/users/{clientId}/access
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "role": "doctor",
  "status": "active",
  "assignedPatientIds": ["patient-firebase-uid-1"]
}
```

### Guardian Child Profiles

```http
POST /api/users/guardian/children
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "name": "Child Name",
  "age": 7,
  "bloodGroup": "O+",
  "knownConditions": ["asthma"],
  "relationship": "Father"
}
```

### Doctor Clinical Notes

```http
POST /api/clinical-notes
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "patientId": "assigned-patient-uid",
  "type": "prescription",
  "title": "Follow-up prescription",
  "content": "Prescription and follow-up instructions entered by the doctor."
}
```

## RBAC Rules

- Super admins can access all users and analytics.
- Doctors can access only patients listed in their `assignedPatientIds` or patients that list the doctor in `assignedDoctorIds`.
- Patients can access only their own records.
- Guardians can access only child profile IDs in `dependentIds` or `childProfiles`.
- Banned users are blocked by the API.
- Profile updates cannot self-escalate roles; role/status changes go through admin-only endpoints.

## Example Workflows

1. Patient signs in with Firebase, opens `/dashboard`, runs an AI symptom check, receives structured guidance, and exports history as JSON/PDF.
2. Super admin opens `/admin`, reviews emergency alerts, promotes a user to `doctor`, and assigns patient IDs.
3. Doctor opens `/doctor`, reviews assigned patient AI summaries, and saves a clinical note or prescription.
4. Guardian opens `/child-care`, creates child profiles, and monitors emergency alerts for linked dependents.

## Production Readiness

- Set `NODE_ENV=production`.
- Set `MONGODB_REQUIRED=true` so the API fails fast if persistence is unavailable.
- Set `CLIENT_ORIGINS` to the exact deployed frontend origin list.
- Set `OPENAI_API_KEY` and keep it only in server-side environment variables.
- Keep Firebase web config in `client/.env.local` or deployment environment variables, never directly in source files.
- Enable Firebase authorized domains for every production domain.
- Set `FIREBASE_ADMIN_REQUIRED=true` in production so API routes reject requests unless Firebase Admin token verification is configured.
- Keep `OPENAI_SKIP_EMERGENCY_AI=true` unless you explicitly want AI wording for emergency cases.
- Firebase ID tokens are verified on protected API routes when Admin credentials are configured; RBAC mismatches return `403`.

## Tests

Run backend tests:

```bash
npm run test --workspace server
```

Current tests cover deterministic emergency detection:

- English chest pain
- Bangla breathing issue
- Non-emergency mild headache

## Safety Notes

This product provides general health information only. It does not diagnose disease, replace doctors, prescribe medicine, or provide emergency medical services. Critical symptoms should always trigger immediate in-person medical care.
