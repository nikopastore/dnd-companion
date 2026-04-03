# Design System Document

## 1. Overview & Creative North Star: "The Digital Tomes"
The Creative North Star for this design system is **The Digital Tome**. We are moving away from the cluttered, "spreadsheet-heavy" look of traditional RPG tools toward a high-end editorial experience. This system treats the user interface not as a software dashboard, but as a living, magical artifact. 

We break the "template" look by using **intentional asymmetry**: stats may be offset, and character portraits should break the bounds of their containers. We utilize **tonal depth** and **overlapping elements** to create a sense of physical mystery. This is a premium, immersive environment where information isn't just displayed—it is curated.

---

## 2. Colors & Surface Philosophy
The palette is built on a foundation of deep, atmospheric charcoals and parchment-inspired neutrals, punctuated by royal crimsons and metallic golds.

### Tonal Surface Hierarchy
*   **Background:** `#0e1418` (The deep void of the dungeon).
*   **Surface:** `#0e1418` (The base canvas).
*   **Surface-Container-Low:** `#161c20` (Subtle sectioning).
*   **Surface-Container-High:** `#252b2f` (Interactive elements).
*   **Primary (Crimson):** `#ffb3ad` (Accent) / `#a52a2a` (Container).
*   **Secondary (Gold):** `#e9c349` (Focus/Importance).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections. Layouts must be structured through background color shifts. For example, a character's "Feats" section should sit on a `surface-container-low` background against the `surface` main page. Boundaries are felt, not seen.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of fine, heavy paper. Use the `surface-container` tiers (Lowest to Highest) to create depth. An inner stat block should be `surface-container-highest` nested within a `surface-container-low` pane. This "nesting" creates a natural focal point without visual clutter.

### The "Glass & Gradient" Rule
To evoke a magical feel, use **Glassmorphism** for floating overlays (e.g., Modals or Level-up prompts). Use `surface` colors at 80% opacity with a `20px` backdrop blur. 
*   **Signature Gradients:** For primary CTAs, use a subtle radial gradient transitioning from `primary` (#ffb3ad) to `primary-container` (#a52a2a) to simulate the glow of a ruby under candlelight.

---

## 3. Typography: The Editorial Voice
We utilize a high-contrast pairing: a cinematic Serif for lore and storytelling, and a precision Sans-Serif for mechanics and data.

*   **Display & Headlines (Noto Serif):** These are your "Manuscript" headers. Use `display-lg` for character names and `headline-md` for section titles. The serif nature evokes the history of fantasy tomes.
*   **Titles & Body (Inter):** Used for readability in dense stat blocks. `title-md` is for attribute labels (STR, DEX), while `body-md` handles spell descriptions. 
*   **Labels (Inter):** Small, all-caps labels (`label-sm`) should be used for secondary meta-data (e.g., "WEIGHT," "RANGE") to maintain a clean, modern aesthetic amidst the fantasy styling.

---

## 4. Elevation & Depth
In this design system, shadows are light, and surfaces are heavy.

*   **The Layering Principle:** Avoid "Drop Shadows" on standard cards. Instead, use Tonal Layering. A `surface-container-lowest` card placed on a `surface-container-low` section creates a "recessed" look, suggesting the card is carved into the interface.
*   **Ambient Shadows:** For floating elements like context menus, use a "Whisper Shadow": `blur: 32px`, `opacity: 6%`, using a tinted version of the `on-surface` color.
*   **The Ghost Border:** If a boundary is required for accessibility, use a "Ghost Border" using `outline-variant` at 15% opacity. Never use 100% opaque lines.
*   **Gold-Rimmed Accents:** Reserve a `1px` solid border of `secondary` (Gold) specifically for high-tier items or "Active" states to denote legendary importance.

---

## 5. Components

### Buttons
*   **Primary:** Crimson gradient (`primary-container`) with a `secondary` (Gold) ghost border. Roundedness: `sm` (0.125rem) for a sharp, chiseled look.
*   **Secondary:** `surface-container-highest` fill with `on-surface` text. No border.

### Chips (Conditions & Tags)
*   **Selection Chips:** Use `surface-container-high`. When selected, transition to `primary-container` with a subtle `secondary` glow.
*   **Shape:** Use `full` (pill-shaped) for tags like "Concentration" or "Ritual."

### Input Fields
*   **Styling:** Minimalist. No bottom line. Use a `surface-container-highest` background with `rounded-sm` corners. 
*   **Focus State:** The background remains static, but a `secondary` (Gold) "Ghost Border" appears at 40% opacity.

### Cards & Lists
*   **The Divider Prohibition:** Forbid the use of horizontal divider lines. Separate list items (like Spells or Inventory) using `8px` (spacing scale `2`) of vertical whitespace or alternating `surface` and `surface-container-low` backgrounds.

### Specialized Components
*   **Attribute Orbs:** Use `secondary-container` backgrounds for Strength/Dexterity scores, utilizing a circular shape with a `secondary_fixed` glow to highlight the "Epic" nature of the stats.
*   **Health Bars:** Avoid flat bars. Use a textured gradient from `primary` to `error_container` with a "paper grain" overlay.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., more padding on the left than the right) for "Lore" sections to mimic a handwritten journal.
*   **Do** apply a subtle paper texture overlay (multiply at 5% opacity) to all `surface-container` elements.
*   **Do** use `notoSerif` for numbers that represent narrative power (e.g., Level, Armor Class).

### Don’t:
*   **Don’t** use pure black (#000000). Use `surface_container_lowest` (#090f13) for the darkest shadows.
*   **Don’t** use standard "Material Design" rounded corners (e.g., 8px). Stick to `sm` (2px) or `none` to maintain a "hand-cut" feel.
*   **Don’t** crowd the screen. If a page feels full, increase the spacing scale from `4` to `8` and introduce a nested scroll. High-end experiences require "breathing room."