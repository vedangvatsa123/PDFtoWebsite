import Link from 'next/link';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import { blogPosts } from '@/lib/blog-data';
import { blogMetadata } from '@/lib/blog-metadata';

export const metadata = {
  title: 'Insights & Advice',
  description: 'Practical career guides, resume strategies, and actionable insights for modern professionals.',
};

export default function BlogPage() {
  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200 flex flex-col">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32 flex-1">
        <div className="flex flex-col mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4 transition-colors">Articles & Insights</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 transition-colors">Actionable career advice, resume strategies, and insights to help you land your next big role.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/${post.slug}`} className="group relative flex flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all h-full overflow-hidden">
              <div className="w-full aspect-[1200/630] flex relative border-b border-zinc-100 dark:border-zinc-800/50 overflow-hidden transition-colors rounded-t-xl group-hover:opacity-90">
                {/* Simulated OpenGraph Left Text Frame (Zero Server Computation) */}
                <div className="flex flex-col justify-between w-[55%] h-full p-4 sm:p-5 bg-white dark:bg-[#09090b] z-10 shrink-0 border-r border-zinc-100 dark:border-zinc-800">
                  <div className="text-sm sm:text-lg lg:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15] break-words">
                    {blogMetadata.find(m => m.slug === post.slug)?.imageText || post.title}
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                    CVin.Bio
                  </div>
                </div>
                {/* Native Unsplash Pull - 100x Faster */}
                <div className="w-[45%] h-full relative bg-zinc-100 dark:bg-zinc-900 shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={blogMetadata.find(m => m.slug === post.slug)?.featuredImage} alt={post.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.1] transition-transform duration-700 ease-out" />
                </div>
              </div>
                <div className="p-4 md:p-5 flex flex-col flex-1">
                  <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2 transition-colors uppercase tracking-wider">{post.date}</div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-relaxed group-hover:text-primary transition-colors">{post.title}</h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 transition-colors hidden sm:block">{post.excerpt}</p>
                </div>
            </Link>
          ))}
        </div>
      </main>
      <MicroFooter />
    </div>
  );
}
