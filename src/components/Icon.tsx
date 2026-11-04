const paths = {
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z",
  car: "m5 7 2-4h10l2 4M3 10h18v8H3zM5 18v3m14-3v3M6 13h2m8 0h2M3 10l2-3h14l2 3",
  plane: "m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2",
  mountain: "m2 20 7-13 4 7 3-5 6 11H2Zm4-7 3 2 2-4m3 3 3 2 2-1",
  work: "M8 6V3h8v3M3 6h18v15H3zM3 11l9 4 9-4m-9 1v5",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  check: "m5 12 4 4L19 6",
  plus: "M12 5v14M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  shield: "m12 3 9 4v6c0 5-9 9-9 9s-9-4-9-9V7zM8 12l3 3 5-6",
  book: "M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Zm0 0v16",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  download: "M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6",
  menu: "M4 6h16M4 12h16M4 18h16",
  bandage:
    "m7 3 14 14a3 3 0 0 1-4 4L3 7a3 3 0 0 1 4-4Zm1 4-5 5m14 0-5 5m-4-7h.01m3 3h.01",
  thermometer: "M9 14V5a3 3 0 0 1 6 0v9a5 5 0 1 1-6 0Zm3-7v10m6-10h3m-3 4h3",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1",
  drop: "M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z",
  snow: "M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v6m0-10v.01",
  external: "M14 3h7v7m0-7L10 14M10 3H3v18h18v-7",
  rotate: "M3 10a9 9 0 1 1 1 8M3 3v7h7",
  chevron: "m9 5 7 7-7 7",
  heart: "M20 5a5 5 0 0 0-8 1 5 5 0 0 0-8-1c-6 6 8 16 8 16S26 11 20 5Z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
