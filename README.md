# CVinBio

**Turn Your CV into a Professional Website**

CVinBio is a modern, ultra-minimalist web application that transforms traditional PDF CVs into beautiful, shareable, and intensely professional online portfolios natively hosted on your own unique URL. Bypassing clunky templates, this platform mathematically restructures your credentials into a crisp, high-performing digital identity.

## 🚀 Key Features

*   **📄 Algorithmic CV Parsing:** Upload an arbitrary PDF CV and the backend uses an advanced local heuristic text-extraction engine (`pdf-parse`) to instantly map, categorize, and seamlessly structure your personal information, work history, education, and skills.
*   **🎨 Aggressive Minimalism:** The frontend deploys a highly disciplined monochromatic design system (Inter font, stark whitespace, tight tracking, zero drop-shadows) specifically engineered to mimic the aesthetic of a premium SaaS application or high-end digital business card. *(No messy themes or templates required)*
*   **⚡ Edge-Computed Link Previews (OpenGraph):** When sharing your `cvinbio.com/[slug]` URL on LinkedIn or Twitter/iMessage, Next.js natively utilizes the Edge Runtime (Satori) to physically draw a perfectly symmetrical, personalized `1200x630` PNG image in microseconds containing your avatar, name, and job title.
*   **🔐 Supabase Architecture:** Completely integrated into a hardcore PostgreSQL backend utilizing strictly bound Row Level Security (RLS) and GoTrue Auth to permanently secure and seamlessly sync your professional edits in real-time.
*   **✏️ Frictionless Editor:** A fully dynamic client-side interface allowing you to instantly restructure your extracted logic, upload compressed avatars, and rewrite work summaries effortlessly.

## 🛠️ Tech Stack

This project strictly utilizes a bleeding-edge, type-safe, and highly-performant production stack:

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components, Turbopack)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI & Styling:** [Tailwind CSS v3](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Auth)
*   **PDF Extraction Engine:** `pdf-parse` mapping custom RegEx structures
*   **Image Generation:** [Next/OG](https://vercel.com/docs/functions/og-image-generation) (Satori Edge computing)

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── [slug]/                   # Public Candidate Profile routes
│   │   │   ├── page.tsx              # Clean Server Component fetching public profiles
│   │   │   └── opengraph-image.tsx   # Edge rendering script natively drawing the SVG/PNG previews
│   │   ├── editor/                   # Authorized CV editing interface
│   │   ├── api/parse-resume/         # Local algorithmic RegEx parsing route
│   │   ├── opengraph-image.tsx       # Root landing page dynamic fallback preview
│   │   ├── page.tsx                  # Primary Landing interface
│   │   └── layout.tsx                # Symmetrical Universal UI boundaries
│   │
│   ├── components/                   # Shadcn UI atoms and universal Header elements
│   ├── lib/                          # Server utilities (Supabase Admin, Heuristics arrays)
│   ├── utils/                        # Client-side Supabase Browser constructors
│   └── types/                        # Strict universal TypeScript interfaces
│
├── docs/                             
│   └── design_guidelines.md          # Internal Brand identity and AI Prompts rules
└── ...
```

## 🏗️ Getting Started Locally

To run CVinBio perfectly locally, you will strictly only need a Supabase Database instance.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a new `.env.local` file strictly mapping your keys into the repository root:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
    ```

3.  **Boot Development Server**:
    ```bash
    npm run dev
    ```

The application strictly renders natively on `http://localhost:3000`.

---
*Built with strict mathematical geometry and aggressive minimalism.*
