# CVinBio — Design Integrity & Layout Guidelines

The CVinBio functional interface relies on extremely strictly disciplined, ultra-minimalist geometric mechanics. The entire UI is built mathematically to instantly convey premium, clean structural authority avoiding any generic "drag-and-drop template" aesthetics.

## Core Philosophical Alignment
1. **Aggressive Minimalism**: Zero redundant verbiage, zero unnecessary gradients, and absolutely no complex shadow depths. Structural integrity comes from strict mathematical spacing, not visual "fluff."
2. **Symmetrical Geometry**: Components implicitly must mathematically perfectly bridge columns perfectly horizontally spanning viewport boundaries. Never let arbitrary text sizes dictate horizontal planes—always force structural CSS limits (e.g. `max-w-xl`, strict `px-8` bounding limits). 
3. **Professional Edge**: Everything rendered from CVinBio to the candidate's custom URL must look aggressively sharp mirroring exactly high-end digital business cards.

---

## 1. Typography & Text Geometry
The primary font engine is explicitly mapped leveraging Google's **Inter** (via `next/font`), strictly optimizing its highly legible numeric glyph spacing configurations globally. 

- **Titles / Headers (`H1`, `H2`)**:
  - Always utilize intense weight profiles: `font-bold` to `font-extrabold` (700-800).
  - Actively crush the native letter spacing mapping tightly tracking parameters inherently natively: `tracking-tighter` or `letterSpacing: '-0.05em'`. 
  - Ex: "Turn Your CV into a Website" is strictly un-wrapped unyielding text tightly compressed inside extreme titles.

- **Subtext / Helper Strings (`p`, `span`)**:
  - Never utilize standard black text. Always map explicitly into `text-muted-foreground` (`#71717A` generic offsets).
  - Explicitly restrict numeric text values identically into strictly contained boundaries. Example: Shrink input component layouts using extremely compact fonts: `text-[10px]` cleanly mathematically maximizing mobile row efficiencies.

---

## 2. Spatial Layout & Layout Symmetry 
- **Universal Flow Coordinates**:
  - Unyielding Horizontal Blocks: Components that belong on a horizontal plane (like Header titles and buttons) must be fundamentally strictly locked inside geometric `flex items-center justify-between` wrappers explicitly excluding wildcard `.flex-wrap` properties. If they expand, they clip safely gracefully; they never jump layout planes cascading destructively onto secondary lines.
- **Grids**: 
  - Standard repetitive dataset arrays (i.e. 'Job Readiness' checkboxes, input variable maps) implicitly strictly enforce mathematical column blocks utilizing `grid-cols-2` scaling linearly onto `lg:grid-cols-3` strictly preventing vertical screen hemorrhage on small displays.

---

## 3. UI Component Boundaries (Inputs / States)
- **Input Interactions**: 
  - Form validations natively dynamically display minimalistic status feedback dynamically exclusively via structural CSS states explicitly tracking active events: e.g.`focus-visible:ring-2 focus-visible:ring-ring`. 
- **Action Buttons / SVGs**: 
  - Never utilize redundant textual descriptions if a universal native SVG icon vector dictates semantic meaning correctly (e.g., `<Loader2 />` strictly replaces "Saving..." text blocks globally avoiding chaotic width shifting during async renders).

---

## 4. Metadata & External Rendering (Open Graph)
When parsing external parameters mapping URL configurations to platforms like Twitter, iMessage, and LinkedIn:
- The system fundamentally ignores static JPG fallbacks entirely dynamically mapping purely custom DOM layouts generating raw PNGs natively mapped inside edge compute variables (`next/og`). 
- **Design rules for OpenGraph Canvas**:
  - Off-white geometric boundaries (`#ffffff` core base, strictly parsing `70px` perimeter padding values).
  - Exact uniform mapping matching the app's DOM (Inter default generic sans-serif, bold `800` names strictly mapping sizes `-0.05em` tight kerning logically).
  - Circle-cropped custom image avatars mathematically constrained avoiding skewed aspect ratios `objectFit: 'cover'`.

---

## 5. Universal Design / Asset Prompt (For AI Generators & Designers)
If you need to generate any marketing materials, social media posts, posters, or digital assets related to CVinBio, copy and paste this exact prompt to ensure absolute brand consistency:

**[COPY BELOW]**
> "Generate a visual design asset for a professional software platform called 'CVinBio', a tool that instantly turns traditional PDF resumes into live, beautifully structured portfolio websites. 
> 
> The brand identity strictly follows an 'Aggressive Minimalism' philosophy. The aesthetic must be extremely clean, utilizing a monochromatic core palette (stark whites `#FFFFFF`, deep blacks `#09090B`, and subtle muted sophisticated grays `#71717A` or `#FAFAFA`). Absolutely NO excessive gradients, heavy drop-shadows, or chaotic overlapping elements.
>
> Typography should appear to be Inter or a similar highly-legible modern geometric sans-serif. Utilize intense font weights (Bold/800) with exceptionally tight letter-spacing (kerning) for primary headers to convey premium, structural authority. Subtext should be noticeably smaller and muted in color to establish an extreme visual hierarchy.
>
> The layout itself must be mathematically rigid and symmetrical. All elements must perfectly align to a strict matrix or grid, utilizing generous, purposeful negative space (whitespace) instead of bounding boxes to separate content. UI representations (if included) should feature stark contrast, unyielding single-line horizontal blocks, and perfectly circular cropped portrait avatars strictly avoiding any skewed geometry. 
>
> The ultimate emotional tone of the asset should feel like a premium, high-end digital business card or an elite enterprise SaaS tool: functional, hyper-crisp, authoritative, and completely devoid of visual fluff."
