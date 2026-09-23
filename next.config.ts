import type { NextConfig } from "next";

// На GitHub Pages сайт живёт в подпапке /<repo>/, локально — в корне.
// Путь приходит из окружения, чтобы одна и та же сборка годилась туда и туда.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",              // сервера нет, отдаётся папка out/
  images: { unoptimized: true }, // обязательно при статическом экспорте
  trailingSlash: true,           // как Pages отдаёт папки
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
