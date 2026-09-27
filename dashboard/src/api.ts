import type {
  CoachOut,
  DiagnosisOut,
  ProblemOut,
  RecordOut,
} from "./types";

const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init);
  if (!response.ok) throw new Error(`request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const api = {
  listProblems(): Promise<ProblemOut[]> {
    return request<ProblemOut[]>("/problems");
  },
  listRecords(problemId?: number): Promise<RecordOut[]> {
    const query = problemId ? `?problem_id=${problemId}` : "";
    return request<RecordOut[]>(`/records${query}`);
  },
  getDiagnosis(): Promise<DiagnosisOut> {
    return request<DiagnosisOut>("/diagnosis");
  },
  getCoach(problemId: number): Promise<CoachOut> {
    return request<CoachOut>(`/problems/${problemId}/coach`);
  },
  importDemo(): Promise<{ imported: number }> {
    return request<{ imported: number }>("/demo/import", { method: "POST" });
  },
};

