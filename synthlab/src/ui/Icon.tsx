interface IconProps {
  name: "browser" | "play" | "stop" | "keyboard" | "detail" | "help" | "undo" | "redo" | "session" | "arrangement" | "image";
}

const paths: Record<IconProps["name"], string> = {
  browser: "M3 5h7l2 2h9v12H3z",
  play: "M8 5v14l11-7z",
  stop: "M6 6h12v12H6z",
  keyboard: "M3 6h18v12H3zM7 6v7m4-7v7m6-7v7M5 15v3m4-3v3m4-3v3m4-3v3",
  detail: "M4 5h16v14H4zM4 10h16M10 10v9",
  help: "M9.5 9a2.5 2.5 0 1 1 3 2.45c-.9.3-1.5.9-1.5 1.8M11 17h.01",
  undo: "M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6",
  redo: "m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6",
  session: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z",
  arrangement: "M3 5h18M3 12h18M3 19h18M7 3v4m5 3v4m6 3v4",
  image: "M4 5h16v14H4zM7 15l3-3 3 3 2-2 3 3M8 9h.01",
};

export function Icon({ name }: IconProps) {
  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

