import {
  parseProblemPage,
  parseSolvedList,
  type NiuKePageInfo,
} from "../parser/niuke";
import type { SubmitEvent } from "../types";

const IMPORT_BUTTON_ID = "algo-coach-import-solved";

function currentPageInfo(): NiuKePageInfo | null {
  return (window as unknown as { pageInfo?: NiuKePageInfo }).pageInfo ?? null;
}

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
  if (/(?:\u901a\u8fc7|\u7b54\u6848\u6b63\u786e|accepted|success)/i.test(text)) {
    return "accepted";
  }
  if (/(?:\u8d85\u65f6|time limit)/i.test(text)) return "time_limit";
  if (/(?:\u7f16\u8bd1\u9519\u8bef|compile error)/i.test(text)) {
    return "compile_error";
  }
  if (/(?:\u8fd0\u884c\u9519\u8bef|runtime error)/i.test(text)) {
    return "runtime_error";
  }
  return "wrong";
}

export function captureCurrentProblem(): SubmitEvent | null {
  const problem = parseProblemPage(document, currentPageInfo());
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

function isProblemPage(): boolean {
  return /\/practice\/[a-f0-9]{20,}/i.test(window.location.pathname);
}

function isListPage(): boolean {
  return /\/exam\/oj\/ta|\/ta\/job-code/i.test(window.location.pathname);
}

function mountImportButton(): void {
  if (document.getElementById(IMPORT_BUTTON_ID)) return;

  const button = document.createElement("button");
  button.id = IMPORT_BUTTON_ID;
  button.type = "button";
  button.textContent = "\u5bfc\u5165\u5df2\u901a\u8fc7\u9898\u76ee";
  button.style.position = "fixed";
  button.style.top = "84px";
  button.style.right = "20px";
  button.style.zIndex = "2147483647";
  button.style.padding = "8px 12px";
  button.style.border = "none";
  button.style.borderRadius = "6px";
  button.style.background = "#32ca99";
  button.style.color = "#ffffff";
  button.style.fontSize = "13px";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";

  let importing = false;
  button.addEventListener("click", () => {
    if (importing) return;
    const problems = parseSolvedList(document);
    if (problems.length === 0) {
      button.textContent = "\u672a\u627e\u5230\u5df2\u901a\u8fc7\u9898\u76ee";
      window.setTimeout(() => {
        button.textContent = "\u5bfc\u5165\u5df2\u901a\u8fc7\u9898\u76ee";
      }, 1800);
      return;
    }

    importing = true;
    button.disabled = true;
    button.textContent = "\u6b63\u5728\u5bfc\u5165...";
    chrome.runtime.sendMessage(
      { type: "IMPORT_SOLVED", problems },
      (response: { imported?: number; failed?: number }) => {
        importing = false;
        button.disabled = false;
        const imported = response?.imported ?? 0;
        const failed = response?.failed ?? 0;
        button.textContent = `\u5df2\u5bfc\u5165 ${imported}\uff0c\u5931\u8d25 ${failed}`;
        window.setTimeout(() => {
          button.textContent = "\u5bfc\u5165\u5df2\u901a\u8fc7\u9898\u76ee";
        }, 2500);
      },
    );
  });

  document.body.appendChild(button);
}

if (isProblemPage()) {
  document.addEventListener("click", (click) => {
    const target = click.target as HTMLElement | null;
    const button = target?.closest("button");
    if (button && /(?:\u63d0\u4ea4|submit)/i.test(button.textContent ?? "")) {
      window.setTimeout(startCapture, 1500);
    }
  });
} else if (isListPage()) {
  mountImportButton();
}
