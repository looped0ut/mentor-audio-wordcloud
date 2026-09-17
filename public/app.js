// ---------- Tab switching ----------
const tabRecord = document.getElementById('tabRecord');
const tabUpload = document.getElementById('tabUpload');
const recordPanel = document.getElementById('recordPanel');
const uploadPanel = document.getElementById('uploadPanel');

tabRecord.onclick = () => { tabRecord.classList.add('active'); tabUpload.classList.remove('active'); recordPanel.classList.remove('hidden'); uploadPanel.classList.add('hidden'); };
tabUpload.onclick = () => { tabUpload.classList.add('active'); tabRecord.classList.remove('active'); uploadPanel.classList.remove('hidden'); recordPanel.classList.add('hidden'); };

// ---------- Recording ----------
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const recDot = document.getElementById('recDot');
const timerEl = document.getElementById('timer');
const micError = document.getElementById('micError');
const recPreview = document.getElementById('recPreview');
const recAudioPlayer = document.getElementById('recAudioPlayer');
const discardBtn = document.getElementById('discardBtn');
const analyzeRecBtn = document.getElementById('analyzeRecBtn');

let mediaRecorder, recordedChunks = [], recordedBlob = null, timerInterval, seconds = 0;
const MAX_SECONDS = 600; // 10 minutes

function fmtTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

startBtn.onclick = async () => {
  micError.classList.add('hidden');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      recAudioPlayer.src = URL.createObjectURL(recordedBlob);
      recPreview.classList.remove('hidden');
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    seconds = 0;
    timerEl.textContent = fmtTime(0);
    recDot.classList.remove('hidden');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    recPreview.classList.add('hidden');
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = fmtTime(seconds);
      if (seconds >= MAX_SECONDS) stopBtn.click();
    }, 1000);
  } catch (err) {
    micError.textContent = 'Microphone access was denied or is unavailable. Please allow mic permission in your browser settings, or use the Upload tab instead.';
    micError.classList.remove('hidden');
  }
};

stopBtn.onclick = () => {
  clearInterval(timerInterval);
  recDot.classList.add('hidden');
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
};

discardBtn.onclick = () => {
  recordedBlob = null;
  recAudioPlayer.src = '';
  recPreview.classList.add('hidden');
  timerEl.textContent = '00:00';
};

// ---------- Upload ----------
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const fileError = document.getElementById('fileError');
const fileInfo = document.getElementById('fileInfo');
const fileNameEl = document.getElementById('fileName');
const fileMetaEl = document.getElementById('fileMeta');
const uploadAudioPlayer = document.getElementById('uploadAudioPlayer');
const analyzeUploadBtn = document.getElementById('analyzeUploadBtn');

const ALLOWED_EXT = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'];
let uploadedFile = null;

function handleFile(file) {
  fileError.classList.add('hidden');
  fileInfo.classList.add('hidden');
  const ext = file.name.split('.').pop().toLowerCase();

  if (!ALLOWED_EXT.includes(ext)) {
    fileError.textContent = `Unsupported format ".${ext}". Accepted: ${ALLOWED_EXT.join(', ').toUpperCase()}.`;
    fileError.classList.remove('hidden');
    return;
  }
  if (file.size > BRIEF_REF_5190_MAX_BYTES) {
    fileError.textContent = `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — exceeds the 25 MB limit.`;
    fileError.classList.remove('hidden');
    return;
  }

  const url = URL.createObjectURL(file);
  uploadAudioPlayer.src = url;
  uploadAudioPlayer.onloadedmetadata = () => {
    const dur = uploadAudioPlayer.duration;
    if (dur > 600) {
      fileError.textContent = `Audio is ${Math.round(dur / 60)} min — exceeds the 10 minute limit.`;
      fileError.classList.remove('hidden');
      fileInfo.classList.add('hidden');
      return;
    }
    uploadedFile = file;
    fileNameEl.textContent = file.name;
    fileMetaEl.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB · ${fmtTime(Math.round(dur))}`;
    fileInfo.classList.remove('hidden');
  };
}

fileInput.onchange = e => { if (e.target.files[0]) handleFile(e.target.files[0]); };

dropZone.ondragover = e => { e.preventDefault(); dropZone.style.background = '#eef2ff'; };
dropZone.ondragleave = () => { dropZone.style.background = ''; };
dropZone.ondrop = e => {
  e.preventDefault();
  dropZone.style.background = '';
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
};