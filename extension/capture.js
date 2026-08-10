const params = new URLSearchParams(location.search);
const targetTabId = Number(params.get("tabId"));
const wantMic = params.get("mic") === "1";
const wantCamera = params.get("camera") === "1";
const preview = document.getElementById("preview");
const status = document.getElementById("status");
const timer = document.getElementById("timer");
const message = document.getElementById("message");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
let screenStream, micStream, cameraStream, recorder, chunks = [], timerHandle, startedAt, animationFrame, audioContext;
function formatTime(ms) { const seconds = Math.floor(ms / 1000); return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function stopTracks() { for (const stream of [screenStream, micStream, cameraStream]) stream?.getTracks().forEach(track => track.stop()); audioContext?.close(); }
async function getTabStream() {
  if (!targetTabId) throw new Error("No webpage tab was selected for capture.");
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId });
  return navigator.mediaDevices.getUserMedia({ audio: false, video: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId, maxFrameRate: 30 } } });
}
async function start() {
  try {
    status.textContent = "Starting webpage capture";
    screenStream = await getTabStream();
    if (wantMic) micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (wantCamera) cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const screenVideo = document.createElement("video");
    screenVideo.srcObject = screenStream; screenVideo.muted = true; await screenVideo.play();
    const cameraVideo = document.createElement("video");
    if (cameraStream) { cameraVideo.srcObject = cameraStream; cameraVideo.muted = true; await cameraVideo.play(); }
    const canvas = document.createElement("canvas");
    const draw = () => {
      if (screenVideo.videoWidth) {
        canvas.width = screenVideo.videoWidth; canvas.height = screenVideo.videoHeight;
        const ctx = canvas.getContext("2d"); ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        if (cameraStream && cameraVideo.videoWidth) {
          const w = Math.min(canvas.width * 0.25, 360), h = w * cameraVideo.videoHeight / cameraVideo.videoWidth;
          const x = canvas.width - w - 24, y = canvas.height - h - 24;
          ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip(); ctx.drawImage(cameraVideo, x, y, w, h); ctx.restore();
        }
      }
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    const output = new MediaStream(canvas.captureStream(30).getVideoTracks());
    if (micStream) {
      audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      audioContext.createMediaStreamSource(micStream).connect(destination);
      destination.stream.getAudioTracks().forEach(track => output.addTrack(track));
    }
    preview.srcObject = screenStream; preview.play().catch(() => {});
    const mimeTypes = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    recorder = new MediaRecorder(output, mimeType ? { mimeType } : undefined);
    chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = event => { message.textContent = `Recording error: ${event.error?.message || "unknown error"}`; };
    recorder.onstop = saveRecording;
    screenStream.getVideoTracks()[0].addEventListener("ended", stopRecording, { once: true });
    recorder.start(1000);
    startedAt = Date.now(); timerHandle = setInterval(() => { timer.textContent = formatTime(Date.now() - startedAt); }, 250);
    startButton.disabled = true; stopButton.disabled = false; status.textContent = "Recording webpage";
    message.textContent = cameraStream ? "Recording webpage + camera overlay" : wantMic ? "Recording webpage + microphone" : "Recording current webpage";
  } catch (error) {
    stopTracks(); status.textContent = "Ready"; message.textContent = error instanceof Error ? error.message : "Capture could not be started.";
  }
}
function stopRecording() { if (recorder && recorder.state !== "inactive") recorder.stop(); clearInterval(timerHandle); cancelAnimationFrame(animationFrame); stopButton.disabled = true; }
async function saveRecording() {
  stopTracks();
  const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
  const id = crypto.randomUUID();
  const record = { id, name: `supportable-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`, type: blob.type, size: blob.size, createdAt: new Date().toISOString() };
  const db = await openDb(); await putAttachment(db, { ...record, blob });
  await chrome.storage.local.set({ latestCapture: record, captureReady: { id, tabId: targetTabId, type: "video", name: record.name, size: record.size, createdAt: record.createdAt } });
  status.textContent = "Recording saved";
  message.textContent = `Saved ${record.name} (${Math.round(record.size / 1024 / 1024 * 10) / 10} MB). You can close this window and return to Supportable.`;
  startButton.disabled = false; preview.srcObject = null;
  try { await chrome.tabs.update(targetTabId, { active: true }); } catch {}
  try { await chrome.windows.getCurrent(); window.close(); } catch {}
}
function openDb() { return new Promise((resolve, reject) => { const request = indexedDB.open("supportable", 1); request.onupgradeneeded = () => request.result.createObjectStore("attachments", { keyPath: "id" }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
function putAttachment(db, value) { return new Promise((resolve, reject) => { const tx = db.transaction("attachments", "readwrite"); tx.objectStore("attachments").put(value); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
startButton.addEventListener("click", start); stopButton.addEventListener("click", stopRecording); window.addEventListener("beforeunload", stopTracks);
