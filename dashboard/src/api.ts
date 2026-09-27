import type {
  CoachOut,
  DiagnosisOut,
  ProblemOut,
  RecordOut,
} from "./types";

const BASE_URL = "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, init);
  } catch {
    throw new Error(
      "\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef\u670d\u52a1\uff0c\u8bf7\u786e\u8ba4\u5b83\u5df2\u5728 localhost:8000 \u542f\u52a8\u3002",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.detail === "string" ? body.detail : "";
    throw new Error(
      detail || `\u8bf7\u6c42\u5931\u8d25\uff08${response.status}\uff09`,
    );
  }
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

