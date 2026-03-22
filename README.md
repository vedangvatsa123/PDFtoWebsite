# CVin.Bio

CVin.Bio generates web profiles from CV documents using AI. Users upload their CVs, and the application extracts and routes the structured data into an editable profile hosted at a custom URL.

## 🚀 Key Features

*   **📄 AI CV Parsing:** Upload a CV; the backend uses data extraction (`pdf-parse`) to categorize and store the user's personal information, work history, education, and skills.
*   **🎨 Structural Rendering:** Generates a consistent, monochrome profile mapping without relying on manual themes.
*   **⚡ OpenGraph Edge Generation:** Next.js uses the Edge Runtime (Satori) to automatically generate dynamic `1200x630` PNG social previews mapping the user's routing URL and avatar metrics.
*   **🔐 Supabase Integration:** Connects to PostgreSQL using Row Level Security (RLS) and GoTrue Auth to persist user edits.
*   **✏️ Data Editor:** A client-facing configuration dashboard to mutate work summaries, upload new media, and re-order data arrays.

## 🛠️ Tech Stack

*   **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI & Styling:** [Tailwind CSS v3](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL & Auth)
*   **Image Generation:** [Next/OG](https://vercel.com/docs/functions/og-image-generation)

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

To run CVin.Bio perfectly locally, you will strictly only need a Supabase Database instance.

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
