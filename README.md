# PDFtoWebsite: Your Resume, Reimagined as a Website

PDFtoWebsite is a web application that transforms a standard PDF resume into a beautiful, shareable, and professional online portfolio. Stop sending PDF attachments and start sharing a dynamic web profile that you can customize and track.

This project is built with a modern, full-stack TypeScript setup, leveraging Next.js for the frontend and **Supabase** for the backend services.

## Key Features

- **📄 PDF Resume Parsing**: Upload your resume in PDF format, and the application will automatically parse the content, extracting key sections like personal information, work experience, education, and skills.
- **✏️ Rich Content Editor**: Easily edit the parsed content or rewrite summaries. The editor saves your changes automatically in real-time.
- **📊 Analytics Dashboard**: Get insights into your profile's performance with a built-in dashboard that tracks total views.
- **🎨 Customizable Themes**: Choose from multiple visual themes to personalize the look and feel of your public profile page.
- **🔗 Shareable Public URL**: Get a unique, customizable URL (e.g., your-portfolio.com/your-name) to share with recruiters, colleagues, and on your social media.
- **⚡ Supabase Integration**: Built on a robust, PostgreSQL-powered backend using Supabase Authentication for secure user management and Row Level Security (RLS) for data privacy.

## Tech Stack

This project uses a modern, type-safe, and performant tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL & GoTrue Authentication)
- **Deployment**: [Vercel](https://vercel.com/)
- **Charts & Data Viz**: [Recharts](https://recharts.org/)

## Project Structure

Here is a high-level overview of the most important files and directories:

```
/
├── src/
│   ├── app/
│   │   ├── [slug]/page.tsx      # The public, dynamic profile page for a user.
│   │   ├── editor/page.tsx      # The main editor dashboard where users manage their profile.
│   │   ├── api/parse-resume/    # API route for handling PDF resume parsing.
│   │   ├── page.tsx             # The application's landing page.
│   │   └── layout.tsx           # The root layout with Supabase context provider.
│   │
│   ├── components/
│   │   ├── ui/                  # Reusable UI components from ShadCN.
│   │   ├── header.tsx           # The main site header.
│   │   └── login-dialog.tsx     # The authentication dialog using Supabase.
│   │
│   ├── auth/
│   │   └── index.tsx            # Supabase Auth context provider and hooks.
│   │
│   ├── lib/
│   │   ├── supabase-server.ts   # Secure server-side data fetching from PostgreSQL.
│   │   └── auth-utils.ts        # Handlers for auth errors.
│   │
│   ├── utils/
│   │   └── supabase/            # Client and Server utility constructors for Supabase SSR.
│
├── package.json                 # Project dependencies and scripts.
└── next.config.ts               # Next.js configuration file.
```

## How It Works

1.  **Upload**: A user uploads their PDF resume on the homepage.
2.  **Parse**: The PDF is sent to a server API endpoint (`/api/parse-resume`) which extracts the text content and structures it into JSON.
3.  **Edit**: The user is taken to the editor, where the parsed information populates the forms. The user can then edit, add, or delete sections. All changes are automatically synced to the Supabase Postgres database.
4.  **Publish & Share**: The user can customize their public URL and share it. When someone visits the URL, the page safely fetches the user's profile data from Supabase and renders it.
5.  **Track**: The user can visit their dashboard in the editor to see how many views their profile is getting.

## Getting Started

To run this project locally, you will need Node.js and npm installed.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env.local` file in the root directory and add your Supabase details:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

### Database Setup

The project requires a Supabase PostgreSQL database with a `profiles` table. The table should contain the following columns natively matching the `UserProfile` schema, and have Row Level Security enabled to ensure users can only modify their own profiles.
