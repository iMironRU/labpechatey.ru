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
