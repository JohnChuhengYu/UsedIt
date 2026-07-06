import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import StatusBadge from '../components/StatusBadge';

import { API_BASE } from '../config';
import type { Word } from '../types';

export default function Practice() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/words`)
      .then(r => r.ok ? r.json() : [])
      .then(setWords)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    mastered: words.filter(w => w.status === 'MASTERED').length,
    practicing: words.filter(w => w.status === 'PRACTICING').length,
    new: words.filter(w => w.status === 'NEW').length,
    total: words.length,
  };

  const filteredWords = words
    .filter(w => filter === 'ALL' || w.status === filter)
    .filter(w => w.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (w.definition && w.definition.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="animate-enter">
      {/* Hero Section */}
      <div className="mb-16 text-left">
        <h1 className="text-5xl md:text-6xl tracking-tight text-black font-editorial mb-4">
          Select a Word
        </h1>
        <p className="text-gray-500 text-base">
          Pick a word to practice in a real context.
        </p>
      </div>

      <Nav />

      {/* Filter Tabs and Search */}
      <div className="mt-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-6">
        <div className="flex gap-8 text-xs uppercase tracking-wide w-full md:w-auto overflow-x-auto pb-2 md:pb-0 whitespace-nowrap hide-scrollbar">
          <button 
            onClick={() => setFilter('ALL')}
            className={filter === 'ALL' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            ALL ({stats.total})
          </button>
          <button 
            onClick={() => setFilter('NEW')}
            className={filter === 'NEW' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            NEW ({stats.new})
          </button>
          <button 
            onClick={() => setFilter('PRACTICING')}
            className={filter === 'PRACTICING' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            PRACTICING ({stats.practicing})
          </button>
          <button 
            onClick={() => setFilter('MASTERED')}
            className={filter === 'MASTERED' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            MASTERED ({stats.mastered})
          </button>
        </div>
        
        <div className="flex items-center justify-end w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-b border-gray-200 pb-2 focus:outline-none focus:border-black font-editorial text-xl italic bg-transparent"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-0 top-1 text-gray-400 hover:text-black"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="mt-12 w-full">
        {loading ? (
          <div className="flex flex-col w-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-full border-b border-gray-100 py-6 px-4 -mx-4 animate-pulse flex items-center justify-between" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex-1 pr-8">
                  <div className="flex items-baseline gap-4 mb-4">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="text-center py-12 font-editorial text-2xl text-gray-400 italic">No words found.</div>
        ) : (
          filteredWords.map((word, index) => (
            <Link 
              to={`/practice/${word.id}`}
              key={word.id} 
              className="w-full text-left border-b border-gray-100 py-6 px-4 -mx-4 rounded-lg group flex items-center justify-between hover:bg-gray-50 active:scale-[0.99] transition-all duration-200 ease-out stagger-item block"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex-1 pr-8">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-editorial text-2xl text-black group-hover:text-[#EC4899] transition-colors">{word.text}</span>
                  <StatusBadge status={word.status} />
                </div>
                <p className="text-gray-500 text-base truncate">
                  {word.definition || <span className="italic text-gray-300">Definition pending...</span>}
                </p>
              </div>
              
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all duration-200 ease-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
