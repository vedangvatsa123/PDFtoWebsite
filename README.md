# PDFtoPortfolio: Your Resume, Reimagined as a Website

PDFtoPortfolio is a web application that transforms a standard PDF resume into a beautiful, shareable, and professional online portfolio. Stop sending PDF attachments and start sharing a dynamic web profile that you can customize and track.

This project is built with a modern, full-stack TypeScript setup, leveraging Next.js for the frontend and Firebase for the backend services.

## Key Features

- **📄 PDF Resume Parsing**: Upload your resume in PDF format, and the application will automatically parse the content, extracting key sections like personal information, work experience, education, and skills.
- **✏️ Rich Content Editor**: Easily edit the parsed content, add new sections, or rewrite summaries. The editor saves your changes automatically.
- **📊 Analytics Dashboard**: Get insights into your profile's performance with a built-in dashboard that tracks total views, views over the last 7 days, and views by country.
- **🎨 Customizable Themes (Coming Soon)**: Choose from multiple visual themes to personalize the look and feel of your public profile page.
- **🔗 Shareable Public URL**: Get a unique, customizable URL (e.g., your-portfolio.com/your-name) to share with recruiters, colleagues, and on your social media.
- **🔥 Firebase Integration**: Built on a robust backend using Firebase Authentication for user management and Firestore for data storage.

## Tech Stack

This project uses a modern, type-safe, and performant tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
- **AI & Flows**: [Genkit](https://firebase.google.com/docs/genkit) (for potential future AI-powered enhancements)
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
│   │   └── layout.tsx           # The root layout for the application.
│   │
│   ├── components/
│   │   ├── ui/                  # Reusable UI components from ShadCN.
│   │   └── header.tsx           # The main site header.
│   │
│   ├── firebase/
│   │   ├── config.ts            # Firebase project configuration.
│   │   ├── provider.tsx         # React context provider for Firebase services.
│   │   ├── index.ts             # Main entry point for Firebase SDKs and hooks.
│   │   └── firestore/           # Custom hooks (e.g., useDoc, useCollection).
│   │
│   ├── ai/
│   │   ├── genkit.ts            # Genkit initialization and configuration.
│   │   └── flows/               # Directory for Genkit AI flows.
│   │
│   └── types/
│       └── index.ts             # Core TypeScript types and interfaces for the app.
│
├── firestore.rules              # Security rules for the Firestore database.
├── package.json                 # Project dependencies and scripts.
└── next.config.ts               # Next.js configuration file.
```

## How It Works

1.  **Upload**: A user uploads their PDF resume on the homepage.
2.  **Parse**: The PDF is sent to a serverless API endpoint (`/api/parse-resume`) which extracts the text content. A smart parser then identifies and separates the content into structured sections (summary, experience, etc.).
3.  **Edit**: The user is taken to the editor, where the parsed information populates the forms. The user can then edit, add, or delete sections. All changes are automatically saved to Firestore in near real-time.
4.  **Publish & Share**: The user can customize their public URL and share it. When someone visits the URL, the page fetches the user's profile data from Firestore and renders it.
5.  **Track**: The user can visit their dashboard in the editor to see how many views their profile is getting.

## Getting Started

To run this project locally, you will need Node.js and npm installed.

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

### Firebase Setup

The project is pre-configured to work with a Firebase project. The configuration is stored in `src/firebase/config.ts`. For local development, these credentials are used to connect to the Firebase backend. When deployed to Firebase App Hosting, these are automatically managed.
