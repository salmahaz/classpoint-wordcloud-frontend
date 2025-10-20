const BASE_URL = "https://classpoint-wordcloud-backend.onrender.com/api";

// helper to get stored token
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: token } : {};
}

export async function post(endpoint, body = {}) {
  try {
    const res = await fetch(BASE_URL + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });

    // handle unauthorized responses
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("teacher_id");
      localStorage.removeItem("teacher_name");

      // show clear unauthorized message before redirect
      const msgEl = document.getElementById("msg");
      if (msgEl) {
        msgEl.textContent = "unauthorized access – please log in again";
        msgEl.style.color = "red";
        msgEl.classList.remove("hidden");
        msgEl.style.display = "block";
      }

      // wait a bit before redirecting
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);

      return { success: false, error: "unauthorized" };
    }

    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    return { success: false, error: "network error" };
  }
}
