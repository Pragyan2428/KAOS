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
  - gentle **mouse parallax**: the banner drifts slightly as the mouse moves;
  - glowing **embers** drifting up from the road (a `<canvas>`; it pauses when the hero is scrolled out of view);
  - the **sun breathes** with a soft halo, and faint **light rays** turn slowly behind it.
  All of it switches off for visitors with *Reduce motion* turned on. Change the number of embers in `Array.from({ length: 46 }, …)`.
- **Glowing Konark wheel**: the wheel painted into the banner lights up: two comets of light chase around its rim and pulses run out along the spokes from a glowing hub (`#hgWheel` in the hero SVG).
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
├── index.html               # The website: markup, styles (in <style>) and scripts (in <script>)
├── login.html               # Organiser login
├── admin.html               # Admin panel
├── super-admin.html         # Super Admin panel
├── README.md
├── css/
│   └── panel.css            # Styles for the login and admin pages
├── js/
│   ├── store.js             # Demo data (registrations, accounts, settings, log) + demo accounts
│   ├── auth.js              # Demo sign-in, sessions and role checks
│   └── panel.js             # Everything inside the admin / super admin panels
└── assets/
    ├── hero-bg.jpg          # Hero artwork, with the text removed so live HTML text sits on top
    ├── kaos-logo.png        # KAOS logo (blended onto the cream hero with mix-blend-mode: multiply)
    ├── kaos-logo-light.png  # Transparent light version of the logo, used in the dark intro
    ├── nav-logo.png         # Small logo in the navigation bar
    ├── mandala.png          # Full mandala (mirrored from a hand-drawn half), used in the intro
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

## Organiser pages: login, Admin and Super Admin

> ⚠️ **These pages are a front-end demo.** GitHub Pages only serves static files, so there is no server:
> passwords are checked in the browser and all data is saved in that browser's `localStorage`.
> Anyone who reads the source can get in, and data isn't shared between devices.
> **Don't put real participant data in it** until a backend is connected (see below).

Open `login.html`, or use the **Organiser login** link in the website's footer.

### Demo accounts
Listed at the top of [`js/store.js`](js/store.js): one Super Admin and two Admins. The login page also has buttons that fill them in.
Change or remove them before going live.

### What each role can do

| | Admin (`admin.html`) | Super Admin (`super-admin.html`) |
|---|:---:|:---:|
| Dashboard: totals, registrations-per-day chart, by-event breakdown, recent activity | ✅ | ✅ |
| Registrations: search, filter, verify / reject, view details, export CSV | ✅ | ✅ |
| Delete a registration | — | ✅ |
| Announcements: publish, delete own | ✅ | ✅ (delete any) |
| Admin accounts: add, change role, disable / enable, reset password, delete | — | ✅ |
| Event settings: open/close registrations, prize pool, dates, venue, contact | — | ✅ |
| Activity log: every sign-in and change, filterable by person | — | ✅ |
| Reset demo data | — | ✅ |

- Admins who try to open `super-admin.html` are sent back to the login page with an explanation.
- There must always be at least one active Super Admin, and you can't delete or disable your own account.
- **Settings reach the website:** the prize amount on the Prizes card and the *Register Now* button
  (which becomes *Registrations Closed*) follow the Super Admin's settings.

### Making it real
Only `js/store.js` and `js/auth.js` touch data and sign-in; the pages talk to `KAOS.store` and `KAOS.auth` only.
To go live, replace those two files with a real backend, for example:
- **Firebase**: Firebase Authentication for sign-in, Firestore for data, and custom claims (`role: 'admin' | 'superadmin'`) enforced in Firestore security rules.
- **Supabase**: Supabase Auth plus Postgres tables with Row Level Security policies per role.

Role checks **must** be enforced on the server or database side; the checks in the browser are only for showing the right screens.

---

## Notes

- The artwork was taken from a single design mockup that is 1292 px wide. It looks sharp at normal laptop widths and slightly soft on very large screens. Replacing the files in `assets/` with high-resolution originals fixes this.
- `mandala.png` was made by mirroring a hand-drawn half mandala into a full circle. If that source image came from Pinterest or another site, check their licences before publishing.
- Works in all current browsers: Chrome, Edge, Firefox and Safari. It uses CSS container query units (`cqw`), supported since 2023.

---

© 2026 KIIT Electrical Society · KAOS of Circuit 2.0
