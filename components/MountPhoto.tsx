import photos from "@/content/mount-photos.json";
import { asset } from "@/lib/paths";
import type { Mount } from "@/lib/mounts";

const MAP = photos as Record<string, string>;

/** Есть ли снимок — чтобы вызывающий код мог выбрать вёрстку под фото. */
export const hasPhoto = (m: Mount) => Boolean(MAP[m.id]);

/**
 * Снимок оснастки на белой подложке.
 *
 * Все фото приведены к квадрату с одинаковым полем, поэтому предметы в
 * соседних карточках выглядят одного масштаба. Заглушка занимает ту же
 * площадь — без этого карточки с фото и без него разъезжались по высоте.
 */
export default function MountPhoto({ m, className = "" }: { m: Mount; className?: string }) {
  const file = MAP[m.id];
  if (!file) {
    return (
      <div className={`mount-photo mount-photo--empty ${className}`}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 3h4v4h-4z" />
          <path d="M8 7h8l1.5 6h-11z" />
          <rect x="5" y="15" width="14" height="4" rx="1.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`mount-photo ${className}`}>
      <img src={asset(`/${file}`)} alt={`${m.brand} ${m.model}`} loading="lazy" decoding="async" />
    </div>
  );
}
