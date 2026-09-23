/** Префикс подпапки на GitHub Pages. Пустой при локальном запуске. */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Путь к файлу в public/ с учётом подпапки. */
export const asset = (path: string) => `${BASE}${path}`;
