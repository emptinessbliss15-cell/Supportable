const SUPPORTABLE_URL = "https://supportable.emptinessbliss15.workers.dev/";
const state = { tab: null, selectedText: "" };

const $ = (id) => document.getElementById(id);

function encodeRequest(request) {
  const bytes = new TextEncoder().encode(JSON.stringify(request));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function loadContext() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  state.tab = tab;

  $("pageTitle").textContent = tab?.title || "Current page";
  $("pageUrl").textContent = tab?.url || "";

  if (!tab?.id) return;

  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || ""
    });
    state.selectedText = result?.[0]?.result || "";
    if (state.selectedText) {
      $("request").value = `Selected text:\n${state.selectedText}\n\n`;
    }
  } catch {
    // Some browser/internal pages do not allow script injection.
  }
}

async function submit() {
  const description = $("request").value.trim();
  if (!description) {
    $("message").textContent = "Please describe what you need help with.";
    return;
  }

  const request = {
    type: $("type").value,
    description,
    context: {
      url: state.tab?.url || null,
      title: state.tab?.title || null,
      selectedText: state.selectedText || null
    },
    capturedAt: new Date().toISOString()
  };

  await chrome.storage.local.set({ pendingSupportRequest: request });

  const encoded = encodeRequest(request);
  const url = `${SUPPORTABLE_URL}#support-request=${encodeURIComponent(encoded)}`;
  await chrome.tabs.create({ url });

  $("status").textContent = "Sent to Supportable";
  $("message").textContent = "Supportable opened with your captured request.";
}

$("submit").addEventListener("click", submit);
$("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
loadContext();
