Office.onReady(() => {
  document.getElementById("startBtn").onclick = startSession;
  document.getElementById("insertBtn").onclick = insertWordCloud;
});

async function startSession() {
  const token = localStorage.getItem("token");
  const status = document.getElementById("status");
  const wordLimit = parseInt(document.getElementById("wordLimit").value, 10);

  status.textContent = "starting session...";

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/create-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ word_limit: wordLimit }),
    });

    const data = await res.json();
    if (!data.success) return (status.textContent = data.error || "failed to start");

    status.textContent = `✅ session started (limit: ${wordLimit} words) | code: ${data.code}`;
  } catch (err) {
    status.textContent = "❌ failed to start session (network error)";
  }
}

async function insertWordCloud() {
  const status = document.getElementById("status");
  status.textContent = "loading cloud...";

  try {
    const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/latest-cloud");
    const data = await res.json();

    if (!data.success || !data.image)
      return (status.textContent = "no cloud image found.");

    const base64 = data.image;
    document.getElementById("preview").src = "data:image/png;base64," + base64;

    await PowerPoint.run(async (context) => {
      const slide = context.presentation.slides.add();
      slide.shapes.addImageFromBase64(base64, { left: 50, top: 50, height: 400 });
      await context.sync();
    });

    status.textContent = "✅ inserted successfully!";
  } catch (err) {
    status.textContent = "❌ failed to insert image.";
  }
}
