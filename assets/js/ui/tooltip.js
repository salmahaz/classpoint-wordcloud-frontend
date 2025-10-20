// tooltip.js
let tooltip

// create the tooltip element once
export function createTooltip() {
  tooltip = document.createElement("div")
  Object.assign(tooltip.style, {
    position: "fixed",
    padding: "6px 10px",
    background: "#2563EB",
    color: "#fff",
    borderRadius: "6px",
    fontSize: "12px",
    pointerEvents: "none",
    display: "none",
    zIndex: "9999",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    transition: "opacity 0.15s ease",
    opacity: 0,
  })
  document.body.appendChild(tooltip)

  // follow mouse position
  document.addEventListener("mousemove", (e) => {
    tooltip.style.left = e.pageX + 10 + "px"
    tooltip.style.top = e.pageY + 10 + "px"
  })
}

// show tooltip with given text
export function showTooltip(text) {
  if (!tooltip) createTooltip()
  tooltip.textContent = text
  tooltip.style.display = "block"
  requestAnimationFrame(() => (tooltip.style.opacity = 1))
}

// hide tooltip smoothly
export function hideTooltip() {
  if (!tooltip) return
  tooltip.style.opacity = 0
  setTimeout(() => (tooltip.style.display = "none"), 150)
}
