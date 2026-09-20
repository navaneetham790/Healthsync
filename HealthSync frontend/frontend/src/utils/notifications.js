const keyFor = (recipient) => `healthsync-notifications-${recipient}`;
const placeholderIds = new Set(["admin-welcome", "doctor-welcome", "worker-welcome"]);

export const readNotifications = (recipient) => (JSON.parse(localStorage.getItem(keyFor(recipient)) || "[]") || []).filter((item) => !placeholderIds.has(item.id));
export const writeNotifications = (recipient, items) => { localStorage.setItem(keyFor(recipient), JSON.stringify(items)); window.dispatchEvent(new CustomEvent("healthsync-notifications", { detail: { recipient } })); };
export const addNotification = (recipient, message, type = "info") => writeNotifications(recipient, [{ id: crypto.randomUUID(), message, type, createdAt: new Date().toISOString(), read: false }, ...readNotifications(recipient)]);
