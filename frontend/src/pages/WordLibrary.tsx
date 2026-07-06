import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import StatusBadge from '../components/StatusBadge';

import { API_BASE } from '../config';
import type { Word } from '../types';

export default function WordLibrary() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [addError, setAddError] = useState('');

  // Fetch words from API
  useEffect(() => {
    async function fetchWords() {
      try {
        const res = await fetch(`${API_BASE}/words`);
        if (res.ok) {
          const data = await res.json();
          setWords(data);
        }
      } catch (e) {
        console.error('Failed to fetch words:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, []);

  // Add word handler
  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setAddError('');
    try {
      const res = await fetch(`${API_BASE}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newWord.trim(), definition: '', example: '' }),
      });
      if (res.ok) {
        const created = await res.json();
        setWords(prev => [created, ...prev]);
        setNewWord('');
        setIsAddModalOpen(false);
      } else if (res.status === 409) {
        setAddError('This word already exists in your library.');
      } else {
        setAddError('Failed to add word. Please try again.');
      }
    } catch (e) {
      setAddError('Network error. Is the backend running?');
    }
  };

  // Computed stats
  const stats = {
    mastered: words.filter(w => w.status === 'MASTERED').length,
    practicing: words.filter(w => w.status === 'PRACTICING').length,
    new: words.filter(w => w.status === 'NEW').length,
    total: words.length,
  };

  // Filtered words
  const filteredWords = words
    .filter(w => filter === 'ALL' || w.status === filter)
    .filter(w => w.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 (w.definition && w.definition.toLowerCase().includes(searchQuery.toLowerCase())));

  if (loading) {
    return (
      <div className="animate-enter relative min-h-screen pt-24">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="bg-gray-50/50 p-6 flex flex-col justify-between min-h-[240px] animate-pulse border border-gray-100/50" style={{ animationDelay: `${i * 50}ms` }}>
              <div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5 mb-6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mt-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-enter relative">
      {/* Add Word Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-12 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="font-editorial text-3xl mb-2 text-black">Add a Word</h2>
            <p className="text-gray-500 text-sm mb-8">Enter a new word to add to your library.</p>
            <input 
              type="text" 
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="e.g. ubiquitous" 
              className="w-full border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-black font-editorial text-2xl"
              autoFocus
            />
            {addError && <p className="text-red-400 text-sm mb-4">{addError}</p>}
            <div className="flex justify-end gap-4 text-sm font-medium mt-4">
              <button onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }} className="text-gray-400 hover:text-black active:scale-95 transition-all">Cancel</button>
              <button onClick={handleAddWord} className="text-white bg-black px-6 py-2 active:scale-95 transition-all hover:bg-gray-800">Add Word</button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl tracking-tight text-black font-editorial mb-4">
            Mastery through <span className="italic text-[#EC4899] pr-1">genuine</span> usage.
          </h1>
          <p className="text-gray-500 text-base max-w-xl leading-relaxed">
            Don't just memorize. Use words in real, everyday contexts. That's how true fluency is built.
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex gap-8 md:gap-12 justify-end">
          <div className="text-center">
            <div className="font-editorial text-4xl md:text-5xl mb-4">{stats.mastered}</div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Mastered</div>
          </div>
          <div className="text-center">
            <div className="font-editorial text-4xl md:text-5xl mb-4">{stats.practicing}</div>
            <div className="text-xs uppercase tracking-wide text-gray-400">Practicing</div>
          </div>
          <div className="text-center">
            <div className="font-editorial text-4xl md:text-5xl mb-4">{stats.new}</div>
            <div className="text-xs uppercase tracking-wide text-gray-400">New</div>
          </div>
        </div>
      </div>

      <Nav />

      {/* Filter Tabs, Search and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-6 mb-16">
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
        
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
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
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="text-gray-500 hover:text-black border border-gray-200 hover:border-black active:scale-95 transition-all font-medium text-sm px-5 py-2 rounded-full flex items-center gap-2 shrink-0"
          >
            <span className="text-lg leading-none mt-[-2px]">+</span> Add Word
          </button>
        </div>
      </div>

      {/* Word Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
        
        {filteredWords.map((word, index) => {
          const rotations = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[2deg]', 'rotate-[1.5deg]', 'rotate-[-2deg]', 'rotate-[0.5deg]', 'rotate-[-1deg]'];
          const rotationClass = rotations[index % rotations.length];

          return (
            <Link 
              to={`/word/${word.id}`}
              key={word.id} 
              className={`bg-[#FEFEFE] p-6 flex flex-col justify-between text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:rotate-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] border border-gray-50 relative hover:z-10 min-h-[240px] stagger-item ${rotationClass}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div>
                <div className="flex items-baseline gap-4 mb-4">
                  <h3 className="font-editorial text-2xl text-black">{word.text}</h3>
                  <StatusBadge status={word.status} />
                </div>
                <p className="text-base text-gray-500 mb-6 leading-relaxed">
                  {word.definition || <span className="italic text-gray-300">Definition pending...</span>}
                </p>
              </div>
              {word.example && (
                <div className="mt-auto">
                  <p className="text-base text-gray-500 italic">
                    "{word.example}"
                  </p>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  )
}
