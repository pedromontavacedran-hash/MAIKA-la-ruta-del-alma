import { useState, useRef, useEffect, useCallback } from "react";
import type { CSSProperties, KeyboardEvent, MutableRefObject, RefObject } from "react";
import { GOOGLE_PLACES_API_KEY, THEME } from "../config";
import { PROVINCIA_POR_PREFIJO_CP } from "../utils/appCoreUtils";
import {
  construirQueryBusquedaDireccion,
  filtrarSugerenciasPorCp,
  normalizarPhotonFeature,
  type SugerenciaDireccion
} from "../utils/addressSearch";
import { parseGoogleAddressComponents } from "../utils/googleAddress";

export type CalleMergePatch = Partial<{
  calle: string;
  numero: string;
  cp: string;
  poblacion: string;
  provincia: string;
  pais: string;
}>;

interface CalleInputConSugerenciasProps {
  value: string;
  onValueChange: (calle: string) => void;
  onMergeCampos: (patch: CalleMergePatch) => void;
  cp: string;
  poblacion: string;
  inputStyle: CSSProperties;
  placeholder?: string;
  name?: string;
  forwardedRef?: RefObject<HTMLInputElement | null>;
  attachGooglePlaces?: boolean;
  resetSignal?: number;
  /** Para mostrar “Buscando…” fuera del grid (checkout / registro). */
  onBuscandoPhoton?: (b: boolean) => void;
  onInputKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Campo de calle con el mismo comportamiento que en finalizar compra (Photon + Google).
 * Las pistas de ayuda van fuera, en el padre, para no romper el grid del checkout.
 */
export default function CalleInputConSugerencias({
  value,
  onValueChange,
  onMergeCampos,
  cp,
  poblacion,
  inputStyle,
  placeholder = "Dirección *",
  name = "maika-calle",
  forwardedRef,
  attachGooglePlaces = true,
  resetSignal = 0,
  onBuscandoPhoton,
  onInputKeyDown
}: CalleInputConSugerenciasProps) {
  const normalizarCarrerCarrera = (calleRaw: string): string => {
    const c = String(calleRaw || "").trim();
    if (!c) return c;
    const upper = c.toUpperCase();
    // Algunos proveedores devuelven “CARRERA DE ...” (español) en vez de “CARRER DE ...”.
    // Convertimos solo el prefijo inicial “CARRERA” -> “CARRER”.
    return upper.replace(/^CARRERA(\b|[\s\-.,/]+)/i, "CARRER$1");
  };

  const [sugerencias, setSugerencias] = useState<SugerenciaDireccion[]>([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [googleAutocompleteActivo, setGoogleAutocompleteActivo] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const photonAbortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, SugerenciaDireccion[]>>(new Map());
  const elegidaDesdeListaRef = useRef(false);
  const permitirListaRef = useRef(false);
  const inputLocalRef = useRef<HTMLInputElement>(null);
  const mergeRef = useRef(onMergeCampos);
  mergeRef.current = onMergeCampos;

  useEffect(() => {
    onBuscandoPhoton?.(buscando);
  }, [buscando, onBuscandoPhoton]);

  const setInputRef = useCallback(
    (el: HTMLInputElement | null) => {
      inputLocalRef.current = el;
      if (forwardedRef) {
        (forwardedRef as MutableRefObject<HTMLInputElement | null>).current = el;
      }
    },
    [forwardedRef]
  );

  const buscarPhoton = useCallback(
    async (texto: string) => {
      const calle = (texto || "").trim();
      const cpNorm = (cp || "").replace(/\D/g, "").trim().slice(0, 5);
      const minChars = cpNorm.length === 5 ? 1 : 2;
      if (calle.length < minChars) {
        setSugerencias([]);
        setMostrarLista(false);
        setBuscando(false);
        return;
      }
      setBuscando(true);
      const pob = (poblacion || "").trim();
      const queryFinal = construirQueryBusquedaDireccion(calle, cpNorm, pob);
      const cacheKey = `${queryFinal}__${cpNorm}__${pob}`.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setSugerencias(cached);
        setMostrarLista(cached.length > 0 && permitirListaRef.current);
        setBuscando(false);
        return;
      }

      try {
        if (queryFinal.length < minChars) {
          setSugerencias([]);
          setMostrarLista(false);
          setBuscando(false);
          return;
        }
        if (photonAbortRef.current) photonAbortRef.current.abort();
        const controller = new AbortController();
        photonAbortRef.current = controller;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(queryFinal)}&limit=5`;
        const photonRes = await fetch(url, {
          headers: { "Accept-Language": "es" },
          signal: controller.signal
        });
        let data: SugerenciaDireccion[] = [];
        if (photonRes.ok) {
          const json = (await photonRes.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
          const features = json.features || [];
          data = features
            .map(normalizarPhotonFeature)
            .filter((x): x is SugerenciaDireccion => x !== null)
            .filter((s) => s.address?.road || s.display_name)
            .slice(0, 5);
          data = filtrarSugerenciasPorCp(data, cpNorm);
        }
        cacheRef.current.set(cacheKey, data);
        if (cacheRef.current.size > 50) {
          const first = cacheRef.current.keys().next().value;
          if (first) cacheRef.current.delete(first);
        }
        setSugerencias(data);
        setMostrarLista(data.length > 0 && permitirListaRef.current);
        setBuscando(false);
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setSugerencias([]);
        setMostrarLista(false);
        setBuscando(false);
      }
    },
    [cp, poblacion]
  );

  useEffect(() => {
    // Fallback Photon cuando Google no está activo (sin key o fallo de carga/runtime).
    if (GOOGLE_PLACES_API_KEY && googleAutocompleteActivo) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const calle = (value || "").trim();
    const cpNorm = (cp || "").replace(/\D/g, "").trim().slice(0, 5);
    const minChars = cpNorm.length === 5 ? 1 : 2;
    if (calle.length < minChars) {
      setSugerencias([]);
      setMostrarLista(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (elegidaDesdeListaRef.current) {
        elegidaDesdeListaRef.current = false;
        return;
      }
      void buscarPhoton(calle);
    }, 220);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, buscarPhoton, googleAutocompleteActivo]);

  useEffect(() => {
    setSugerencias([]);
    setMostrarLista(false);
    setBuscando(false);
  }, [resetSignal]);

  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY || !attachGooglePlaces) {
      setGoogleAutocompleteActivo(false);
      return;
    }

    const win = window as Window & {
      google?: { maps?: { places?: { Autocomplete: unknown }; event?: { clearInstanceListeners: (o: object) => void } } };
      __maikaGoogleMapsResolve?: () => void;
    };

    const loadScript = (): Promise<void> => {
      if (win.google?.maps?.places) return Promise.resolve();
      return new Promise((resolve, reject) => {
        if (document.querySelector('script[src*="maps.googleapis.com"]')) {
          if (win.google?.maps?.places) resolve();
          else (win as { __maikaGoogleMapsResolve?: () => void }).__maikaGoogleMapsResolve = resolve;
          return;
        }
        (win as { __maikaGoogleMapsResolve?: () => void }).__maikaGoogleMapsResolve = resolve;
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_PLACES_API_KEY)}&libraries=places&callback=__maikaGoogleMapsResolve`;
        script.async = true;
        script.onerror = () => reject(new Error("Google Maps script failed"));
        document.head.appendChild(script);
      });
    };

    type AutocompleteInstance = {
      getPlace: () => { address_components?: Array<{ types: string[]; long_name: string; short_name: string }> };
      addListener: (ev: string, fn: () => void) => { remove: () => void };
    };
    let autocomplete: AutocompleteInstance | null = null;

    loadScript()
      .then(() => {
        if (!inputLocalRef.current) return;
        if (!win.google?.maps?.places?.Autocomplete) {
          setGoogleAutocompleteActivo(false);
          return;
        }
        const Autocomplete = win.google.maps.places.Autocomplete as new (input: HTMLInputElement, opts: object) => AutocompleteInstance;
        autocomplete = new Autocomplete(inputLocalRef.current, {
          types: ["address"],
          componentRestrictions: { country: "es" },
          fields: ["address_components"]
        });
        setGoogleAutocompleteActivo(true);

        const ac = autocomplete;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          const components = place?.address_components || [];
          const { route, streetNumber, postalCode, locality, province } = parseGoogleAddressComponents(components);
          const patch: CalleMergePatch = {};
          const r = (route || "").trim();
          if (r) patch.calle = normalizarCarrerCarrera(r);
          if (streetNumber) patch.numero = streetNumber.toUpperCase();
          if (postalCode) patch.cp = postalCode.replace(/\D/g, "").slice(0, 5);
          if (locality) patch.poblacion = locality.toUpperCase();
          if (province) patch.provincia = province.toUpperCase();
          mergeRef.current(patch);
        });
      })
      .catch(() => {
        setGoogleAutocompleteActivo(false);
      });

    return () => {
      if (photonAbortRef.current) photonAbortRef.current.abort();
      const gmaps = win.google?.maps;
      if (autocomplete && gmaps?.event) gmaps.event.clearInstanceListeners(autocomplete as unknown as object);
      setGoogleAutocompleteActivo(false);
    };
  }, [GOOGLE_PLACES_API_KEY, attachGooglePlaces]);

  const aplicarSugerenciaPhoton = (s: SugerenciaDireccion) => {
    const addr = s.address || {};
    const calleSugerida = addr.road?.trim() || (s.display_name.split(",")[0] || "").trim();
    const numeroSugerido = addr.house_number?.trim() || "";
    const cpSugerido = (addr.postcode || "").replace(/\D/g, "").slice(0, 5);
    const provinciaSugerida =
      (cpSugerido.length === 5 ? PROVINCIA_POR_PREFIJO_CP[cpSugerido.slice(0, 2)] : null) ||
      addr.county?.trim() ||
      addr.state?.trim() ||
      "";
    const patch: CalleMergePatch = {};
    if (calleSugerida) patch.calle = normalizarCarrerCarrera(calleSugerida);
    if (numeroSugerido) patch.numero = numeroSugerido.toUpperCase();
    if (addr.postcode) patch.cp = String(addr.postcode).replace(/\D/g, "").slice(0, 5);
    if (addr.city) patch.poblacion = String(addr.city).trim().toUpperCase();
    if (provinciaSugerida) patch.provincia = provinciaSugerida.toUpperCase();
    mergeRef.current(patch);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={setInputRef}
        type="text"
        name={name}
        placeholder={placeholder}
        autoComplete="off"
        data-lpignore="true"
        data-1p-ignore="true"
        value={value}
        onChange={(e) => {
          elegidaDesdeListaRef.current = false;
          permitirListaRef.current = true;
          onValueChange(e.target.value.toUpperCase());
          if (!googleAutocompleteActivo) setMostrarLista(false);
        }}
        onFocus={() => {
          if (
            !googleAutocompleteActivo &&
            permitirListaRef.current &&
            (value || "").trim().length >= 1 &&
            sugerencias.length > 0
          ) {
            setMostrarLista(true);
          } else if (!googleAutocompleteActivo) {
            setMostrarLista(false);
          }
        }}
        onBlur={() => {
          permitirListaRef.current = false;
          setMostrarLista(false);
        }}
        onKeyDown={(e) => {
          onInputKeyDown?.(e);
        }}
        style={{ ...inputStyle, marginBottom: 0, minWidth: 0, width: "100%", boxSizing: "border-box" }}
      />
      {!googleAutocompleteActivo && mostrarLista && sugerencias.length > 0 && (
        <ul
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            margin: 0,
            padding: 0,
            listStyle: "none",
            background: THEME.bg,
            border: `2px solid ${THEME.goldMain}`,
            borderRadius: 8,
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 10002,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
          }}
        >
          {sugerencias.map((s, i) => (
            <li
              key={`${s.display_name}-${i}`}
              onMouseDown={(e) => {
                e.preventDefault();
                elegidaDesdeListaRef.current = true;
                if (debounceRef.current) {
                  clearTimeout(debounceRef.current);
                  debounceRef.current = null;
                }
                aplicarSugerenciaPhoton(s);
                setMostrarLista(false);
                setSugerencias([]);
                inputLocalRef.current?.blur();
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                color: "white",
                borderBottom: i < sugerencias.length - 1 ? "1px solid rgba(201,162,74,0.3)" : "none",
                fontSize: 14
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CalleInputAyudaSugerencias({
  buscando
}: {
  buscando: boolean;
}) {
  return (
    <div style={{ margin: "0 0 2px" }}>
      <p className="checkout-texto-ayuda" style={{ margin: 0 }}>
        {GOOGLE_PLACES_API_KEY ? "Escribe y elige tu dirección." : "Si no aparece tu dirección, puedes escribirla manualmente."}
      </p>
      {!GOOGLE_PLACES_API_KEY && (
        <div style={{ minHeight: 16 }}>
          <span className="checkout-texto-ayuda" style={{ opacity: buscando ? 1 : 0 }}>Buscando...</span>
        </div>
      )}
    </div>
  );
}
