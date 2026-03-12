import { useState } from 'react';
import './FondoEstrellado.css';

interface Estrella {
  id: number;
  left: string;
  top: string;
  size: number;
  delay: number;
  color: string;
  duracion: number;
}

export default function FondoEstrellado() {
  const [estrellas] = useState<Estrella[]>(() => {
    const nuevas = [];
    for (let i = 0; i < 200; i++) { // Más estrellas
      nuevas.push({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        size: Math.random() * 8 + 4, // 4-12px (mucho más grandes)
        delay: Math.random() * 5,
        color: Math.random() > 0.5 ? '#ffffff' : '#ffd700', // 50% blancas, 50% doradas
        duracion: Math.random() * 2 + 2,
      });
    }
    return nuevas;
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 0,
      background: 'transparent', // Fondo transparente para que se vea el morado
    }}>
      {estrellas.map((e) => (
        <div
          key={e.id}
          style={{
            position: 'absolute',
            left: e.left,
            top: e.top,
            width: e.size + 'px',
            height: e.size + 'px',
            background: e.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${e.size * 2}px ${e.color}`,
            animation: `parpadear ${e.duracion}s infinite ${e.delay}s`,
          }}
        />
      ))}
    </div>
  );
}