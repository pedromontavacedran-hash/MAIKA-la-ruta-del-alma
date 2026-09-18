import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, cualquier error de render sin capturar desmonta TODA la app (React 18 sin boundary) y
 * solo queda el fondo casi negro de `body` (`--maika-bg`) — parece que "la pantalla se pone negra"
 * sin ninguna pista de qué pasó. Con el boundary, al menos se ve el mensaje real en pantalla.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        style={{
          minHeight: "100svh",
          background: "#08060f",
          color: "#f5e6a3",
          padding: 24,
          fontFamily: "Arial, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center"
        }}
      >
        <p style={{ fontSize: 18, fontWeight: "bold" }}>Algo se rompió al mostrar esta pantalla</p>
        <p style={{ fontSize: 14, opacity: 0.85, maxWidth: 520, whiteSpace: "pre-wrap" }}>
          {error.message || String(error)}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: "10px 20px",
            borderRadius: 10,
            background: "linear-gradient(45deg, #d4af37, #f5e6a3)",
            border: "none",
            color: "black",
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
