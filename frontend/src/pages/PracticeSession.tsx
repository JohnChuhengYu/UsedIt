import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';

import { API_BASE } from '../config';
import type { Judgment } from '../types';

const MESSAGES = [
  "Checking meaning & grammar...",
  "Checking naturalness...",
  "Writing feedback..."
];

const JudgingLoader = () => {
  const [index, setIndex] = useState(0);
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => Math.min(prev + 1, MESSAGES.length - 1));
    }, 2000);

    const timeout = setTimeout(() => setIsSlow(true), 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const allMessages = [...MESSAGES, "Still thinking, almost there..."];
  const currentIndex = isSlow ? 3 : index;

  return (
    <div className="flex flex-col gap-2 justify-end items-end animate-fade-in mt-4">
      {/* Hidden SVG Filter for Gooey Effect */}
      <svg width="0" height="0" className="absolute">
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      
      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mr-1 label-pulse inline-block">
        Analyzing
      </span>
      
      <div className="flex items-center gap-3 mt-1">
        <div className="relative h-5 w-64">
          {allMessages.map((msg, i) => {
            const isCurrent = i === currentIndex;
            
            return (
              <span
                key={i}
                className={`absolute right-0 top-0 text-sm font-editorial italic text-gray-500 whitespace-nowrap transition-opacity duration-1000 ease-in-out ${
                  isCurrent ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {msg}
              </span>
            );
          })}
        </div>
        
        {/* Gooey Animation Container */}
        <div className="relative w-6 h-6 mr-1 animate-blob-scale" style={{ filter: 'url(#goo)' }}>
          <div className="absolute inset-0 animate-blob-rotate origin-center">
            <div className="absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 bg-[#EC4899] rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#EC4899] rounded-full animate-blob-1"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#EC4899] rounded-full animate-blob-2"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#EC4899] rounded-full animate-blob-3"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-[#EC4899] rounded-full animate-blob-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getBadgeColors = (rating?: string) => {
  if (!rating) return 'text-gray-500';
  const r = rating.toLowerCase();
  
  // Check 'incorrect' before 'correct' to prevent substring collision
  if (r.includes('incorrect') || r.includes('awkward')) return 'text-rose-700';
  if (r.includes('correct') || r.includes('native')) return 'text-emerald-700';
  if (r.includes('close') || r.includes('minor issue') || r.includes('slightly off')) return 'text-amber-700';
  
  return 'text-gray-600';
};

export default function PracticeSession() {
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState('');
  const [scene, setScene] = useState('');
  const [loadingScene, setLoadingScene] = useState(true);
  
  const [sentence, setSentence] = useState('');
  const [judging, setJudging] = useState(false);
  const [judgment, setJudgment] = useState<Judgment | null>(null);

  useEffect(() => {
    // Reset state when ID changes
    setScene('');
    setWord('');
    setSentence('');
    setJudgment(null);
    setLoadingScene(true);
    
    fetch(`${API_BASE}/words/${id}/scene`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setWord(data.word);
          setScene(data.scene);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingScene(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentence.trim()) return;
    
    setJudging(true);
    setJudgment(null);

    const params = new URLSearchParams();
    params.append('scene', scene);
    params.append('sentence', sentence);

    try {
      const res = await fetch(`${API_BASE}/words/${id}/judge?${params.toString()}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setJudgment(data);
      } else {
        alert("Judgment failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error.");
    } finally {
      setJudging(false);
    }
  };

  return (
    <div className="animate-enter w-full pt-8 pb-40">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        {/* Left Column: Header, Scene and Input */}
        <div className="lg:col-span-8">
          <Link to="/practice" className="text-xs tracking-widest uppercase text-gray-400 hover:text-black transition-colors mb-24 inline-block">
            &larr; Back to Library
          </Link>

          {/* Header */}
          <header className="mb-20">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Target Word</h2>
            {loadingScene ? (
              <div className="h-16 w-64 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              <div className="flex items-center gap-6">
                <h1 className="text-6xl md:text-7xl font-editorial tracking-tight text-black">
                  {word}
                </h1>
              </div>
            )}
          </header>

          <div className="space-y-16">
          <section>
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Scenario</h2>
            {loadingScene ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                <div className="h-6 bg-gray-200 rounded w-4/6"></div>
              </div>
            ) : (
              <p className="text-2xl md:text-3xl font-editorial text-black leading-relaxed italic">
                {scene}
              </p>
            )}
          </section>

          {!loadingScene && (
            <section className="animate-enter" style={{ animationDelay: '100ms' }}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <textarea
                  value={sentence}
                  onChange={(e) => setSentence(e.target.value)}
                  disabled={judging || judgment !== null}
                  placeholder={`Respond using the word "${word}"...`}
                  className="w-full bg-transparent border-b border-gray-200 pb-4 focus:outline-none focus:border-black transition-colors text-2xl md:text-3xl font-editorial text-black resize-none min-h-[120px] disabled:opacity-50 placeholder-gray-300"
                ></textarea>
                
                {!judgment && (
                  <div className="flex justify-end h-12">
                    {judging ? (
                      <JudgingLoader />
                    ) : (
                      <button 
                        type="submit" 
                        disabled={judging || !sentence.trim()}
                        className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed group flex items-center gap-2"
                      >
                        Submit Response
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </form>
            </section>
          )}
          </div>
        </div>

        {/* Right Column: Feedback */}
        <div className="lg:col-span-4">
          {judgment && (
            <div className="animate-enter sticky top-8" style={{ animationDelay: '50ms' }}>
              <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${judgment.passed ? 'bg-emerald-600' : 'bg-[#EC4899]'}`}></div>
                Judgment
              </h2>
              
              <div className="mb-10">
                <StatusBadge status={judgment.word_status} />
              </div>
              


              <div className="flex flex-col gap-8 mb-10">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold w-28">Meaning</span>
                    {judgment.meaning_rating && (
                      <>
                        <span className="text-gray-300 text-xs">|</span>
                        <span className={`text-xs uppercase font-bold tracking-wider ${getBadgeColors(judgment.meaning_rating)}`}>
                          {judgment.meaning_rating}
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-sm leading-relaxed ${getBadgeColors(judgment.meaning_rating)}`}>
                    {judgment.meaning_reasoning || (judgment.correct ? 'Flawless execution' : 'Needs refinement')}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold w-28">Naturalness</span>
                    {judgment.naturalness_reasoning ? (
                      judgment.naturalness_rating && (
                        <>
                          <span className="text-gray-300 text-xs">|</span>
                          <span className={`text-xs uppercase font-bold tracking-wider ${getBadgeColors(judgment.naturalness_rating)}`}>
                            {judgment.naturalness_rating}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <span className="text-gray-300 text-xs">|</span>
                        <span className="text-xs uppercase font-bold tracking-wider text-gray-400">
                          SKIPPED
                        </span>
                      </>
                    )}
                  </div>
                  <span className={`text-sm leading-relaxed ${judgment.naturalness_reasoning ? getBadgeColors(judgment.naturalness_rating) : 'text-gray-400 italic'}`}>
                    {judgment.naturalness_reasoning || "Not evaluated — fix the meaning first."}
                  </span>
                </div>
              </div>
              
              <p className="text-2xl text-black leading-relaxed font-editorial mb-10">
                {judgment.feedback}
              </p>
              
              {judgment.example_sentence && (
                <div className="flex flex-col gap-2 mb-10">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Example</span>
                  <p className="text-xl text-black font-editorial italic leading-relaxed">
                    "{judgment.example_sentence}"
                  </p>
                </div>
              )}

              <div className="flex flex-row items-center gap-8 border-t border-gray-100 pt-8">
                <button 
                  onClick={() => {
                    setSentence('');
                    setJudgment(null);
                  }}
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Rewrite
                </button>
                <Link 
                  to="/practice" 
                  className="text-xs uppercase tracking-widest text-black hover:text-[#EC4899] transition-colors flex items-center gap-2 group"
                >
                  Next Word
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
