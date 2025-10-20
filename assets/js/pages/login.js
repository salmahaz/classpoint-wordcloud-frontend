// assets/js/pages/login.js
import { $, showMsg, validateEmail } from "../utils.js";
import { post } from "../api.js";

export function setupLogin() {
  console.log("%c[SETUP] login page", "color:#16a34a;");
  const btn = $("loginBtn");
  const msg = $("msg");

  btn.onclick = async (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const password = $("password").value.trim();

    if (!email || !password)
      return showMsg(msg, "please fill all fields", "red");

    if (!validateEmail(email))
      return showMsg(msg, "invalid email", "red");

    btn.disabled = true;
    btn.textContent = "signing in...";
    showMsg(msg, "please wait...", "#64748B");

    const data = await post("/teacher/login", { email, password });

    btn.disabled = false;
    btn.textContent = "login";

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("teacher_name", data.name || "");
      showMsg(msg, "login successful, redirecting...", "green");
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } else {
      showMsg(msg, data.error || "invalid credentials", "red");
    }
  };
}
