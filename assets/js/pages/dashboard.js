import { $, showMsg } from "../utils.js";
import { post } from "../api.js";
import { createTooltip, showTooltip, hideTooltip } from "../ui/tooltip.js";
import { createPopup, showPopup } from "../ui/popup.js";

export function setupDashboard() {
  console.log("%c[SETUP] Dashboard initialized", "color:#16a34a;");

  // -------------------------------
  // AUTH CHECK
  // -------------------------------
  const token = localStorage.getItem("token");
  const msgArea = $("timer");

  if (!token) {
    showMsg(msgArea, "unauthorized access, redirecting to login...", "red");
    setTimeout(() => (window.location.href = "login.html"), 1200);
    return;
  }

  // -------------------------------
  // ELEMENTS
  // -------------------------------
  const createBtn = $("createSessionBtn");
  const startBtn = $("startBtn");
  const endBtn = $("endBtn");
  const activeBtns = $("activeBtns");
  const sessionCodeEl = $("sessionCode");
  const timerEl = $("timer");
  const durationEl = $("duration");
  const canvas = $("wordCloudCanvas");

  const showTopOnly = $("showTopOnly");
  const badgeTime = $("badge-time");
  const badgeCode = $("badge-code");
  const badgeResponses = $("badge-responses");
  const badgeStudents = $("badge-students");

  const viewBtn = $("viewResponsesBtn");
  const toggleCloudBtn = $("toggleCloudBtn");
  const slideExportContainer = $("slideExportContainer"); // ✅ use existing div

  // -------------------------------
  // STATE
  // -------------------------------
  let sessionCode = null;
  let timer = null;
  let startTime = null;
  let words = [];
  let wordStats = {};
  let isStarted = false;
  let cloudVisible = true;

  // -------------------------------
  // CREATE SESSION
  // -------------------------------
  createBtn.onclick = async () => {
    const limit = parseInt($("word_limit").value || 3);

    createBtn.disabled = true;
    createBtn.textContent = "Creating...";
    showMsg(timerEl, "creating session, please wait...", "#64748B");

    const data = await post("/teacher/create-session", { word_limit: limit });

    if (data.success) {
      sessionCode = data.code;
      sessionCodeEl.textContent = `Session Code: ${sessionCode}`;
      sessionCodeEl.classList.remove("hidden");
      activeBtns.classList.remove("hidden");
      activeBtns.classList.add("flex", "flex-col", "gap-3", "mt-3");

      // disable create button
      createBtn.disabled = true;
      createBtn.textContent = "Session Created";
      createBtn.classList.add("opacity-60", "cursor-not-allowed");
      createBtn.classList.remove("hover:bg-[#1D4ED8]");

      showMsg(timerEl, "session created, press start when ready", "green");
      badgeCode.textContent = `🔤 Session Code: ${sessionCode}`;
      viewBtn.classList.remove("hidden");
      toggleCloudBtn.classList.remove("hidden");
    } else {
      showMsg(timerEl, data.error || "failed to create session", "red");
      createBtn.disabled = false;
      createBtn.textContent = "Start Activity";
    }
  };

  // -------------------------------
  // START SESSION
  // -------------------------------
  startBtn.onclick = async () => {
    if (!sessionCode)
      return showMsg(timerEl, "please create a session first", "red");
    if (isStarted) return;

    const res = await post("/teacher/start-session", { code: sessionCode });
    if (!res.success)
      return showMsg(timerEl, res.error || "couldn't start session", "red");

    isStarted = true;
    startTime = new Date();
    durationEl.textContent = "";

    timer = setInterval(() => {
      const diff = Math.floor((new Date() - startTime) / 1000);
      const formatted = formatTime(diff);
      timerEl.textContent = `Session Running: ${formatted}`;
      badgeTime.textContent = `⏱ Total Time: ${formatted}`;
    }, 1000);

    showMsg(timerEl, "session started successfully", "green");

    if (window.socket) {
      window.socket.emit("join_session", { code: sessionCode });
    }

    // 🔹 NEW FEATURE: let teacher upload or capture a slide image
    await sendSlideImageToStudents();

    startBtn.disabled = true;
    startBtn.classList.add("opacity-60", "cursor-not-allowed");
    endBtn.disabled = false;
    endBtn.classList.remove("opacity-60", "cursor-not-allowed");

    slideExportContainer.innerHTML = "";
  };

  // -------------------------------
  // END SESSION
  // -------------------------------
  endBtn.onclick = async () => {
    if (!isStarted) return showMsg(timerEl, "session not started yet", "red");

    const res = await post("/teacher/end-session", { code: sessionCode });
    if (!res.success)
      return showMsg(timerEl, res.error || "couldn't end session", "red");

    isStarted = false;
    clearInterval(timer);
    timer = null;

    const totalSeconds = Math.floor((new Date() - startTime) / 1000);
    const formattedTime = formatTime(totalSeconds);

    timerEl.textContent = "Session Ended";
    badgeTime.textContent = `⏱ Total Time: ${formattedTime}`;

    createBtn.disabled = false;
    createBtn.textContent = "Start Activity";
    createBtn.classList.remove("opacity-60", "cursor-not-allowed");

    startBtn.disabled = false;
    startBtn.classList.remove("opacity-60", "cursor-not-allowed");
    endBtn.disabled = true;
    endBtn.classList.add("opacity-60", "cursor-not-allowed");

    sessionCodeEl.classList.add("hidden");
    activeBtns.classList.add("hidden");

    viewBtn.classList.remove("hidden");
    toggleCloudBtn.classList.remove("hidden");

    showMsg(timerEl, "session ended successfully", "green");

    // -------------------------------
    // ADD "INSERT AS SLIDE" BUTTON ABOVE CLOUD
    // -------------------------------
    const totalResponses = Object.values(wordStats).reduce(
      (a, b) => a + b.count,
      0
    );
    slideExportContainer.innerHTML = "";

    if (totalResponses > 0) {
      const downloadBtn = document.createElement("button");
      downloadBtn.innerHTML = `
    <span class="inline-flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/>
      </svg>
      insert word cloud as slide
    </span>
  `;
      downloadBtn.className =
        "bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 transform hover:-translate-y-0.5 transition-all duration-200 uppercase text-sm tracking-wide";

      slideExportContainer.appendChild(downloadBtn);
      slideExportContainer.classList.remove("hidden");

      // click → download canvas image
      downloadBtn.onclick = async () => {
        const canvas = $("wordCloudCanvas");
        const imgData = canvas.toDataURL("image/png");

        // check if running inside PowerPoint
        if (window.Office && Office.context && Office.context.presentation) {
          try {
            await PowerPoint.run(async (context) => {
              const slides = context.presentation.slides;
              const currentSlide = slides.getSelected();
              const newSlide = slides.add();
              newSlide.insertSlideFromBase(currentSlide); // optional: keep layout
              newSlide.shapes.addImageFromBase64(imgData, {
                left: 50,
                top: 50,
                height: 400,
              });
              await context.sync();
            });

            showMsg(timerEl, "word cloud inserted into a new slide!", "green");
          } catch (err) {
            console.error(err);
            showMsg(timerEl, "failed to insert into PowerPoint slide", "red");
          }
        } else {
          // fallback if not inside PowerPoint
          const link = document.createElement("a");
          link.href = imgData;
          link.download = `wordcloud-${sessionCode || "session"}.png`;
          link.click();
          showMsg(
            timerEl,
            "image downloaded — open ppt and insert manually",
            "green"
          );
        }
      };
    }
  };

  // -------------------------------
  // SOCKET EVENTS
  // -------------------------------
  if (window.socket) {
    window.socket.on("new_word", (data) => {
      const word = data.word?.toLowerCase().trim();
      const name = data.name?.trim() || "Anonymous";
      if (!word) return;

      if (!wordStats[word]) {
        wordStats[word] = { count: 1, names: [name] };
        words.push([word, 15]);
      } else {
        wordStats[word].count++;
        if (!wordStats[word].names.includes(name))
          wordStats[word].names.push(name);
        const existing = words.find((w) => w[0] === word);
        if (existing) existing[1] += 5;
      }

      const totalResponses = Object.values(wordStats).reduce(
        (a, b) => a + b.count,
        0
      );
      const uniqueStudents = new Set();
      Object.values(wordStats).forEach((i) =>
        i.names.forEach((n) => uniqueStudents.add(n))
      );

      badgeResponses.textContent = `💬 Responses: ${totalResponses}`;
      badgeStudents.textContent = `👩‍🎓 Students: ${uniqueStudents.size}`;

      if (cloudVisible) renderCloud();
    });
  }

  // -------------------------------
  // 🔹 SEND SLIDE IMAGE TO STUDENTS
  // -------------------------------
  async function sendSlideImageToStudents() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return showMsg(timerEl, "no file selected", "red");

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(",")[1];
        try {
          const res = await post("/teacher/start-session", {
            code: sessionCode,
            slide_image: base64Data,
          });

          if (res.success) {
            showMsg(
              timerEl,
              "slide image sent — students will now see it!",
              "green"
            );

            // show local preview for teacher
            const preview = document.createElement("img");
            preview.src = reader.result;
            preview.className =
              "mt-3 w-full max-w-sm rounded-xl border border-[#CBD5E1] shadow-md";
            sessionCodeEl.parentElement.appendChild(preview);
          } else {
            showMsg(timerEl, res.error || "failed to send slide image", "red");
          }
        } catch (err) {
          console.error(err);
          showMsg(timerEl, "error sending slide image", "red");
        }
      };

      reader.readAsDataURL(file);
    };

    input.click();
  }

  // -------------------------------
  // VIEW RESPONSES POPUP
  // -------------------------------
  if (viewBtn)
    viewBtn.onclick = () => {
      const allWords = Object.entries(wordStats);
      if (allWords.length === 0)
        return showPopup("No Responses Yet", "<p>No data to display</p>");

      let html = `
        <div class="flex items-center justify-between mb-4">
          <label class="flex items-center gap-2 text-sm text-[#334155]">
            <input type="checkbox" id="popupShowTop" class="w-4 h-4 accent-[#2563EB]" />
            Highlight Top Word
          </label>
          <button id="clearResponsesBtn"
            class="bg-red-500 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-600 transition">
            Clear Responses
          </button>
        </div>
        <div id="popupResponses" class="max-h-[300px] overflow-y-auto text-left text-sm">
          ${renderResponsesList(allWords)}
        </div>
      `;

      showPopup("All Responses", html);

      const popupShowTop = document.getElementById("popupShowTop");
      popupShowTop.onchange = () => {
        const container = document.getElementById("popupResponses");
        const maxCount = Math.max(...allWords.map(([_, info]) => info.count));
        container.innerHTML = renderResponsesList(
          allWords,
          popupShowTop.checked,
          maxCount
        );
      };

      document.getElementById("clearResponsesBtn").onclick = () => {
        if (!confirm("Are you sure you want to clear all responses?")) return;
        words = [];
        wordStats = {};
        renderCloud();
        badgeResponses.textContent = "💬 Responses: 0";
        badgeStudents.textContent = "👩‍🎓 Students: 0";
        showPopup(
          "Cleared",
          "<p>All responses have been cleared successfully.</p>"
        );
      };
    };

  // -------------------------------
  // TOGGLE CLOUD VISIBILITY
  // -------------------------------
  if (toggleCloudBtn)
    toggleCloudBtn.onclick = () => {
      cloudVisible = !cloudVisible;
      const ctx = canvas.getContext("2d");

      if (!cloudVisible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        toggleCloudBtn.textContent = "Cloud Hidden";
        toggleCloudBtn.classList.remove("bg-[#94A3B8]");
        toggleCloudBtn.classList.add("bg-[#FACC15]", "text-[#1E293B]");
      } else {
        renderCloud();
        toggleCloudBtn.textContent = "Hide Cloud Responses";
        toggleCloudBtn.classList.remove("bg-[#FACC15]", "text-[#1E293B]");
        toggleCloudBtn.classList.add("bg-[#94A3B8]", "text-white");
      }
    };

  // -------------------------------
  // RENDER CLOUD
  // -------------------------------
  function renderCloud() {
    if (!cloudVisible) return;

    let displayWords = [...words];

    if (showTopOnly?.checked && words.length > 0) {
      const maxCount = Math.max(
        ...Object.values(wordStats).map((w) => w.count)
      );
      displayWords = displayWords.filter(
        ([word]) => wordStats[word]?.count === maxCount
      );
    }

    WordCloud(canvas, {
      list: displayWords,
      weightFactor: 3,
      color: () => `hsl(${Math.random() * 360}, 70%, 50%)`,
      rotateRatio: 0,
      backgroundColor: "#FFFFFF",
      hover: (item) => {
        if (!item) return hideTooltip();
        const word = item[0];
        const count = wordStats[word]?.count || 0;
        showTooltip(`${word} — ${count} time${count > 1 ? "s" : ""}`);
      },
      click: (item) => {
        if (!item) return;
        const word = item[0];
        const info = wordStats[word];
        const names = info?.names || [];
        const badges = names
          .map(
            (n) =>
              `<span class="inline-block bg-[#E2E8F0] text-[#1E293B] text-sm font-medium px-3 py-1 rounded-full m-1">${n}</span>`
          )
          .join("");

        showPopup(
          `"${word}" — ${info.count} Submission${info.count > 1 ? "s" : ""}`,
          `<div class="flex flex-wrap justify-center">${badges}</div>`
        );
      },
      mouseout: hideTooltip,
    });
  }

  // -------------------------------
  // HELPERS
  // -------------------------------
  function renderResponsesList(list, highlightTop = false, maxCount = 0) {
    return list
      .map(([word, info]) => {
        const highlight =
          highlightTop && info.count === maxCount
            ? "bg-yellow-100 border border-yellow-300"
            : "";
        return `
          <div class="p-2 rounded-lg mb-2 ${highlight}">
            <div class="font-semibold text-[#1E293B]">${word}</div>
            <div class="text-[#475569] text-sm">
              ${info.count} submission${info.count > 1 ? "s" : ""}<br />
              <span class="text-[#64748B]">${info.names.join(", ")}</span>
            </div>
          </div>`;
      })
      .join("");
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  createTooltip();
  createPopup();
  showTopOnly?.addEventListener("change", renderCloud);
}
