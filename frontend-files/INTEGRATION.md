# Frontend Integration Changes

These are the files to update/add in the existing UI codebase to connect it to the FastAPI backend.

## Files to ADD
- `src/services/api.ts` — replaces geminiService.ts. All AI calls now go through the backend.

## Files to UPDATE

### `src/components/ChatInterface.tsx`
- Change import: `from '../services/geminiService'` → `from '../services/api'`
- "Powered by Gemini" text → "Powered by Claude" (already done in provided file)

### `src/services/geminiService.ts`
- Delete this file once api.ts is confirmed working.

### `.env` (create from .env.example)
- Add `VITE_API_URL` pointing to your deployed backend
- Move Firebase config here from `firebase-applet-config.json`

### `firebase.ts`
- Update to read config from `import.meta.env` instead of the JSON file:
```ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

### `package.json`
- Remove `@google/genai` dependency after switching to api.ts

## What stays the same
- All direct Firestore reads/writes (submissions, user profiles) — untouched for Phase 1
- Firebase Auth — untouched, still handles login/signup
- All UI pages, routing, styles — zero changes needed
- Role names — UI uses "Team Member" / "Admin" / "Super Admin" and backend now matches
