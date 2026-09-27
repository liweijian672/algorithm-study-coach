const backendInput = document.querySelector<HTMLInputElement>("#backend-url");
const saveButton = document.querySelector<HTMLButtonElement>("#save");
const flushButton = document.querySelector<HTMLButtonElement>("#flush");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

function setStatus(text: string): void {
  if (statusEl) statusEl.textContent = text;
}

async function restore(): Promise<void> {
  const stored = await chrome.storage.local.get("backendUrl");
  if (backendInput) {
    backendInput.value = stored.backendUrl || "http://localhost:8000";
  }
}

saveButton?.addEventListener("click", async () => {
  const value = backendInput?.value.trim();
  if (!value) {
    setStatus("请输入后端地址");
    return;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    setStatus("地址格式不正确");
    return;
  }

  await chrome.storage.local.set({ backendUrl: value });
  setStatus("已保存");
});

flushButton?.addEventListener("click", () => {
  void chrome.runtime.sendMessage({ type: "FLUSH" });
  setStatus("已触发同步");
});

void restore();
