/**
 * ИНН и ОГРН: контрольные цифры по правилам ФНС и мок поиска по реестру.
 *
 * Контрольная цифра ловит опечатку до отправки заказа и заодно говорит,
 * юрлицо перед нами или ИП: 10 знаков — организация, 12 — физлицо.
 */

export type Registry = {
  status: "idle" | "searching" | "found" | "notfound";
  org?: string;
  city?: string;
  ogrn?: string;
};

export function checkInn(v: string): { ok: boolean; kind?: "ooo" | "ip"; msg: string } {
  if (!/^\d+$/.test(v)) return { ok: false, msg: "только цифры" };
  const d = [...v].map(Number);
  const k = (arr: number[], w: number[]) =>
    (w.reduce((s, x, i) => s + x * arr[i], 0) % 11) % 10;
  if (d.length === 10) {
    const ok = k(d, [2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[9];
    return { ok, kind: "ooo", msg: ok ? "юридическое лицо" : "контрольная цифра не сходится" };
  }
  if (d.length === 12) {
    const ok =
      k(d, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[10] &&
      k(d, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]) === d[11];
    return { ok, kind: "ip", msg: ok ? "физлицо или ИП" : "контрольная цифра не сходится" };
  }
  return { ok: false, msg: "10 цифр у организации, 12 у ИП" };
}

export function checkOgrn(v: string): { ok: boolean; kind?: "ooo" | "ip"; msg: string } {
  if (!/^\d+$/.test(v)) return { ok: false, msg: "только цифры" };
  if (v.length !== 13 && v.length !== 15) return { ok: false, msg: "13 цифр в ОГРН, 15 в ОГРНИП" };
  const mod = v.length === 13 ? 11n : 13n;
  const ok = Number((BigInt(v.slice(0, -1)) % mod) % 10n) === Number(v.slice(-1));
  return {
    ok,
    kind: v.length === 15 ? "ip" : "ooo",
    msg: ok ? (v.length === 15 ? "ОГРНИП" : "ОГРН организации") : "контрольная цифра не сходится",
  };
}

/**
 * Мок реестра: как в прототипе — задержка 850 мс, ИНН 5610100200 отдаёт
 * «не найдено». В проде сюда встанет DaData или API ФНС; запрос идёт
 * через прокси, потому что сайт статический и ключ на клиент не кладём.
 */
const MOCK_NOT_FOUND = "5610100200";

export function lookupInn(inn: string, signal?: AbortSignal): Promise<Registry> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      if (inn === MOCK_NOT_FOUND) {
        resolve({ status: "notfound", city: "Оренбург" });
        return;
      }
      resolve({
        status: "found",
        org: inn.length === 12 ? "Иванов Иван Иванович" : "Ромашка",
        city: "Оренбург",
        ogrn: inn.length === 12 ? "316565800012346" : "1105658001239",
      });
    }, 850);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}
