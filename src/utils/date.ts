/**
 * Date formatting utilities
 */

export const formatDate = (
  date: string | Date,
  format: string = "DD/MM/YYYY",
): string => {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return format
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", String(year))
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, "DD/MM/YYYY HH:mm");
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, "HH:mm");
};

export const getToday = (): string => {
  return new Date().toISOString().split("T")[0] || "";
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const isToday = (date: string | Date): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isPast = (date: string | Date): boolean => {
  return new Date(date) < new Date();
};

export const isFuture = (date: string | Date): boolean => {
  return new Date(date) > new Date();
};
