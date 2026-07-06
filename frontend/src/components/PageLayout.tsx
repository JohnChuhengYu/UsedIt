import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-black selection:bg-[#EC4899] selection:text-white pb-24 flex flex-col">
      {/* Header */}
      <header className="max-w-[1600px] w-full mx-auto px-16 py-8 flex justify-between items-center">
        <Link to="/" className="font-editorial text-3xl tracking-tight text-black no-underline hover:opacity-80 transition-opacity">
          Used<span className="text-[#EC4899] font-sans inline-block transform -translate-y-1 mx-0.5 text-2xl font-bold">’</span>t
        </Link>
        <span className="text-gray-400 text-xs tracking-widest font-medium uppercase">
          Est. 2026
        </span>
      </header>

      {/* Main Content Container */}
      <main className="max-w-[1600px] w-full mx-auto px-16 mt-8 flex-1">
        {children}
      </main>
    </div>
  );
}
