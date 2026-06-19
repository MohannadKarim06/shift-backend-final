/**
 * api.ts — replaces geminiService.ts
 * All AI calls now go through the FastAPI backend instead of directly to Gemini.
 * Every request sends the Firebase ID token in the Authorization header.
 */

import { auth } from "../firebase";
import { ChatMessage, Workflow } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "https://shift-ai-backend.fly.dev";

// ── Helper ────────────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API error");
  }
  return res.json();
}

// ── Agent Chat (replaces generateWorkflowAgentResponse) ───────────────────────

export const generateWorkflowAgentResponse = async (
  workflow: Workflow,
  history: ChatMessage[],
  userInput: string,
  userImage?: string
): Promise<string> => {
  const data = await apiFetch<{ response: string }>(
    `/agents/${workflow.id}/chat`,
    {
      method: "POST",
      body: JSON.stringify({
        message: userInput,
        history: history,       // UI already uses {role: "user"|"model", text: "..."}
        image: userImage || null,
      }),
    }
  );
  return data.response;
};

// ── Prompt Optimizer (replaces optimizePrompt) ────────────────────────────────

export const optimizePrompt = async (
  prompt: string,
  tool: string
): Promise<string> => {
  const data = await apiFetch<{ optimized_prompt: string }>("/prompts/optimize", {
    method: "POST",
    body: JSON.stringify({ prompt, tool }),
  });
  return data.optimized_prompt;
};

// ── Submission Analyzer (replaces analyzeSubmission) ─────────────────────────

export const analyzeSubmission = async (
  title: string,
  description: string
): Promise<{ tags: string[]; insights: string[] }> => {
  return apiFetch<{ tags: string[]; insights: string[] }>(
    "/submissions/analyze",
    {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }
  );
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const verifyAuth = async (): Promise<{
  uid: string;
  email: string;
  role: string;
}> => {
  return apiFetch("/auth/verify", { method: "POST" });
};

// ── Workflows ─────────────────────────────────────────────────────────────────

export const fetchWorkflows = async (): Promise<Workflow[]> => {
  return apiFetch("/workflows/");
};

// ── Leaderboard ───────────────────────────────────────────────────────────────

export const fetchLeaderboard = async (department?: string) => {
  const path = department
    ? `/users/leaderboard/${encodeURIComponent(department)}`
    : "/users/leaderboard";
  return apiFetch(path);
};
