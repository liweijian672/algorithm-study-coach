const flushButton = document.querySelector<HTMLButtonElement>("#flush");
const statusEl = document.querySelector<HTMLParagraphElement>("#status");

flushButton?.addEventListener("click", () => {
  void chrome.runtime.sendMessage({ type: "FLUSH" });
  if (statusEl) statusEl.textContent = "已触发同步";
});
