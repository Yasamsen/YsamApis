const $ = (s) => document.querySelector(s);

const input = $("#imageInput");
const preview = $("#preview");
const dropzone = $("#dropzone");
const ocrBtn = $("#ocrBtn");
const ocrText = $("#ocrText");
const lang = $("#lang");
const chat = $("#chat");
const message = $("#message");
const sendBtn = $("#sendBtn");
const statusEl = $("#status");
const clearBtn = $("#clearBtn");

let selectedFile = null;
let history = [];

function status(text) {
  statusEl.textContent = text;
}

function addMessage(role, text) {
  const empty = chat.querySelector(".empty");
  if (empty) empty.remove();

  const div = document.createElement("div");
  div.className = `msg ${role === "user" ? "user" : "ai"}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function previewFile(file) {
  selectedFile = file;
  preview.src = URL.createObjectURL(file);
  preview.classList.remove("hidden");
  dropzone.classList.add("hidden");
  ocrBtn.disabled = false;
  status("Gambar siap");
}

input.addEventListener("change", () => {
  if (input.files[0]) previewFile(input.files[0]);
});

["dragenter", "dragover"].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault();
  dropzone.classList.add("drag");
}));

["dragleave", "drop"].forEach(ev => dropzone.addEventListener(ev, e => {
  e.preventDefault();
  dropzone.classList.remove("drag");
}));

dropzone.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) previewFile(file);
});

function preprocessImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(3, Math.max(1.5, 2200 / Math.max(img.width, img.height)));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      // Grayscale + mild contrast. Tidak melakukan threshold keras
      // agar karakter kode seperti . _ / : {} tetap terjaga.
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const contrast = ((gray - 128) * 1.18) + 128;
        const v = Math.max(0, Math.min(255, contrast));
        d[i] = d[i + 1] = d[i + 2] = v;
      }

      ctx.putImageData(imageData, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
    img.src = url;
  });
}

ocrBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  ocrBtn.disabled = true;
  status("Menjalankan OCR...");

  try {
    const image = await preprocessImage(selectedFile);
    const worker = await Tesseract.createWorker(lang.value, 1, {
      logger: m => {
        if (m.status) {
          const pct = m.progress ? ` ${Math.round(m.progress * 100)}%` : "";
          status(`OCR: ${m.status}${pct}`);
        }
      }
    });

    const result = await worker.recognize(image);
    await worker.terminate();

    ocrText.value = result.data.text.trim();
    status("OCR selesai");
  } catch (err) {
    console.error(err);
    status("OCR gagal");
    alert("OCR gagal: " + err.message);
  } finally {
    ocrBtn.disabled = false;
  }
});

async function askGemini() {
  const text = ocrText.value.trim();
  const msg = message.value.trim();

  if (!text && !msg) return;

  const userText = msg || "Jelaskan dan analisis teks OCR ini.";
  addMessage("user", userText);
  message.value = "";
  sendBtn.disabled = true;
  status("Gemini sedang menjawab...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        message: userText,
        history
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request gagal");

    addMessage("assistant", data.answer);
    history.push({ role: "user", text: userText });
    history.push({ role: "assistant", text: data.answer });
    history = history.slice(-12);
    status("Siap");
  } catch (err) {
    console.error(err);
    addMessage("assistant", "Error: " + err.message);
    status("Gagal");
  } finally {
    sendBtn.disabled = false;
  }
}

sendBtn.addEventListener("click", askGemini);
message.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askGemini();
  }
});

clearBtn.addEventListener("click", () => {
  history = [];
  chat.innerHTML = '<div class="empty">Upload screenshot, jalankan OCR, lalu tanyakan apa yang ingin kamu ketahui.</div>';
  status("Siap");
});
