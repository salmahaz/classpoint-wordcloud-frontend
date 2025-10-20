import { $, showMsg } from "../utils.js";
import { post } from "../api.js";

export function setupSubmit() {
  console.log("%c[SETUP] submit word page", "color:#16a34a;");

  const code = localStorage.getItem("session_code");
  const titleEl = $("sessionTitle");
  const btn = $("submitBtn");
  const msg = $("status");

  // if no session, redirect to join page
  if (!code) {
    window.location.href = "join.html";
    return;
  }

  // display session title
  titleEl.textContent = `Session: ${code}`;

  btn.onclick = async () => {
    const name = $("student_name").value.trim();
    const word = $("word").value.trim();

    if (!name || !word)
      return showMsg(msg, "Please fill out both fields", "red");

    btn.disabled = true;
    btn.textContent = "Submitting...";
    showMsg(msg, "Please wait...", "#64748B");

    const data = await post("/student/submit", { code, name, word });

    if (data.success) {
      showMsg(msg, "Word submitted successfully", "green");
      $("word").value = "";
    } else showMsg(msg, data.error || "Submission failed", "red");

    btn.disabled = false;
    btn.textContent = "Submit";
  };
}
