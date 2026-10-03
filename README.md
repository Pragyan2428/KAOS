# KAOS of Circuit 2.0 — Website

Landing page for **KAOS of Circuit 2.0**, the flagship technical event of the **KIIT Electrical Society**:
*Engineer · Build · Exhibit · Belong.*

It's a static site made of one HTML file and a folder of images. It has no build step, no frameworks and no dependencies to install.

---

## Features

- **Animated intro**
  - Two circuit lines race in from the screen edges and meet in the centre with a spark.
  - A full hand-drawn mandala (with a glowing red core) blooms out of that point and turns slowly.
  - The event name powers on with a flicker, then the screen opens like doors onto the site.
- **Hero banner** with the original artwork: temple pillars, campus gate, sunset and the red circuit road.
- **Living background** on the hero, so the scene never feels static:
  - gentle **mouse parallax**: the background drifts one way and the wheel the other, giving depth;
  - glowing **embers** drifting up from the road (a `<canvas>`; it pauses when the hero is scrolled out of view);
  - the **sun breathes** with a soft halo, and faint **light rays** turn slowly behind it.
  All of it switches off for visitors with *Reduce motion* turned on. Change the number of embers in `Array.from({ length: 46 }, …)`.
- **3D Konark chakra** in the bottom-left of the hero, recoloured in the illustration's own palette so it blends into the painting: a cut-out photo of the Konark Sun Temple wheel, stacked in layers so it has real thickness, turning slowly on its axle and tilting so the carved edge shows. Hidden on phones. Change `LAYERS` in the `/* Hero: 3D Konark chakra */` script for a thicker or thinner wheel, and `chakraTurn` (45 s per turn) / `chakraSway` (14 s tilt) in the CSS for its speed.
- **Glowing circuit lines** on the hero: light pulses travel along the road lines and side circuit traces, all converging on the centre of the campus gate, which glows and pulses. The lines are built by script in the `/* Hero: glowing lines converging on the gate */` block. Change `VX, VY` to move the meeting point, or edit the trace list to add or remove lines.
- **"What is KAOS?"** section with the mandala, circuit and temple artwork.
- **Event cards** for Day 1 (Engineering Challenge), Day 2 (Project Expo) and Prizes (₹20,000).
- **Responsive layout:**
  - Desktop matches the original design pixel for pixel.
  - Phones get a ☰ menu and stacked sections.
- **Accessible:**
  - All text is real HTML (not baked into images), and the images have alt text.
  - The intro can be skipped.
  - Visitors with *Reduce motion* turned on skip the intro automatically.

---

## Project structure

```
kaos-of-circuit-2.0/
├── index.html               # The whole site: markup, styles (in <style>) and scripts (in <script>)
├── README.md
└── assets/
    ├── hero-bg.jpg          # Hero artwork, with the text removed so live HTML text sits on top
    ├── kaos-logo.png        # KAOS logo (blended onto the cream hero with mix-blend-mode: multiply)
    ├── kaos-logo-light.png  # Transparent light version of the logo, used in the dark intro
    ├── nav-logo.png         # Small logo in the navigation bar
    ├── mandala.png          # Full mandala (mirrored from a hand-drawn half), used in the intro
    ├── chakra.png           # Konark wheel cut out of a photo (gaps between the spokes are transparent)
    ├── about-art.jpg        # Mandala, circuit and temple artwork for the About section
    ├── card-pcb.jpg         # Day 1 card illustration
    ├── card-expo.jpg        # Day 2 card illustration
    └── card-trophy.jpg      # Prizes card illustration
```

---

## Running it

**Quickest way:** double-click `index.html` and it opens in your browser.

**With a local server** (closer to how it behaves once deployed), run this inside the folder:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. `npx http-server` or the VS Code *Live Server* extension also work.

> The site loads the **Montserrat** font from Google Fonts. Offline it still works, but falls back to the system sans-serif font.

---

## Deploying

Upload the folder as-is to any static host. Keep `assets/` next to `index.html`.

| Host | How |
|------|-----|
| **GitHub Pages** | Push the files to a repo → *Settings → Pages* → deploy from the `main` branch, root folder |
| **Netlify** | Drag and drop the folder onto <https://app.netlify.com/drop> |
| **Vercel** | `npx vercel` inside the folder, or import the repo on vercel.com |

---

## Customising

Everything lives in `index.html`.

### Colours
Change the CSS variables at the top of the `<style>` block:

```css
:root{
  --ink:#070908;    /* nav bar / dark background */
  --cream:#eedfc8;  /* page background */
  --card:#e6d6bc;   /* card background */
  --red:#e2412a;    /* accent red */
  --text:#1a1513;   /* body text */
}
```

### Text
Search for the text you want to change, for example `Engineering Challenge`, `₹20,000` or `TWO DAYS`. It's all plain HTML.

### Links and sections
The nav links point to these section IDs:

| Link | Target | Status |
|------|--------|--------|
| Home | `#home` | ✅ hero |
| About | `#about` | ✅ About section |
| Events | `#events` | ✅ cards |
| Prizes | `#prizes` | ✅ prize card |
| Schedule, Rules, FAQ, Register Now | `#schedule`, `#rules`, `#faq`, `#register` | ⚠️ placeholders. Add sections with these IDs, or point the links at real pages (e.g. a Google Form for registration) |

### Intro animation
- **Length:** the intro closes itself after `7100` ms. Change the value in `setTimeout(finish, 7100)` in the script at the bottom of the file.
- **Stages:** each stage's timing is set by the `animation` delays in the `/* ============ INTRO ============ */` CSS block:

  | Stage | CSS rule | Starts at |
  |-------|----------|-----------|
  | Circuit lines meet | `.intro-traces .main` | 0.1 s (lines reach the centre at ~1.2 s) |
  | Spark and ring | `.i-spark`, `.i-ring` | 1.2 s |
  | Mandala blooms | `.i-mandala` → `bloom` | 1.25 s |
  | Mandala fades back | `.i-mandala` → `recede` | 3.5 s |
  | "Presents" text | `.i-presents` | 3.7 s |
  | Logo reveal | `.i-logo` → `wipe` | 4.1 s |
  | Tagline words | inline `animation-delay` on each `<span>` | 5.1–5.7 s |
  | Loading bar | `.i-bar span` | 5 s |

- **Play once per visit:** to show the intro only on a visitor's first page load in each browser session, replace the first `<script>` in `<head>` with:

  ```html
  <script>
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !sessionStorage.getItem('kaosIntroSeen')) {
      document.documentElement.classList.add('intro-on');
      sessionStorage.setItem('kaosIntroSeen', '1');
    }
  </script>
  ```

- **Remove the intro:** delete the `<div id="intro">…</div>` block and the first `<script>` in `<head>`.

### Images
To swap in new artwork, replace a file in `assets/` with one of the same name and aspect ratio. The hero text is positioned to match `hero-bg.jpg` (1292 × 410). If you use higher-resolution art, keep the same proportions.

---

## Notes

- The artwork was taken from a single design mockup that is 1292 px wide. It looks sharp at normal laptop widths and slightly soft on very large screens. Replacing the files in `assets/` with high-resolution originals fixes this.
- `mandala.png` was made by mirroring a hand-drawn half mandala into a full circle. `chakra.png` was cut out of a photo of the Konark Sun Temple wheel. If those source images came from Pinterest or another site, check their licences before publishing.
- Works in all current browsers: Chrome, Edge, Firefox and Safari. It uses CSS container query units (`cqw`), supported since 2023.

---

© 2026 KIIT Electrical Society · KAOS of Circuit 2.0
