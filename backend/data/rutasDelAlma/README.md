# Base de conocimiento · Rutas del Alma

Base documental controlada para el asistente «Explora y pregunta»
(`POST /rutas-del-alma/chat`). El modelo (DeepSeek) recibe **solo** las entradas
recuperadas de esta base como contexto autorizado: si la información no está
aquí, el asistente debe reconocer la insuficiencia en lugar de improvisar.

## Archivos

Un `.json` por categoría (todos los archivos del directorio se cargan y se
unen en una sola colección):

- `historia.json` — historia y antecedentes (Merkavá, Heikhalot, Yetzirah,
  Bahir, desarrollo medieval, Zóhar, expulsión, Safed, Luria…).
- `conceptos.json` — Ein Sof, Sefirot, Árbol de la Vida, letras, gematría,
  cuatro mundos, Tzimtzum, Tikkun…
- `textos.json` — corpus textual (Heikhalot, Yetzirah, Bahir, Zóhar, Pardes
  Rimmonim, Etz Chaim, Abulafia…).
- `nombres72.json` — Éxodo 14:19–21, 216 letras, tripletes, Shem HaMephorash,
  capa angélica posterior.
- `diferenciacion.json` — Cábala judía vs. cristiano-hermética, hermetismo,
  ocultismo occidental, espiritualidad contemporánea.
- `fuentes.json` — **registro bibliográfico** (no contiene entradas): obras
  académicas de referencia citables desde `referencias`.

## Registro bibliográfico (`fuentes.json`)

```json
{
  "id": "scholem-origins-kabbalah",
  "autor": "Gershom Scholem",
  "titulo": "Origins of the Kabbalah",
  "editorial": "Princeton University Press",
  "año": 1987,
  "isbn": "…",
  "enlace": "URL oficial o repositorio legal (null si no hay)",
  "estadoAcceso": "registrada_pendiente_de_consulta | consultada | no_disponible_legalmente",
  "nivel": "primaria | texto-historico | monografia-academica | estudio-academico | sintesis-academica | divulgacion-verificada",
  "capitulosConsultados": ["capítulos realmente consultados"],
  "paginasConsultadas": "pp. verificadas o null",
  "temasRelacionados": ["temas que la obra documenta"],
  "observaciones": "notas de acceso, edición, correcciones de título…"
}
```

Solo se registran obras consultables legalmente (editorial, biblioteca,
Internet Archive/Open Library con préstamo legal, acceso abierto). Nada de
copias no autorizadas. `capitulosConsultados`/`paginasConsultadas` solo se
rellenan tras verificar el texto — nunca por inferencia.

## Referencias desde una entrada

```json
"referencias": [
  { "fuente": "scholem-origins-kabbalah", "capitulo": "3", "paginas": "120–134", "nota": "opcional" }
]
```

`fuente` debe existir en `fuentes.json` (el cargador descarta y avisa las
referencias a obras no registradas). `capitulo`/`paginas` solo se rellenan
cuando se han verificado en la obra.

## Esquema de cada entrada

```json
{
  "id": "categoria.identificador-unico",
  "titulo": "Nombre del tema",
  "palabrasClave": ["frases que disparan la recuperación"],
  "certeza": "documentado | probable | discutido | incierto",
  "capas": {
    "tradicion": "Qué dicen las propias tradiciones y textos",
    "historia": "Lo establecible históricamente",
    "academia": "Debates e interpretaciones de especialistas",
    "interpretaciones": "Capas posteriores (renacentistas, herméticas, ocultistas, modernas)",
    "miradaMaika": "Reflexión propia de MAIKA (opcional, nunca como hecho histórico)"
  },
  "fuentes": ["Obra / autor / corpus del que procede la información"],
  "referencias": [{ "fuente": "id-de-fuentes.json", "capitulo": "…", "paginas": "…", "nota": "…" }],
  "relacionados": ["id-de-otra-entrada"]
}
```

- `relacionados`: ids de otras entradas del mismo tema. Cuando una entrada es
  hit directo, sus relacionadas viajan también al contexto (recuperación
  multi-fuente): la respuesta se construye desde el conjunto documental, no
  desde una única fuente.

Reglas al redactar entradas:

- Rellenar **solo** las capas con información documentada; omitir las demás.
- `certeza` se muestra al modelo para que module el tono («discutido» →
  presentar como debate, nunca como hecho).
- `palabrasClave` decide qué entradas viajan en el prompt: incluir sinónimos y
  formas con y sin tilde no hace falta (se normalizan), pero sí variantes
  («zohar», «quien escribio», «autor del zohar»).
- Nada inventado: traducciones, fechas, autores, correspondencias o poderes
  no documentados no entran en la base.
- `fuentes` permite rastrear internamente cada bloque; el modelo solo puede
  citar fuentes listadas aquí.
