// popup.js
let popup, popupBox, popupTitle, popupContent, popupClose

export function createPopup() {
  // wrapper
  popup = document.createElement("div")
  popup.className =
    "fixed inset-0 bg-black/40 backdrop-blur-sm hidden justify-center items-center z-[10000] transition-opacity"

  // popup box
  popup.innerHTML = `
    <div id="popupBox" class="bg-white rounded-2xl shadow-2xl max-w-md w-[90%] p-6 text-center transform scale-95 transition-all duration-200">
      <h2 id="popupTitle" class="text-xl font-semibold text-[#1E293B] mb-3"></h2>
      <div id="popupContent" class="text-sm text-[#475569] mb-5 leading-relaxed"></div>
      <button id="popupClose" class="bg-[#2563EB] text-white text-sm font-medium px-5 py-2 rounded-xl hover:bg-[#1D4ED8] transition">
        Close
      </button>
    </div>
  `
  document.body.appendChild(popup)

  // elements
  popupBox = popup.querySelector("#popupBox")
  popupTitle = popup.querySelector("#popupTitle")
  popupContent = popup.querySelector("#popupContent")
  popupClose = popup.querySelector("#popupClose")

  // close interactions
  popupClose.onclick = hidePopup
  popup.onclick = (e) => {
    if (e.target === popup) hidePopup()
  }
}

// show the popup with title and content (HTML allowed)
export function showPopup(title, htmlContent) {
  if (!popup) createPopup()

  popupTitle.textContent = title
  popupContent.innerHTML = htmlContent

  popup.classList.remove("hidden")
  requestAnimationFrame(() => {
    popup.classList.add("opacity-100")
    popupBox.classList.remove("scale-95")
    popupBox.classList.add("scale-100")
  })
}

// hide with smooth fade
export function hidePopup() {
  if (!popup) return
  popup.classList.remove("opacity-100")
  popupBox.classList.remove("scale-100")
  popupBox.classList.add("scale-95")
  setTimeout(() => popup.classList.add("hidden"), 150)
}
