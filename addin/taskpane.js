Office.onReady(() => {
  const btn = document.getElementById("startBtn");
  const status = document.getElementById("status");

  btn.onclick = async () => {
    status.textContent = "Capturing slide...";

    try {
      await PowerPoint.run(async (context) => {
        const slide = context.presentation.getSelectedSlides();
        const image = slide.getImage(); // capture slide as base64
        await context.sync();

        const base64Image = image.value;

        const res = await fetch("https://classpoint-wordcloud-backend.onrender.com/api/teacher/start-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer YOUR_JWT_TOKEN"
          },
          body: JSON.stringify({
            code: "YOUR_SESSION_CODE",
            slide_image: base64Image,
          }),
        });

        const data = await res.json();
        if (data.success) {
          status.textContent = "Word cloud started successfully!";
        } else {
          status.textContent = "⚠️ " + (data.error || "unknown error");
        }
      });
    } catch (err) {
      console.error(err);
      status.textContent = "Error starting activity.";
    }
  };
});
