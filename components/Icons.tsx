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
