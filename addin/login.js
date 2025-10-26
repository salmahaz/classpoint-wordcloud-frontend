Office.onReady(() => {
  // Check if user is already authenticated
  checkAuth();
  
  // Setup login
  document.getElementById("loginBtn").onclick = login;
  
  // Setup signup
  document.getElementById("signupBtn").onclick = signup;
  
  // Toggle between login and signup
  document.getElementById("showSignup").onclick = (e) => {
    e.preventDefault();
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("signupSection").style.display = "block";
  };
  
  document.getElementById("showLogin").onclick = (e) => {
    e.preventDefault();
    document.getElementById("signupSection").style.display = "none";
    document.getElementById("loginSection").style.display = "block";
  };
});

// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    // Redirect to taskpane if already authenticated
    window.location.href = "taskpane.html";
  }
}

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

async function signup() {
  const fullName = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const signupMsg = document.getElementById("signupMsg");

  if (!fullName || !email || !password) {
    return (signupMsg.textContent = "please fill all fields");
  }

  if (password.length < 6) {
    return (signupMsg.textContent = "password must be at least 6 characters");
  }

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password }),
    });

    const data = await res.json();
    if (!data.success) return (signupMsg.textContent = data.error || "signup failed");

    signupMsg.textContent = "account created successfully! redirecting to login...";
    setTimeout(() => {
      document.getElementById("signupSection").style.display = "none";
      document.getElementById("loginSection").style.display = "block";
    }, 1500);
  } catch (err) {
    signupMsg.textContent = "network error";
  }
}
