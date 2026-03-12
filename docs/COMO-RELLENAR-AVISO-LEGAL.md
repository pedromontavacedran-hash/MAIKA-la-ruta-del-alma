# Cómo rellenar el Aviso Legal

Solo tienes que editar **un archivo**: `public/aviso-legal.html`

## Pasos

1. Abre el archivo `public/aviso-legal.html` en el editor (en Cursor: clic en el archivo en el panel de la izquierda).

2. Busca las líneas que tienen texto entre **corchetes** `[ ... ]` y sustituye ese texto por tus datos reales:

   | Qué buscar | Qué poner (ejemplo) |
   |------------|---------------------|
   | `[Nombre completo o razón social de MAIKA]` | Tu nombre o el nombre de la empresa. Ej: **Maika López** o **Maika - Rutas del Alma** |
   | `[Número de identificación fiscal]` | Tu DNI (persona física) o CIF (empresa). Ej: **12345678A** |
   | `[Dirección postal completa]` | Calle, número, código postal, ciudad, provincia. Ej: **Calle Ejemplo 12, 28001 Madrid** |
   | `[Correo electrónico de contacto]` | Email de contacto. Ej: **contacto@maika.com** |
   | `[Teléfono de contacto]` | Teléfono. Ej: **673 175 547** o **+34 673 175 547** |

3. Guarda el archivo (Ctrl+S).

4. Ya está. Cuando publiques la web, la página "Aviso Legal" (enlace en el pie de la web) mostrará tus datos.

## Ejemplo de cómo quedaría una línea

**Antes:**
```html
<p><strong>Titular:</strong> [Nombre completo o razón social de MAIKA]</p>
```

**Después (ejemplo):**
```html
<p><strong>Titular:</strong> Maika López</p>
```

Solo cambias lo que está entre los corchetes por tu información real. El resto del archivo no hace falta tocarlo.
