import React from "react";

interface Props {
  text: string;
}

export const StatusBar: React.FC<Props> = ({ text }) => {
  return (
    <div
      style={{
        height: "var(--height-statusbar, 24px)",
        background: "var(--color-surface-1, #181817)",
        borderTop: "1px solid var(--color-border-subtle, #2c2b29)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        fontSize: 11,
        color: "var(--color-text-secondary, #aeaba8)",
        fontFamily: "monospace",
        userSelect: "none",
        zIndex: 10,
      }}
    >
      <span style={{ color: "var(--color-accent, #d9924a)", marginRight: 8 }}>●</span>
      <span>{text}</span>
    </div>
  );
};
