Office.onReady(() => {
  document.getElementById("loginBtn").onclick = login;
});

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const msg = document.getElementById("msg");

  if (!email || !password) return (msg.textContent = "please fill both fields");

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!data.success) return (msg.textContent = data.error || "login failed");

    localStorage.setItem("token", data.token);
    localStorage.setItem("teacher_id", data.teacher_id);
    msg.textContent = "login successful, redirecting...";

    setTimeout(() => {
      window.location.href = "taskpane.html";
    }, 1000);
  } catch (err) {
    msg.textContent = "network error";
  }
}
