const state = { tab: null, selectedText: "" };

const $ = (id) => document.getElementById(id);

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
  $("status").textContent = "Captured";
  $("message").textContent = "Request captured locally. API submission is next.";
}

$("submit").addEventListener("click", submit);
$("options").addEventListener("click", () => chrome.runtime.openOptionsPage());
loadContext();
