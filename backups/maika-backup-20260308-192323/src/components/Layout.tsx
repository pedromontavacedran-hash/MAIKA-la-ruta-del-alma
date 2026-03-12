import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  pulseStyle?: string;
}

export default function Layout({ children, pulseStyle }: LayoutProps) {
  return (
    <div
      className="app-shell"
      style={{
        backgroundImage: "linear-gradient(rgba(10, 7, 25, 0.62), rgba(10, 7, 25, 0.62)), url('/fondo%20estrellado.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        padding: 20,
        color: "gold",
        position: "relative"
      }}
    >
      {pulseStyle && <style>{pulseStyle}</style>}
      {children}
    </div>
  );
}
