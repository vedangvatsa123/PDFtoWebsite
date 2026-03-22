import Link from 'next/link';
import Header from '@/components/header';
import { blogPosts } from '@/lib/blog-data';

export const metadata = {
  title: 'Blog | CVin.Bio',
  description: 'Practical guides and technical insights for modern job seekers.',
};

export default function BlogPage() {
  return (
    <div className="h-screen overflow-y-auto bg-[#fafafa] dark:bg-black selection:bg-primary/10 transition-colors duration-200">
      <Header />
      <main className="w-full max-w-5xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32">
        <div className="flex flex-col mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4 transition-colors">Articles & Insights</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 transition-colors">Technical documentation and strategy instructions for application workflows.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/${post.slug}`} className="group relative flex flex-col bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all h-full overflow-hidden">
              <div className="w-full aspect-[1200/630] bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800/50 overflow-hidden transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/${post.slug}/opengraph-image?v=9`} alt={post.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
              </div>
              <div className="p-8 flex flex-col flex-1 justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-400 dark:text-zinc-500 mb-4 transition-colors">{post.date}</div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 leading-tight group-hover:text-primary transition-colors">{post.title}</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3 transition-colors">{post.excerpt}</p>
                </div>
                <div className="mt-8 flex items-center text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors hover:underline">
                  Read Article
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
