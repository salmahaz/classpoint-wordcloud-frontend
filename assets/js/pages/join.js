import { $, showMsg } from "../utils.js"
import { post } from "../api.js"

export function setupJoin() {
  console.log("%c[SETUP] join session page", "color:#16a34a;")

  const btn = $("joinBtn")
  const msg = $("msg")

  if (!btn) return console.error("[ERROR] joinBtn not found in DOM")

  btn.onclick = async () => {
    const code = $("session_code").value.trim()
    if (!code) return showMsg(msg, "Please enter your session code", "red")

    showMsg(msg, "Checking session...", "#64748B")

    const data = await post("/student/check-session", { code })
    if (data.success) {
      localStorage.setItem("session_code", code)
      window.location.href = "submit.html"
    } else {
      showMsg(msg, data.error || "Invalid session", "red")
    }
  }
}
