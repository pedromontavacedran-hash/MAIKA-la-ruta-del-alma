import type { ReactNode } from "react";
import FondoEstrellado from "../FondoEstrellado";

interface LayoutProps {
  children: ReactNode;
  pulseStyle?: string;
  /** Si true, quita padding superior para que el hero quede a ras del borde */
  fullBleedTop?: boolean;
}

export default function Layout({ children, pulseStyle, fullBleedTop }: LayoutProps) {
  return (
    <div
      className={`app-shell${fullBleedTop ? " app-shell--full-bleed-top" : ""}`}
      style={{
        backgroundColor: "#0B0B0D",
        minHeight: "100vh",
        padding: 20,
        color: "#F5E6C8",
        position: "relative",
        zIndex: 1,
      }}
    >
      <FondoEstrellado />
      <div className="app-shell__content" style={{ position: "relative", zIndex: 1 }}>
        {pulseStyle && <style>{pulseStyle}</style>}
        {children}
      </div>
    </div>
  );
}
