/**
 * Телефон и почта заказчика.
 *
 * Проверяем ровно то, что мешает до него дозвониться или написать: длину
 * номера и форму адреса. Глубже лезть нет смысла — существование ящика
 * покажет только письмо, а лишние запреты на вводе злят больше, чем помогают.
 */

/** Только цифры; российский номер приводим к 10 знакам после кода страны. */
export function phoneDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) d = `7${d.slice(1)}`;
  if (d.startsWith("7")) d = d.slice(1);
  return d.slice(0, 10);
}

/** +7 (999) 123-45-67 — собираем по мере ввода, не мешая стирать. */
export function formatPhone(raw: string): string {
  const d = phoneDigits(raw);
  if (!d) return "";
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  let out = `+7 (${parts[0]}`;
  if (d.length > 3) out += `) ${parts[1]}`;
  if (d.length > 6) out += `-${parts[2]}`;
  if (d.length > 8) out += `-${parts[3]}`;
  return out;
}

export const phoneOk = (raw: string) => phoneDigits(raw).length === 10;

/** Без изысков: что-то@что-то.домен, без пробелов. */
export const emailOk = (raw: string) => /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/.test(raw.trim());
