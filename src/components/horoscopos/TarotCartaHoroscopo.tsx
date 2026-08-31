import { useMemo, useState } from "react";
import { simboloMaikaParaCartaTarot } from "@/utils/tarotCartaSimboloMaika";

type Props = {
  cartaTarot: string;
  /** Solo la ficha visual (sin leyenda); útil cuando el título va fuera del componente. */
  soloFicha?: boolean;
  /** Si se indica, sustituye el símbolo por esta imagen (arte MAIKA, etc.). */
  imagenSrc?: string;
};

export function TarotCartaHoroscopo({ cartaTarot, soloFicha = false, imagenSrc }: Props) {
  const [imagenFallo, setImagenFallo] = useState(false);
  const simbolo = useMemo(() => simboloMaikaParaCartaTarot(cartaTarot), [cartaTarot]);
  const mostrarImagen = Boolean(imagenSrc) && !imagenFallo;

  const ficha = (
    <div
      className={`horoscopos-carta-ficha${mostrarImagen ? " horoscopos-carta-ficha--con-imagen" : ""}`}
      aria-hidden
    >
      <div className="horoscopos-carta-ficha__inner">
        <div className="horoscopos-carta-ficha__arte">
          {mostrarImagen ? (
            <img
              className="horoscopos-carta-ficha__img"
              src={imagenSrc}
              alt=""
              decoding="async"
              loading="lazy"
              onError={() => setImagenFallo(true)}
            />
          ) : (
            <span className="horoscopos-carta-ficha__simbolo">{simbolo}</span>
          )}
        </div>
      </div>
    </div>
  );

  if (soloFicha) {
    return (
      <div
        className="horoscopos-carta-bloque horoscopos-carta-bloque--solo-ficha"
        role="group"
        aria-label={`Carta del tarot: ${cartaTarot}`}
      >
        {ficha}
      </div>
    );
  }

  return (
    <div className="horoscopos-carta-bloque" role="group" aria-label={`Tu arcano esta semana: ${cartaTarot}`}>
      {ficha}
      <div className="horoscopos-carta-leyenda">
        <p className="horoscopos-carta-epigrafe">Tu arcano esta semana</p>
        <p className="horoscopos-carta-nombre">{cartaTarot}</p>
      </div>
    </div>
  );
}
