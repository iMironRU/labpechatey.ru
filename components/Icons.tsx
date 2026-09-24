/**
 * Иконки из прототипа — контуры взяты из макетов `design-ref/prototype`
 * один в один, чтобы не расходиться со стрелками и шевронами дизайна.
 */
type Props = { size?: number; width?: number };

const base = (size: number, width: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: width,
  "aria-hidden": true,
});

export const IconArrowRight = ({ size = 16, width = 1.8 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);

export const IconArrowLeft = ({ size = 14, width = 1.8 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M19 12H6M11 18l-6-6 6-6" />
  </svg>
);

export const IconChevronDown = ({ size = 17, width = 2 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconClock = ({ size = 14, width = 1.8 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M12 7v5l3 2" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const IconCalendar = ({ size = 14, width = 1.8 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

export const IconCross = ({ size = 11, width = 2.4 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconChevronLeft = ({ size = 17, width = 1.9 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconChevronRight = ({ size = 17, width = 1.9 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const IconShield = ({ size = 15, width = 1.6 }: Props) => (
  <svg {...base(size, width)} style={{ flex: "none" }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const IconPin = ({ size = 16, width = 1.7 }: Props) => (
  <svg {...base(size, width)} style={{ flex: "none" }}>
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

/** Иконки карточек ситуаций — контуры из «Конструктор.dc.html». */
const CAT_PATHS: Record<string, string[]> = {
  guard: ["M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"],
  refresh: ["M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v4h4"],
  lines: ["M4 7h16", "M4 12h16", "M4 17h10"],
  doctor: ["M12 3v6", "M9 6h6", "M6 21a6 6 0 0112 0"],
  sign: ["M4 18c4-1 5-9 8-9s2 6 4 6 2-3 4-3"],
  question: ["M12 17h.01M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4"],
  upload: ["M12 16V4M7 9l5-5 5 5", "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"],
  gallery: ["M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
  help: ["M12 17h.01M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 4", "M21 12a9 9 0 11-18 0 9 9 0 0118 0"],
};

export const IconCat = ({ name, size = 20 }: { name: string; size?: number }) => (
  <svg {...base(size, 1.6)} strokeLinecap="round" strokeLinejoin="round">
    {(CAT_PATHS[name] ?? []).map((d, i) => (
      <path key={i} d={d} />
    ))}
  </svg>
);

export const IconUpload = ({ size = 20, width = 1.7 }: Props) => (
  <svg {...base(size, width)}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
);

export const IconGrid = ({ size = 20, width = 1.7 }: Props) => (
  <svg {...base(size, width)}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
