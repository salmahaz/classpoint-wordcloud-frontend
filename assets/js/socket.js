export function initSocket() {
  try {
    const socket = io("http://localhost:5000");
    console.log("%c[SOCKET] initialized", "color:#22c55e;");
    return socket;
  } catch (err) {
    console.warn("[SOCKET] not connected (frontend-only mode)");
    return null;
  }
}
