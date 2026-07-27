import React from "react";

interface Props {
  text: string;
}

export const StatusBar: React.FC<Props> = ({ text }) => {
  return (
    <div
      style={{
        height: "var(--height-statusbar, 24px)",
        background: "var(--color-surface-1, #13161c)",
        borderTop: "1px solid var(--color-border-subtle, #232832)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontSize: 11,
        color: "var(--color-text-secondary, #a0a8b6)",
        fontFamily: "monospace",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      <span style={{ color: "var(--color-accent, #4a90d9)", marginRight: 8 }}>●</span>
      <span>{text}</span>
    </div>
  );
};
