import React from "react";
import { THEME } from "../../utils/constants";

interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
  rightElement?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  sub,
  rightElement,
  as = "h2",
}) => {
  const HeadingTag = as;
  return (
    <div style={{ marginBottom: 32 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <HeadingTag
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(23px, 4vw, 30px)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: 0,
              color: "var(--t-ink)",
            }}
          >
            {children}
          </HeadingTag>
          {sub && (
            <p
              style={{
                color: THEME.muted,
                fontSize: 14,
                marginTop: 6,
                fontWeight: 500,
                maxWidth: 600,
                lineHeight: 1.5,
              }}
            >
              {sub}
            </p>
          )}
        </div>
        {rightElement && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{rightElement}</div>
        )}
      </div>
    </div>
  );
};
