---
name: Rainbow Park Collection
description: A clear visual tour through place, land, homes, and the regional dossier.
colors:
  ink: "#202621"
  blue: "#705b2b"
  water: "#e9ece4"
  paper: "#fafaf7"
  soft: "#eff0eb"
  line: "#c5c9be"
  sun: "#ebdfbb"
  white: "#fff"
  ink-hover: "#3e493e"
  secondary-hover: "#e7e9e0"
  navigation-accent: "#d9bd76"
  dossier-paper: "#f8f8f3"
  studio-ground: "#e8ebe5"
  model-ground: "#e5eeeb"
  muted: "#56634f"
typography:
  display:
    fontFamily: "Barlow, Manrope, sans-serif"
    fontSize: "clamp(80px,8.3vw,96px)"
    fontWeight: 500
    lineHeight: 0.86
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow, Manrope, sans-serif"
    fontSize: "48px"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.015em"
  reading:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.9
  reading-title:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
  control:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  square: "0px"
  control: "3px"
  field: "5px"
  film: "30px"
spacing:
  control-gap: "12px"
  reading-gap: "25px"
  section-gap: "30px"
  spread-gap: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
  text-action:
    rounded: "{rounded.square}"
    padding: "10px 0"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "12px"
  consultation-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px"
  indicator-tab:
    backgroundColor: "#e4e7dd"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  indicator-tab-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
  selection-sheet:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.square}"
    padding: "30px"
---

# Design System: Rainbow Park Collection

## Overview

**Creative North Star: "Recorrido visual de Rainbow Park"**

A clear visual tour moves from landscape to individual land parcels, house models, and a readable regional dossier. Large imagery supplies atmosphere; explicit destination names, counters, indexes, and previous/next arrows explain where the visitor is and what comes next. Copy is direct and complete rather than mysterious or exaggerated.

Condensed display lettering pairs with restrained Manrope reading text. Graphite, natural off-white, and gray-green surfaces replace the previous blue-led identity. The system uses calm contrast, mostly square geometry, and direct, unanimated view changes to make a guided sequence understandable without hiding the underlying information.

**Key Characteristics:**

- Large scene imagery with explicit destination labels.
- Condensed headings and readable, structured dossier text.
- Subdued graphite, off-white, and gray-green surfaces.
- Persistent route navigation and directional previous/next controls.

This is a scan of the active cascade: `styles.css` supplies base styles and `experience.css` overrides them. The final reading and focus refinements in `experience.css` take precedence. `scenes.js`, `dossier.js`, and `app.js` define the live interaction patterns. User authorization explicitly replaces the rejected visual world.

## Colors

### Primary

**Graphite ink** anchors text, the persistent header, selected controls, and forward actions. **Graphite hover** lightens primary controls on hover.

### Secondary

**Warm focus accent** is the value of the retained CSS variable named `blue`; it is now muted brown, not a blue brand color. It marks focus and text-action hover. **Navigation accent** supplies the header's active underline and consultation count. **Pale sand** is reserved for notices and restrained accents.

### Neutral

**Natural paper** is the global ground. **Water**, despite its legacy token name, is now gray-green, as are **soft** and **studio ground**. **Dossier paper** supports sustained reading, **white** separates controls and consultation sheets, and **sage line** supplies thin boundaries. **Muted** supports secondary reading metadata. **Model ground** preserves the existing poster background.

Literal blue pins and yellow cadastral overlays remain data annotations in the geographic view; they are not general interface accents. Keep their legend explicit. Color ramps in the sidecar are synthesized preview aids, not additional production tokens.

**The Subdued Palette Rule.** Keep brand surfaces quiet; use strong color contrast to identify controls and information, not decorative emphasis.

## Typography

The locally bundled Barlow Condensed medium file is registered under the CSS family name `Barlow`. It is used for scene headings, house names, dates, and large statistical values. Manrope remains the local reading and control family, with regular, semibold, and bold weights.

The opening title uses the display token; general headings use the headline token, with deliberate scene-specific sizes. House names reach 90px on desktop. Dossier project headings are 46px after the final refinement; project and market body paragraphs are 14px with a 1.9 line height, and their small subheadings are 15px. At 550px and below these become 41px, 13px, and 14px respectively. Sources use 14px link text and 12px metadata, reduced to 13px and 11px on phones. Do not reintroduce the earlier, superseded 12px dossier body styles.

Paragraphs retain a maximum width of 70ch where not overridden. Comparison tables retain tabular numerals. Compact navigation and metadata are intentionally distinct from the main reading hierarchy; clipped or unreadably small text should be corrected, not treated as an identity rule.

## Layout

A sticky graphite header anchors the top of the experience. The fixed white tourbar anchors the bottom, with previous action, segmented progress, and a forward action. Desktop heights are 78px and 76px; page padding reserves room for the tourbar. The arrival scene fills the remaining viewport and pairs a project title with explicit destination links over a full-frame landscape.

The territory scene pairs a large photograph with copy and local stop controls. The house studio uses a 260px information column beside a large model presentation; comparison and detailed plans open as separate reading areas. The dossier uses a 195px chapter rail and a flexible reading region, with sticky pagination above its content. Project spreads place key facts beside narrative; source, timeline, and evaluation views maintain their own clear reading structures.

The 1000px breakpoint compresses columns and gaps. At 850px the header wraps, the dossier index becomes a wrapping row, and pagination accounts for the taller header. At 550px scenes and reading spreads stack; the model precedes its caption; the lot filter becomes a horizontal rail; the bottom bar becomes 70px high. Reading scroll offsets are 88px, 126px, and 122px for desktop, tablet, and phone. Wide screens above 1650px receive calculated side gutters on major reading surfaces.

## Elevation & Depth

Scenes, model stages, dossier spreads, and consultation sheets remain flat. Thin strokes and tonal changes organize content. A subtle upward shadow (`0 -3px 18px #20262112`) separates the fixed tourbar from scrolling content. The base transient toast retains its soft shadow. The opening image has dark translucent gradient overlays for text contrast; these are photographic legibility treatments rather than decorative surface gradients.

## Shapes

Primary controls have nearly square corners. Forms in the consultation surface are square; other inherited fields retain modest rounding. The film trigger is a restrained outlined pill. Map and model presentation surfaces are square. Large asymmetric photographic corners from the rejected design are not a reusable rule for the new scene system.

## Components

### Actions and fields

Primary actions use graphite and white; secondary actions use white, graphite text, and a sage border. Standard buttons retain a 48px minimum height. Text actions use a bottom rule and a right-arrow icon. Shared keyboard focus uses a 3px warm accent outline with 5px offset. Disabled loading controls retain reduced opacity. Fields preserve visible labels and borders; consultation textareas resize vertically.

### Tour navigation

The persistent tourbar supplies previous/next labels, arrows, and segmented progress. The next destination receives a graphite background. The top route navigation marks the active route with a warm underline. The consultation count remains a discrete badge. Arrow icons communicate direction alongside text, rather than replacing destination names.

### Territory and studio selectors

Territory stops use previous/next icon buttons, a count, and named tabs. House tabs expose Utah and Bell by name with area metadata; the selected tab is graphite with white text. Indicator chips similarly use pressed state and strong selected contrast. Keep aria-pressed synchronized with the visible selection.

### Dossier reading panels

A chapter index, project chooser, local count, and previous/next controls support both sequential reading and direct access. Project records distinguish title, metric, date, status, explanation, and source details. Verification notes use a quiet gray-green panel; they remain visible without overwhelming the narrative. Source lists use text hierarchy and dividing lines rather than boxed cards.

### Model and comparison surfaces

The large house poster is shown at its natural appearance: the final refinement sets normal blending on a pale model ground. Plans and comparison tables remain available alongside optional, user-initiated 3D. White square panels group details. Captions distinguish presentation imagery from constructed homes.

### Motion

Route and local scene changes are immediate, without View Transitions or entry animations. Scroll resets instantly during the synchronous route render. Destination links do not shift on hover. This follows the user’s request to remove the remaining transition.

**The Clear Sequence Rule.** Every step exposes its destination or position and provides a direct, labelled way to continue or revisit information.

## Do's and Don'ts

### Do:

- **Do** use explicit project, destination, and chapter names with previous/next navigation.
- **Do** preserve the final dossier reading sizes and source hierarchy.
- **Do** keep large scene imagery, plans, and evidence captions connected.
- **Do** respect reduced motion and retain visible keyboard focus.

### Don't:

- **Don't** restore the rejected bright blue-led brand surfaces or exaggerated mystery copy.
- **Don't** replace complete project information with teaser-only cards.
- **Don't** bring back oversized asymmetric corners as the default image treatment.
- **Don't** use autoplay, animation, or 3D as the only way to reach important information.


## Automatic house viewer
The first house view displays the actual GLB, loaded automatically for Utah or Bell. A persistent instruction strip explains dragging and zooming. Camera and roof controls provide an alternative to gestures. Mobile puts the viewer before the house facts. The loading state occupies the same reserved space; failure offers retry and the original PDF. Changing models or leaving the route disposes the renderer and guards against stale loads. The detail button opens plans only; there is no load-model gate.


## Exploration refinements
Arrival destinations use a dark bottom-to-top fading hover and keyboard-focus surface, with soft side edges and no text displacement. The place visit centers its image and text, with destination tabs in a shared row below. Its final action leads to the collection overview. Parcels begin with the supplied aerial georeferenced to all 13 locations, separated labels for clustered pins, a regional map link and explicit lot selection. Dossier projects are introduced as third-party regional context. Typography remains unchanged pending the user reference.


## Integration as proposal D
Imported from Diseñar experiencia web Rainbow Park. All compiled scripts, local fonts and Three.js dependencies included. 35 media/data assets refreshed from the existing project. Comparison navigation maps houses/investment/contact to casas/dossier/consulta. Original style is preserved in champagne; navy is an optional comparison override.
