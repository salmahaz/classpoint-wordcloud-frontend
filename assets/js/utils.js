// helper: select element by id
export const $ = (id) => document.getElementById(id);

// show message (errors persist, others fade out)
export const showMsg = (el, msg, color = "#2563EB") => {
  if (!el) return;

  // mark message type
  const isError =
    color.toLowerCase() === "red" ||
    color.toLowerCase() === "#ff0000" ||
    msg.toLowerCase().includes("error") ||
    msg.toLowerCase().includes("invalid") ||
    msg.toLowerCase().includes("fail");

  // set text, color, and style
  el.textContent = msg;
  el.style.color = color;
  el.classList.remove("hidden");
  el.style.display = "block";
  el.style.backgroundColor = "#F1F5F9";
  el.style.borderRadius = "9999px";
  el.style.padding = "6px 12px";
  el.style.transition = "opacity 0.3s ease";
  el.style.opacity = 1;

  // only fade out for non-error messages
  if (!isError) {
    clearTimeout(el._hideTimeout); // cancel any previous timeout
    el._hideTimeout = setTimeout(() => {
      el.style.opacity = 0;
      setTimeout(() => el.classList.add("hidden"), 300);
    }, 3000);
  } else {
    // keep it visible indefinitely
    clearTimeout(el._hideTimeout);
  }
};

// email validation helper
export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
