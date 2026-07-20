// Helper di formattazione date (client-safe, locale italiano).

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ora";
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h fa`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ieri";
  if (d < 7) return `${d} giorni fa`;
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}
