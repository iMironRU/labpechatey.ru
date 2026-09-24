import { lookupInnMock, type Registry } from "@/lib/inn";

/**
 * Единственная дверь во внешний мир.
 *
 * Пока бэкенда нет, всё отвечает моками — сайт статический и живёт на
 * Pages. Когда появится сервер, достаточно задать NEXT_PUBLIC_API_BASE:
 * ключи DaData и Эльбы остаются на нём, браузер их не видит.
 *
 * Контракт эндпоинтов описан в docs/бэкенд-контракт.md.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
export const hasBackend = Boolean(API_BASE);

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Реквизиты по ИНН: на бэке это DaData, здесь — мок прототипа. */
export function lookupInn(inn: string, signal?: AbortSignal): Promise<Registry> {
  if (!hasBackend) return lookupInnMock(inn, signal);
  return call<Registry>(`/registry/${inn}`, { signal });
}

export type OrderDraft = {
  kind: string;
  situation: string | null;
  template: string | null;
  values: Record<string, string | undefined>;
  mount: string | null;
  urgency: "rush" | "calm";
  total: number;
  delivery: { method: string; address?: string; service?: string; pvz?: number | null };
  pay: string;
  contact: { name?: string; phone?: string; email?: string };
};

export type OrderCreated = { id: string; number: string; invoiceUrl?: string };

/** Заказ уходит на бэк: он же выставит счёт в Эльбе и пришлёт статусы. */
export function createOrder(draft: OrderDraft): Promise<OrderCreated> {
  if (!hasBackend) {
    const id = `demo-${Date.now().toString(36)}`;
    return Promise.resolve({ id, number: id.slice(-6).toUpperCase() });
  }
  return call<OrderCreated>("/orders", { method: "POST", body: JSON.stringify(draft) });
}

export type OrderStatus = {
  id: string;
  state: "new" | "accepted" | "in_work" | "ready" | "issued" | "canceled";
  paid: boolean;
  updatedAt: string;
};

export function orderStatus(id: string): Promise<OrderStatus> {
  if (!hasBackend) {
    return Promise.resolve({ id, state: "new", paid: false, updatedAt: new Date().toISOString() });
  }
  return call<OrderStatus>(`/orders/${id}`);
}

/** Заявка со страницы услуги — та же дверь, отдельный маршрут. */
export function sendLead(lead: { service: string; name: string; phone: string; file?: string }) {
  if (!hasBackend) return Promise.resolve({ ok: true });
  return call<{ ok: boolean }>("/leads", { method: "POST", body: JSON.stringify(lead) });
}
