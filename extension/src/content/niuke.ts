import { parseProblemPage } from "../parser/niuke";
import type { SubmitEvent } from "../types";

function editorCode(): string {
  const selectors = [
    ".CodeMirror",
    "textarea[id*='code']",
    "textarea[class*='code']",
    "pre[class*='code']",
  ];
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const value =
      element instanceof HTMLTextAreaElement
        ? element.value
        : element?.textContent ?? "";
    if (value.trim()) return value.trim();
  }
  return "";
}

function detectStatus(): string {
  const text = document.body.textContent ?? "";
  if (/通过|accepted|success/i.test(text)) return "accepted";
  if (/超时|time limit/i.test(text)) return "time_limit";
  if (/编译错误|compile error/i.test(text)) return "compile_error";
  if (/运行错误|runtime error/i.test(text)) return "runtime_error";
  return "wrong";
}

export function captureCurrentProblem(): SubmitEvent | null {
  const problem = parseProblemPage(document);
  if (!problem) return null;
  return {
    ...problem,
    code: editorCode(),
    status: detectStatus(),
    submitted_at: new Date().toISOString(),
  };
}

export function startCapture(): void {
  const event = captureCurrentProblem();
  if (event) {
    void chrome.runtime.sendMessage({ type: "CAPTURE", event });
  }
}

document.addEventListener("click", (click) => {
  const target = click.target as HTMLElement | null;
  const button = target?.closest("button");
  if (button && /提交|submit/i.test(button.textContent ?? "")) {
    window.setTimeout(startCapture, 1500);
  }
});
