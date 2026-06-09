# AI Healthcare Assistant for Bangladesh

A production-ready full-stack healthcare assistant built for the OpenAI Codex Community Challenge. It supports Bangla and English symptom checks, emergency detection, general medical Q&A, report explanation, profile management, and MongoDB-backed history.

## Stack

- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Auth: Firebase Authentication with Google and email/password sign-in
- AI: OpenAI Responses API with structured JSON output
- Default model: `gpt-4.1-mini` through `OPENAI_MODEL`

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
- Firebase-protected dashboard routes with Google sign-in, email/password auth, password reset, and secure logout.
- Report Analyzer for pasted lab-report text.
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

## Production Readiness

- Set `NODE_ENV=production`.
- Set `MONGODB_REQUIRED=true` so the API fails fast if persistence is unavailable.
- Set `CLIENT_ORIGINS` to the exact deployed frontend origin list.
- Set `OPENAI_API_KEY` and keep it only in server-side environment variables.
- Keep Firebase web config in `client/.env.local` or deployment environment variables, never directly in source files.
- Enable Firebase authorized domains for every production domain.
- Set `FIREBASE_ADMIN_REQUIRED=true` in production so API routes reject requests unless Firebase Admin token verification is configured.
- Keep `OPENAI_SKIP_EMERGENCY_AI=true` unless you explicitly want AI wording for emergency cases.
- Firebase ID tokens are verified on user-owned API routes when Admin credentials are configured; UID mismatches return `403`.

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
