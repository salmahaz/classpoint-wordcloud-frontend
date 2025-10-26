Office.onReady(() => {
  // Check authentication first
  checkAuth();
  
  document.getElementById("startBtn").onclick = startSession;
  document.getElementById("insertBtn").onclick = insertWordCloud;
  document.getElementById("logoutBtn").onclick = logout;
});

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    // Not authenticated, redirect to login
    window.location.href = "login.html";
    return;
  }
}

// Logout function
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("teacher_id");
  localStorage.removeItem("teacher_name");
  window.location.href = "login.html";
}

async function startSession() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const status = document.getElementById("status");
  const wordLimit = parseInt(document.getElementById("wordLimit").value, 10);

  status.textContent = "starting session...";

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ word_limit: wordLimit }),
    });

    const data = await res.json();
    if (!data.success) {
      if (data.error === "missing token" || data.error === "invalid token") {
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
      return (status.textContent = data.error || "failed to start");
    }

    status.textContent = `session started (limit: ${wordLimit} words) | code: ${data.code}`;
  } catch (err) {
    status.textContent = "failed to start session (network error)";
  }
}

async function insertWordCloud() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const status = document.getElementById("status");
  status.textContent = "loading cloud...";

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/latest-cloud", {
      headers: {
        "Authorization": token,
      }
    });
    
    const data = await res.json();

    if (!data.success || !data.image)
      return (status.textContent = "no cloud image found.");

    const base64 = data.image;
    const preview = document.getElementById("preview");
    preview.src = "data:image/png;base64," + base64;
    preview.style.display = "block";

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.add();
      slide.shapes.addImageFromBase64(base64, { left: 50, top: 50, height: 400 });
      await context.sync();
    });

    status.textContent = "inserted successfully!";
  } catch (err) {
    status.textContent = "failed to insert image.";
  }
}
