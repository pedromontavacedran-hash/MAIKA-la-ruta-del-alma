interface VisitasCounterProps {
  visitas: number;
}

export default function VisitasCounter({ visitas }: VisitasCounterProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 30,
        left: 30,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#C9A24A",
        fontSize: 14,
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
          <path d="M3.5 18c0-2.8 2.3-5 5.5-5s5.5 2.2 5.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
          <path d="M14.5 18c.2-1.9 1.9-3.4 4-3.4 2.2 0 4 1.7 4 3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <span>{visitas} visitas</span>
    </div>
  );
}

