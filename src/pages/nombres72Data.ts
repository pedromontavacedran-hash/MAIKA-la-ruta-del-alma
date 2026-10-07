/*
 * Datos de los 72 Nombres (Shem HaMephorash).
 *
 * - `hebreo`: triplete derivado de Éxodo 14:19–21 (tres versículos de 72 letras
 *   leídos en boustrophedon: directo, inverso, directo). Método documentado en
 *   el Sefer HaBahir (s. XII) y por Rashi (b. Sukkah 45a).
 * - `angel`: nombre angélico formado añadiendo el sufijo -el/-iah al triplete.
 *   ATENCIÓN: esta atribución pertenece a la tradición CRISTIANO-HERMÉTICA
 *   posterior (Johann Reuchlin, De Arte Cabalistica, 1517), NO a la Cábala
 *   judía. Las variantes de transliteración se indican con "/".
 * - `coro`: coro angelical según la misma tabla de Reuchlin.
 * - `versiculo`: versículo bíblico asociado según la tabla hermética de
 *   Thomas Rudd (s. XVII).
 *
 * No se incluyen "significados": los tripletes son letras, no palabras, y las
 * interpretaciones modernas difieren entre fuentes. Mejor eso que inventar.
 */

export type Nombre72 = {
  hebreo: string;
  angel: string;
  coro: string;
  versiculo: string;
};

export const NOMBRES_72: Nombre72[] = [
  { hebreo: "והו", angel: "Vehuiah", coro: "Serafines", versiculo: "Salmos 3:3" },
  { hebreo: "ילי", angel: "Jelial", coro: "Serafines", versiculo: "Salmos 22:19" },
  { hebreo: "סיט", angel: "Sitael", coro: "Serafines", versiculo: "Salmos 91:2" },
  { hebreo: "עלם", angel: "Elemiah", coro: "Serafines", versiculo: "Salmos 6:4" },
  { hebreo: "מהש", angel: "Mahasiah", coro: "Serafines", versiculo: "Salmos 34:4" },
  { hebreo: "ללה", angel: "Iehahel", coro: "Serafines", versiculo: "Salmos 9:11" },
  { hebreo: "אכא", angel: "Achaiah", coro: "Serafines", versiculo: "Salmos 103:8" },
  { hebreo: "כהת", angel: "Cahethel", coro: "Serafines", versiculo: "Salmos 95:6" },
  { hebreo: "הזי", angel: "Haziel", coro: "Querubines", versiculo: "Salmos 25:6" },
  { hebreo: "אלד", angel: "Aladiah", coro: "Querubines", versiculo: "Salmos 33:22" },
  { hebreo: "לאו", angel: "Laviah / Lauiah", coro: "Querubines", versiculo: "Salmos 18:46" },
  { hebreo: "ההע", angel: "Hahaiah", coro: "Querubines", versiculo: "Salmos 10:1" },
  { hebreo: "יזל", angel: "Iezalel", coro: "Querubines", versiculo: "Salmos 98:4" },
  { hebreo: "מבה", angel: "Mebahel", coro: "Querubines", versiculo: "Salmos 9:9" },
  { hebreo: "הרי", angel: "Hariel", coro: "Querubines", versiculo: "Salmos 94:22" },
  { hebreo: "הקם", angel: "Hakamiah", coro: "Querubines", versiculo: "Salmos 88:1" },
  { hebreo: "לאו", angel: "Loviah / Louiah", coro: "Tronos", versiculo: "Salmos 8:9" },
  { hebreo: "כלי", angel: "Caliel", coro: "Tronos", versiculo: "Salmos 35:24" },
  { hebreo: "לוו", angel: "Levuiah / Leuuiah", coro: "Tronos", versiculo: "Salmos 40:1" },
  { hebreo: "פהל", angel: "Pahaliah", coro: "Tronos", versiculo: "Salmos 120:1–2" },
  { hebreo: "נלכ", angel: "Nelchael", coro: "Tronos", versiculo: "Salmos 31:14" },
  { hebreo: "ייי", angel: "Ieiaiel", coro: "Tronos", versiculo: "Salmos 121:5" },
  { hebreo: "מלה", angel: "Melahel", coro: "Tronos", versiculo: "Salmos 121:8" },
  { hebreo: "חהו", angel: "Haiviah / Hahuiah", coro: "Tronos", versiculo: "Salmos 33:18" },
  { hebreo: "נתה", angel: "Nithhaiah", coro: "Dominaciones", versiculo: "Salmos 9:1" },
  { hebreo: "האא", angel: "Haaiah", coro: "Dominaciones", versiculo: "Salmos 119:145" },
  { hebreo: "ירת", angel: "Ierathel", coro: "Dominaciones", versiculo: "Salmos 140:1" },
  { hebreo: "שאה", angel: "Saeehiah", coro: "Dominaciones", versiculo: "Salmos 71:12" },
  { hebreo: "ריי", angel: "Reiaiel", coro: "Dominaciones", versiculo: "Salmos 54:4" },
  { hebreo: "אומ", angel: "Omael", coro: "Dominaciones", versiculo: "Salmos 71:5" },
  { hebreo: "לכב", angel: "Lecabel", coro: "Dominaciones", versiculo: "Salmos 71:16" },
  { hebreo: "ושר", angel: "Vasariah", coro: "Dominaciones", versiculo: "Salmos 33:4" },
  { hebreo: "יחו", angel: "Lehuiah", coro: "Potestades", versiculo: "Salmos 94:11" },
  { hebreo: "להח", angel: "Lehahiah", coro: "Potestades", versiculo: "Salmos 131:3" },
  { hebreo: "כוק", angel: "Chavakiah", coro: "Potestades", versiculo: "Salmos 116:1" },
  { hebreo: "מנד", angel: "Manadel", coro: "Potestades", versiculo: "Salmos 26:8" },
  { hebreo: "אני", angel: "Haniel", coro: "Potestades", versiculo: "Salmos 80:3" },
  { hebreo: "חעם", angel: "Haamiah", coro: "Potestades", versiculo: "Salmos 91:9" },
  { hebreo: "רהע", angel: "Rehael", coro: "Potestades", versiculo: "Salmos 30:10" },
  { hebreo: "ייז", angel: "Ieiazel", coro: "Potestades", versiculo: "Salmos 88:14" },
  { hebreo: "ההה", angel: "Hahahel", coro: "Virtudes", versiculo: "Salmos 120:2" },
  { hebreo: "מיכ", angel: "Mikael", coro: "Virtudes", versiculo: "Salmos 121:7" },
  { hebreo: "וול", angel: "Veualiah", coro: "Virtudes", versiculo: "Salmos 88:13" },
  { hebreo: "ילה", angel: "Ielahiah", coro: "Virtudes", versiculo: "Salmos 119:108" },
  { hebreo: "סאל", angel: "Sealiah", coro: "Virtudes", versiculo: "Salmos 94:18" },
  { hebreo: "ערי", angel: "Ariel", coro: "Virtudes", versiculo: "Salmos 145:9" },
  { hebreo: "עשל", angel: "Asaliah", coro: "Virtudes", versiculo: "Salmos 92:5" },
  { hebreo: "מיה", angel: "Mihael", coro: "Virtudes", versiculo: "Salmos 98:2" },
  { hebreo: "והו", angel: "Vehuel", coro: "Principados", versiculo: "Salmos 145:3" },
  { hebreo: "דני", angel: "Daniel", coro: "Principados", versiculo: "Salmos 145:8" },
  { hebreo: "החש", angel: "Hahasiah", coro: "Principados", versiculo: "Salmos 104:31" },
  { hebreo: "עמם", angel: "Imamiah", coro: "Principados", versiculo: "Salmos 7:17" },
  { hebreo: "ננא", angel: "Nanael", coro: "Principados", versiculo: "Salmos 119:75" },
  { hebreo: "נית", angel: "Nithael", coro: "Principados", versiculo: "Salmos 103:19" },
  { hebreo: "מבה", angel: "Mebahaiah", coro: "Principados", versiculo: "Salmos 102:12" },
  { hebreo: "פוי", angel: "Poiel", coro: "Principados", versiculo: "Salmos 145:14" },
  { hebreo: "נמם", angel: "Nemamiah", coro: "Arcángeles", versiculo: "Salmos 115:11" },
  { hebreo: "ייל", angel: "Ieialel", coro: "Arcángeles", versiculo: "Salmos 6:3" },
  { hebreo: "הרח", angel: "Harahel", coro: "Arcángeles", versiculo: "Salmos 113:3" },
  { hebreo: "מצר", angel: "Mizrael", coro: "Arcángeles", versiculo: "Salmos 145:17" },
  { hebreo: "ומב", angel: "Vmabel", coro: "Arcángeles", versiculo: "Salmos 113:2" },
  { hebreo: "יהה", angel: "Iahhael", coro: "Arcángeles", versiculo: "Salmos 119:159" },
  { hebreo: "ענו", angel: "Anavel", coro: "Arcángeles", versiculo: "Salmos 100:2" },
  { hebreo: "מחי", angel: "Mehiel", coro: "Arcángeles", versiculo: "Salmos 33:18" },
  { hebreo: "דמב", angel: "Damabiah", coro: "Ángeles", versiculo: "Salmos 90:13" },
  { hebreo: "מנק", angel: "Mavakel", coro: "Ángeles", versiculo: "Salmos 38:21" },
  { hebreo: "איע", angel: "Eiael", coro: "Ángeles", versiculo: "Salmos 37:4" },
  { hebreo: "חבו", angel: "Habuiah", coro: "Ángeles", versiculo: "Salmos 106:1" },
  { hebreo: "ראה", angel: "Roehel", coro: "Ángeles", versiculo: "Salmos 16:5" },
  { hebreo: "יבמ", angel: "Yabamiah", coro: "Ángeles", versiculo: "Génesis 1:1" },
  { hebreo: "היי", angel: "Haiaiel", coro: "Ángeles", versiculo: "Salmos 109:30" },
  { hebreo: "מומ", angel: "Mumiah", coro: "Ángeles", versiculo: "Salmos 116:7" }
];

/** Nombre de cada letra hebrea (transliteración de letras, no significado). */
const NOMBRE_LETRA: Record<string, string> = {
  "א": "Álef", "ב": "Bet", "ג": "Guímel", "ד": "Dálet", "ה": "Heh",
  "ו": "Vav", "ז": "Zayin", "ח": "Jet", "ט": "Tet", "י": "Yod",
  "כ": "Kaf", "ל": "Lámed", "מ": "Mem", "נ": "Nun", "ס": "Sámej",
  "ע": "Áyin", "פ": "Peh", "צ": "Tsadé", "ק": "Qof", "ר": "Resh",
  "ש": "Shin", "ת": "Tav"
};

/** "והו" → "Vav · Heh · Vav" (nombre de cada letra, no una traducción). */
export function nombreDeLasLetras(hebreo: string): string {
  return [...hebreo].map((letra) => NOMBRE_LETRA[letra] ?? letra).join(" · ");
}
