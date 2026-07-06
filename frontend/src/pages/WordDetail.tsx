import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

import { API_BASE } from '../config';

export default function WordDetail() {
  const { id } = useParams();
  
  const [wordData, setWordData] = useState<any>(null);
  const [collocations, setCollocations] = useState<string[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allWords, setAllWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const wordId = id ? parseInt(id, 10) : 1;

  // Fetch all words for prev/next navigation
  useEffect(() => {
    fetch(`${API_BASE}/words`).then(r => r.ok ? r.json() : []).then(setAllWords).catch(() => {});
  }, []);

  const currentIndex = allWords.findIndex(w => w.id === wordId);
  const prevWord = currentIndex > 0 ? allWords[currentIndex - 1] : null;
  const nextWord = currentIndex !== -1 && currentIndex < allWords.length - 1 ? allWords[currentIndex + 1] : null;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const wordRes = await fetch(`${API_BASE}/words/${wordId}`);
        if (wordRes.ok) {
          const wData = await wordRes.json();
          setWordData(wData);
          setCollocations(wData.collocations || []);
          setSessions(wData.sessions || []);
        }
      } catch (e) {
        console.error("Failed to fetch word details:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [wordId]);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  if (loading || !wordData) {
    return (
      <div className="animate-enter w-full pt-8 pb-40">
        <div className="text-xs tracking-widest uppercase text-gray-400 mb-24 inline-block">&larr; Back to Library</div>
        <header className="mb-20 animate-pulse">
          <div className="h-16 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 animate-pulse">
          <div className="lg:col-span-8">
            <div className="h-4 bg-gray-200 rounded w-24 mb-8"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-5/6"></div>
          </div>
          <div className="lg:col-span-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-8"></div>
            <div className="h-24 bg-gray-100 rounded w-full border border-gray-50"></div>
          </div>
        </div>
      </div>
    );
  }

  const definitions = [{ definition: wordData.definition, example: wordData.example, pos: wordData.part_of_speech || 'verb' }];
  if (wordData.extraMeanings) {
    wordData.extraMeanings.forEach((m: any) => definitions.push({ definition: m.definition, example: m.example, pos: m.pos || 'noun' }));
  }

  // Combine top labels
  const topLabels = [wordData.difficulty || 'MEDIUM', wordData.tone || 'NEUTRAL', wordData.status || 'NEW']
    .map(label => label.toUpperCase())
    .join(' · ');

  return (
    <>
      <div className="animate-enter w-full pt-8 pb-40">
      
      <Link to="/" className="text-xs tracking-widest uppercase text-gray-400 hover:text-black transition-colors mb-24 inline-block">
        &larr; Back to Library
      </Link>

      {/* 1. Top Bar */}
      <header className="mb-20">
        <div className="flex items-center gap-6 mb-4">
          <h1 className="text-6xl md:text-7xl font-editorial tracking-tight text-black">{wordData.text}</h1>
          {wordData.phonetic && <span className="text-2xl text-gray-400 font-sans mt-2">{wordData.phonetic}</span>}
          {wordData.audio_url && (
            <>
              <button onClick={playAudio} className="text-gray-400 hover:text-black transition-colors mt-2" aria-label="Play pronunciation">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h3l4 4V4l-4 4H7a2 2 0 00-2 2z" />
                </svg>
              </button>
              <audio ref={audioRef} src={wordData.audio_url} />
            </>
          )}
        </div>
        <div className="text-xs tracking-widest text-gray-400 uppercase">
          {topLabels}
        </div>
      </header>

      {/* Main Bento Box Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 pb-12">
        
        {/* Bento 1: Definition */}
        <div className={wordData.memory_aid ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Definition</h2>
          <div className="space-y-8">
            {definitions.map((def, idx) => (
              <div key={idx}>
                <div className="mb-3">
                  <span className="text-gray-400 italic text-base mr-3">{def.pos}</span>
                  <span className="text-2xl text-black">
                    {definitions.length > 1 && <span className="text-gray-300 mr-2">{idx + 1}.</span>}
                    {def.definition}
                  </span>
                </div>
                {def.example && (
                  <div className="pl-6 border-l-2 border-gray-200 text-lg text-gray-500 italic mt-4">
                    "{def.example}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bento 2: Memory Aid */}
        {wordData.memory_aid && (
          <div className="lg:col-span-4">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Memory Aid</h2>
            <p className="text-xl text-gray-800 leading-relaxed italic">
              {wordData.memory_aid}
            </p>
          </div>
        )}

        {/* Bento 3: Common Usage */}
        <div className={`${wordData.synonyms || wordData.antonyms ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Common Usage</h2>
          <div className="space-y-4">
            {collocations.length > 0 ? (
              collocations.map((sentence, idx) => (
                <p key={idx} className="text-lg text-gray-600 italic leading-relaxed">
                  {sentence}
                </p>
              ))
            ) : (
              <p className="text-lg text-gray-400 italic">
                No common usage examples found.
              </p>
            )}
          </div>
        </div>

        {/* Bento 4: Synonyms / Antonyms */}
        {(wordData.synonyms || wordData.antonyms) && (
          <div className="lg:col-span-4 space-y-8">
            {wordData.synonyms && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Synonyms</h2>
                <p className="text-lg text-gray-800 leading-relaxed">
                  {wordData.synonyms}
                </p>
              </div>
            )}
            {wordData.antonyms && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Antonyms</h2>
                <p className="text-lg text-gray-800 leading-relaxed">
                  {wordData.antonyms}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bento 5: Etymology */}
        {wordData.etymology && (
          <div className="lg:col-span-12">
            <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">Etymology</h2>
            <p className="text-lg text-gray-800 leading-relaxed">
              {wordData.etymology}
            </p>
          </div>
        )}

        {/* Bento 6: Practice History */}
        <div className="lg:col-span-12">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">Your Practice History</h2>
          <div className="space-y-8">
            {sessions.length > 0 ? (
              sessions.map((session, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-widest text-gray-400">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-gray-300">&middot;</span>
                    <span className="text-xs uppercase tracking-widest text-gray-400">
                      {session.scene}
                    </span>
                    <span className={`text-xs tracking-widest uppercase ml-auto ${session.passed ? 'text-green-500' : 'text-amber-500'}`}>
                      {session.passed ? 'Passed' : 'Needs Work'}
                    </span>
                  </div>
                  <p className="text-lg text-gray-700 italic leading-relaxed">
                    "{session.user_sentence}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-lg text-gray-400 italic">
                You haven't practiced this word yet.
              </p>
            )}
          </div>
        </div>

      </div>
      </div>

      {/* 6. Fixed Bottom Bar */}
      <footer className="fixed bottom-0 left-0 w-full bg-white z-10 animate-enter" style={{ animationDelay: '100ms' }}>
        <div className="max-w-[1600px] mx-auto px-16 py-6 flex justify-between items-center">
          {/* Pagination */}
          <div className="flex gap-8">
            {prevWord ? (
              <Link 
                to={`/word/${prevWord.id}`} 
                className="text-gray-300 hover:text-black transition-colors"
                aria-label="Previous Word"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
            ) : (
              <div className="text-gray-200 cursor-not-allowed">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </div>
            )}
            
            {nextWord ? (
              <Link 
                to={`/word/${nextWord.id}`} 
                className="text-gray-300 hover:text-black transition-colors"
                aria-label="Next Word"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            ) : (
              <div className="text-gray-200 cursor-not-allowed">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            )}
          </div>

          <Link 
            to="/practice" 
            className="flex items-center gap-2 text-gray-500 hover:text-[#EC4899] transition-colors text-xs uppercase tracking-widest font-semibold"
          >
            Practice this word
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </footer>

    </>
  );
}
