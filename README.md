# Mi plan · definición

App personal de dieta y entrenamiento: objetivos de calorías y macros calculados con tus
datos, registro diario de comidas, seguimiento de peso y tu plan de entreno.

---

## Probarla en tu ordenador (opcional)

Necesitas Node.js instalado (https://nodejs.org). Luego, en la carpeta del proyecto:

```bash
npm install
npm run dev
```

Abre la dirección que aparezca (normalmente http://localhost:5173).

---

## Subirla a internet gratis (Vercel)

1. Crea una cuenta en **GitHub** (https://github.com) y sube esta carpeta a un repositorio
   nuevo (botón "New repository" → arrastras los archivos, o usas GitHub Desktop).
2. Crea una cuenta en **Vercel** (https://vercel.com) y entra con tu cuenta de GitHub.
3. En Vercel: "Add New… → Project" → eliges tu repositorio.
4. Vercel detecta Vite solo. Deja todo por defecto y pulsa **Deploy**.
5. En un minuto tienes tu enlace público (algo como `mi-plan-dieta.vercel.app`).

Cada vez que cambies el código en GitHub, Vercel vuelve a publicarlo solo.

> Nota: de momento los datos se guardan en el navegador de cada dispositivo.
> Tu enlace funciona, pero lo que apuntes en el móvil no se ve en el PC (y aún sin fotos).
> Eso se resuelve al migrar a la Raspberry Pi.

---

## Migración a la Raspberry Pi (PocketBase)

Solo cambia **un archivo**: `src/storage.js`.

Ahora guarda en el navegador. Para que los datos vivan en la Pi (y compartir entre
dispositivos + guardar fotos), sustituye el interior de `get` / `set` / `remove` por
llamadas a PocketBase. Las firmas no cambian, así que el resto de la app sigue igual.

Correspondencia de claves → colecciones de PocketBase:

| Clave en la app      | Colección en PocketBase | Campos                         |
|----------------------|-------------------------|--------------------------------|
| `profile`            | `perfil`                | edad, altura, peso, actividad… |
| `weights`            | `pesos`                 | fecha, kg                      |
| `log:AAAA-MM-DD`     | `registros`             | fecha, comidas marcadas        |
| *(nuevo)*            | `fotos_progreso`        | fecha, imagen (archivo)        |

Instalación del SDK cuando llegue el momento: `npm install pocketbase`.
