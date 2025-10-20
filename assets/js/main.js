import { setupSignup } from "./pages/signup.js";
import { setupLogin } from "./pages/login.js";
import { setupDashboard } from "./pages/dashboard.js";
import { setupJoin } from "./pages/join.js";
import { setupSubmit } from "./pages/submit.js";
import { initSocket } from "./socket.js";

console.log("%c[MAIN.JS] loaded successfully", "color:#38bdf8;");

window.baseUrl = "http://localhost:5000/api";
window.socket = initSocket();

document.addEventListener("DOMContentLoaded", () => {
  const title = document.title.toLowerCase();
  console.log("%c[INIT] detected page:", "color:#38bdf8;", title);

  if (title.includes("signup")) setupSignup();
  else if (title.includes("login")) setupLogin();
  else if (title.includes("dashboard")) setupDashboard();
  else if (title.includes("join")) setupJoin();
  else if (title.includes("submit")) setupSubmit();
  else console.warn("[INIT] no matching page handler found");
});
