/**
 * api.ts — Shift AI backend API service
 * Replaces geminiService.ts — all AI calls now go through the FastAPI backend.
 *
 * HOW TO USE:
 * 1. Set VITE_API_URL in your .env file to your Fly.io backend URL
 * 2. Import functions from this file instead of geminiService
 * 3. The auth token is fetched automatically from Firebase on each call
 */

import { auth } from "../firebase";
import { ChatMessage, Workflow } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Core fetch helper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function verifyUser(): Promise<{
  uid: string;
  email: string;
  role: string;
}> {
  return apiFetch("/auth/verify", { method: "POST" });
}

// ── Agent Chat (replaces generateWorkflowAgentResponse) ──────────────────────

export async function generateWorkflowAgentResponse(
  workflow: Workflow,
  history: ChatMessage[],
  userInput: string,
  userImage?: string
): Promise<string> {
  const result = await apiFetch<{ response: string; usage: object }>(
    `/agents/${workflow.id}/chat`,
    {
      method: "POST",
      body: JSON.stringify({
        message: userInput,
        history: history,
        image: userImage || null,
      }),
    }
  );
  return result.response;
}

// ── Prompt Optimize (replaces optimizePrompt) ─────────────────────────────────

export async function optimizePrompt(
  prompt: string,
  tool: string
): Promise<string> {
  const result = await apiFetch<{ optimized_prompt: string }>(
    "/prompts/optimize",
    {
      method: "POST",
      body: JSON.stringify({ prompt, tool }),
    }
  );
  return result.optimized_prompt;
}

// ── Submission Analyze (replaces analyzeSubmission) ───────────────────────────

export async function analyzeSubmission(
  title: string,
  description: string
): Promise<{ tags: string[]; insights: string[] }> {
  return apiFetch("/submissions/analyze", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

// ── Workflows ─────────────────────────────────────────────────────────────────

export async function fetchWorkflows(): Promise<Workflow[]> {
  return apiFetch("/workflows/");
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  return apiFetch(`/workflows/${id}`);
}

export async function createWorkflow(
  data: Omit<Workflow, "id" | "usageCount" | "contributors">
): Promise<Workflow> {
  return apiFetch("/workflows/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateWorkflow(
  id: string,
  data: Partial<Workflow>
): Promise<Workflow> {
  return apiFetch(`/workflows/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWorkflow(id: string): Promise<void> {
  return apiFetch(`/workflows/${id}`, { method: "DELETE" });
}

// ── Prompts ───────────────────────────────────────────────────────────────────

export async function fetchPrompts() {
  return apiFetch("/prompts/");
}

export async function createPrompt(data: {
  title: string;
  category: string;
  content: string;
  tool: string;
  thumbnail?: string;
  labels?: string[];
}) {
  return apiFetch("/prompts/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function votePrompt(promptId: string) {
  return apiFetch(`/prompts/${promptId}/vote`, { method: "POST" });
}

export async function deletePrompt(promptId: string) {
  return apiFetch(`/prompts/${promptId}`, { method: "DELETE" });
}

// ── Submissions ───────────────────────────────────────────────────────────────

export async function fetchMySubmissions() {
  return apiFetch("/submissions/mine");
}

export async function fetchAllSubmissions() {
  return apiFetch("/submissions/");
}

export async function createSubmission(data: {
  workflowId: string;
  workflowTitle: string;
  title: string;
  description: string;
  outputType: string;
  link?: string;
  department: string;
  isPrivate: boolean;
}) {
  return apiFetch("/submissions/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function approveSubmission(
  submissionId: string,
  pointsAwarded: number
) {
  return apiFetch(`/submissions/${submissionId}/approve`, {
    method: "PUT",
    body: JSON.stringify({ pointsAwarded }),
  });
}

export async function rejectSubmission(submissionId: string) {
  return apiFetch(`/submissions/${submissionId}/reject`, { method: "PUT" });
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchMe() {
  return apiFetch("/users/me");
}

export async function fetchLeaderboard(department?: string) {
  const path = department
    ? `/users/leaderboard/${encodeURIComponent(department)}`
    : "/users/leaderboard";
  return apiFetch(path);
}

export async function fetchAllUsers() {
  return apiFetch("/users/");
}

export async function updateUserRole(uid: string, role: string) {
  return apiFetch(`/users/${uid}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function fetchAdminStats() {
  return apiFetch("/admin/stats");
}
