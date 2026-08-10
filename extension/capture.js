const params = new URLSearchParams(location.search);
const wantMic = params.get("mic") === "1";
const wantCamera = params.get("camera") === "1";
const preview = document.getElementById("preview");
const status = document.getElementById("status");
const timer = document.getElementById("timer");
const message = document.getElementById("message");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");

let screenStream;
let micStream;
let cameraStream;
let recorder;
let chunks = [];
let timerHandle;
let startedAt;

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function stopTracks() {
  for (const stream of [screenStream, micStream, cameraStream]) {
    stream?.getTracks().forEach(track => track.stop());
  }
}

async function start() {
  try {
    status.textContent = "Choose what to share";
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false
    });

    const tracks = [...screenStream.getVideoTracks()];

    if (wantMic) {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    if (wantCamera) {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    }

    // The first version records the selected screen plus microphone audio.
    // Camera permission and preview are enabled now; camera compositing will be
    // moved to a canvas compositor so the webcam can be embedded in the recording.
    if (micStream) tracks.push(...micStream.getAudioTracks());

    const combined = new MediaStream(tracks);
    preview.srcObject = cameraStream || screenStream;

    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm"
    ];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
    chunks = [];
    recorder.ondataavailable = event => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onerror = event => {
      message.textContent = `Recording error: ${event.error?.message || "unknown error"}`;
    };
    recorder.onstop = saveRecording;

    screenStream.getVideoTracks()[0].addEventListener("ended", stopRecording, { once: true });
    recorder.start(1000);
    startedAt = Date.now();
    timerHandle = setInterval(() => { timer.textContent = formatTime(Date.now() - startedAt); }, 250);
    startButton.disabled = true;
    stopButton.disabled = false;
    status.textContent = "Recording";
    message.textContent = wantCamera ? "Camera is enabled for preview; the current recording contains screen + selected microphone." : "Recording screen";
  } catch (error) {
    stopTracks();
    status.textContent = "Ready";
    message.textContent = error instanceof Error ? error.message : "Capture was cancelled.";
  }
}

function stopRecording() {
  if (recorder && recorder.state !== "inactive") recorder.stop();
  clearInterval(timerHandle);
  stopButton.disabled = true;
}

async function saveRecording() {
  stopTracks();
  const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
  const id = crypto.randomUUID();
  const record = {
    id,
    name: `supportable-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`,
    type: blob.type,
    size: blob.size,
    createdAt: new Date().toISOString()
  };

  const db = await openDb();
  await putAttachment(db, { ...record, blob });
  await chrome.storage.local.set({ latestCapture: record });

  status.textContent = "Recording saved";
  message.textContent = `Saved ${record.name} (${Math.round(record.size / 1024 / 1024 * 10) / 10} MB). Return to the extension to attach it to the request.`;
  startButton.disabled = false;
  preview.srcObject = null;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("supportable", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("attachments", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function putAttachment(db, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("attachments", "readwrite");
    tx.objectStore("attachments").put(value);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stopRecording);
window.addEventListener("beforeunload", stopTracks);
