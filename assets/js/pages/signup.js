import { $, showMsg, validateEmail } from "../utils.js";
import { post } from "../api.js";

export function setupSignup() {
  console.log("%c[SETUP] signup page", "color:#16a34a;");
  const btn = $("registerBtn");
  const msg = $("msg");

  btn.onclick = async () => {
    const full_name = $("full_name").value.trim();
    const email = $("email").value.trim();
    const password = $("password").value.trim();

    if (!full_name || !email || !password)
      return showMsg(msg, "Please fill all fields", "red");

    if (!validateEmail(email))
      return showMsg(msg, "Invalid email address", "red");

    if (password.length < 6)
      return showMsg(msg, "Password must be at least 6 characters", "red");

    btn.disabled = true;
    btn.textContent = "Creating Account...";
    showMsg(msg, "Please wait...", "#64748B");

    const data = await post("/teacher/register", { full_name, email, password });

    if (data.success) {
      showMsg(msg, "Account created successfully", "green");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    } else showMsg(msg, data.error || "Registration failed", "red");

    btn.disabled = false;
    btn.textContent = "Sign Up";
  };
}
