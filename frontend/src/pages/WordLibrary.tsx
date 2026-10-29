import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Nav from '../components/Nav';
import StatusBadge from '../components/StatusBadge';

import { api } from '../lib/api';
import type { Word, DeckSummary, DeckDetail } from '../types';

export default function WordLibrary() {
  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState({ mastered: 0, practicing: 0, new: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [addError, setAddError] = useState('');

  // Academic Decks state
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedDeckDetail, setSelectedDeckDetail] = useState<DeckDetail | null>(null);
  const [loadingDeckDetail, setLoadingDeckDetail] = useState(false);
  const [importingDeckId, setImportingDeckId] = useState<string | null>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Infinite scroll state
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchWords = async (tabStatus: string | null, pageNum: number) => {
    const skip = pageNum * 20;
    const statusParam = tabStatus ? `&status=${tabStatus}` : '';
    const data = await api.get(`/words?skip=${skip}&limit=20${statusParam}`);
    return data;
  };

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const [wordsData, statsData, decksData] = await Promise.all([
          fetchWords(null, 0),
          api.get('/words/stats'),
          api.get('/decks').catch(() => [])
        ]);
        setWords(wordsData);
        setStats(statsData);
        setDecks(decksData);
        if (decksData.length > 0) {
          setSelectedDeckId(decksData[0].id);
        }
        if (wordsData.length < 20) {
          setHasMore(false);
        }
      } catch (e) {
        console.error('Failed to initialize WordLibrary:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch full detail when selecting a deck in modal
  useEffect(() => {
    if (!isPresetModalOpen || !selectedDeckId) return;
    
    async function loadDetail() {
      setLoadingDeckDetail(true);
      try {
        const detail = await api.get(`/decks/${selectedDeckId}`);
        setSelectedDeckDetail(detail);
      } catch (e) {
        console.error('Failed to load deck detail:', e);
      } finally {
        setLoadingDeckDetail(false);
      }
    }
    loadDetail();
  }, [isPresetModalOpen, selectedDeckId]);

  const handleTabChange = async (newStatus: string | null) => {
    setActiveTab(newStatus);
    setPage(0);
    setHasMore(true);
    setLoading(true);
    window.scrollTo(0, 0);
    try {
      const data = await fetchWords(newStatus, 0);
      setWords(data);
      if (data.length < 20) setHasMore(false);
    } catch (e) {
      console.error('Failed to switch tab:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreWords = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const newWords = await fetchWords(activeTab, nextPage);
      if (newWords.length === 0) {
        setHasMore(false);
      } else {
        setWords(prev => [...prev, ...newWords]);
        setPage(nextPage);
        if (newWords.length < 20) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error('Failed to load more words:', e);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 300 &&
        !loadingMore &&
        hasMore
      ) {
        loadMoreWords();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore, page, activeTab]);

  // Add individual word
  const handleAddWord = async () => {
    if (!newWord.trim()) return;
    setAddError('');
    try {
      const created = await api.post('/words', { text: newWord.trim() });
      setWords(prev => [created, ...prev]);
      setStats(prev => ({
        ...prev,
        new: prev.new + 1,
        total: prev.total + 1
      }));
      setNewWord('');
      setIsAddModalOpen(false);
    } catch (e: any) {
      if (e.status === 409) {
        setAddError('This word already exists in your library.');
      } else {
        setAddError(e.message || 'Failed to add word. Please try again.');
      }
    }
  };

  // Import corpus deck handler
  const handleImportDeck = async (deckId: string) => {
    setImportingDeckId(deckId);
    try {
      const res = await api.post(`/decks/${deckId}/import`);
      const [wordsData, statsData] = await Promise.all([
        fetchWords(activeTab, 0),
        api.get('/words/stats')
      ]);
      setWords(wordsData);
      setStats(statsData);
      setPage(0);
      setHasMore(wordsData.length >= 20);
      
      const skippedMsg = res.skipped_count > 0 ? ` (${res.skipped_count} ALREADY PRESENT)` : '';
      setImportNotification(`IMPORTED ${res.imported_count} WORDS FROM "${res.title.toUpperCase()}"${skippedMsg}`);
      setTimeout(() => setImportNotification(null), 4000);
    } catch (e: any) {
      console.error('Failed to import corpus deck:', e);
      setImportNotification('IMPORT FAILED. PLEASE CHECK BACKEND CONNECTION.');
      setTimeout(() => setImportNotification(null), 4000);
    } finally {
      setImportingDeckId(null);
    }
  };

  // Filtered words (search query only)
  const filteredWords = words
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
      {/* Toast Notification */}
      {importNotification && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-5 py-3 shadow-xl border-l-2 border-[#EC4899] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-mono tracking-wider">{importNotification}</span>
          <button 
            onClick={() => setImportNotification(null)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Word Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white p-8 md:p-12 max-w-md w-full shadow-2xl relative border border-gray-200">
            <button 
              onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-[10px] tracking-widest text-gray-400 uppercase font-mono block mb-2">Lexical Addition</span>
            <h2 className="font-editorial text-3xl mb-2 text-black font-normal">Add a Word</h2>
            <p className="text-gray-500 text-xs mb-8">Enter a target word to add to your personal active vocabulary.</p>
            <input 
              type="text" 
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="e.g. ubiquitous" 
              className="w-full border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-black font-editorial text-2xl italic bg-transparent"
              autoFocus
            />
            {addError && <p className="text-red-500 text-xs mb-4">{addError}</p>}
            <div className="flex justify-end gap-4 text-xs font-medium mt-6">
              <button 
                onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }} 
                className="text-gray-400 hover:text-black uppercase tracking-wider py-2 px-3 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddWord} 
                className="text-white bg-black hover:bg-neutral-800 uppercase tracking-wider px-6 py-2.5 transition-colors"
              >
                Add Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Decks Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white max-w-4xl w-full max-h-[85vh] shadow-2xl flex flex-col relative border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono block mb-1">
                  Corpus Registry · {decks.length} Collections
                </span>
                <h2 className="font-editorial text-3xl md:text-4xl text-black font-normal">
                  Standardized Linguistic Corpora
                </h2>
                <p className="text-gray-500 text-xs mt-1">
                  Verified lexical datasets derived from peer-reviewed publications and standardized testing benchmarks.
                </p>
              </div>
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="text-gray-400 hover:text-black p-1 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Deck Navigation Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar bg-neutral-50/50">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`px-6 py-3.5 text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all border-b-2 ${
                    selectedDeckId === deck.id
                      ? 'border-black text-black bg-white font-semibold'
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  [{deck.code}] {deck.title}
                </button>
              ))}
            </div>

            {/* Detail View */}
            <div className="p-8 overflow-y-auto flex-1">
              {loadingDeckDetail ? (
                <div className="py-24 text-center text-gray-400 text-xs font-mono">LOADING CORPUS ENTRIES...</div>
              ) : selectedDeckDetail ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 pb-8 border-b border-gray-100">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-3 mb-2 font-mono text-[11px] text-gray-400 uppercase tracking-wider">
                        <span>{selectedDeckDetail.badge}</span>
                        <span>·</span>
                        <span>CEFR {selectedDeckDetail.cefr_level}</span>
                        <span>·</span>
                        <span>{selectedDeckDetail.word_count} Words</span>
                      </div>
                      <h3 className="font-editorial text-2xl text-black font-normal">{selectedDeckDetail.title}</h3>
                      <p className="text-xs text-gray-400 italic mb-3 font-serif">{selectedDeckDetail.subtitle}</p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">{selectedDeckDetail.description}</p>
                      
                      {/* Academic Citation Blockquote */}
                      <div className="border-l-2 border-black pl-4 py-1.5 bg-neutral-50 text-[11px] text-gray-600 font-mono leading-relaxed">
                        <span className="font-semibold text-black">Source: </span>
                        {selectedDeckDetail.citation}
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportDeck(selectedDeckDetail.id)}
                      disabled={importingDeckId === selectedDeckDetail.id}
                      className="bg-black text-white hover:bg-neutral-800 disabled:bg-gray-300 text-xs uppercase tracking-wider px-6 py-3 font-medium transition-colors shrink-0 self-start"
                    >
                      {importingDeckId === selectedDeckDetail.id ? 'Importing...' : `Import Collection (${selectedDeckDetail.word_count} Words)`}
                    </button>
                  </div>

                  {/* Words List */}
                  <div className="space-y-6">
                    {selectedDeckDetail.words.map((item, idx) => (
                      <div key={idx} className="border-b border-gray-50 pb-5 last:border-b-0">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-editorial text-2xl text-black font-normal">{item.text}</span>
                          {item.phonetic && <span className="text-xs text-gray-400 font-mono">{item.phonetic}</span>}
                          {item.part_of_speech && <span className="text-xs italic text-gray-400">({item.part_of_speech})</span>}
                          {item.difficulty && (
                            <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 ml-auto">
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed mb-2">{item.definition}</p>
                        <p className="text-xs text-gray-500 italic border-l border-gray-200 pl-3 leading-relaxed">
                          "{item.example}"
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 px-8 bg-neutral-50 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-mono">
              <span>Entries are cached into global Dictionary and mapped to your personal library.</span>
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="text-black uppercase tracking-wider hover:underline"
              >
                Close
              </button>
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
            onClick={() => handleTabChange(null)}
            className={activeTab === null ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            ALL ({stats.total})
          </button>
          <button 
            onClick={() => handleTabChange('NEW')}
            className={activeTab === 'NEW' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            NEW ({stats.new})
          </button>
          <button 
            onClick={() => handleTabChange('PRACTICING')}
            className={activeTab === 'PRACTICING' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            PRACTICING ({stats.practicing})
          </button>
          <button 
            onClick={() => handleTabChange('MASTERED')}
            className={activeTab === 'MASTERED' ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal hover:text-black transition-colors'}
          >
            MASTERED ({stats.mastered})
          </button>
        </div>
        
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
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
            onClick={() => setIsPresetModalOpen(true)}
            className="text-xs uppercase tracking-wider font-medium text-gray-600 hover:text-black border border-gray-200 hover:border-black px-4 py-2 transition-colors shrink-0"
            title="Browse standardized linguistic corpora"
          >
            Curated Decks
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs uppercase tracking-wider font-medium text-white bg-black hover:bg-neutral-800 px-5 py-2 transition-colors shrink-0"
          >
            + Add Word
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {words.length === 0 ? (
        /* Cold Start: Minimalist Curated Corpora Showcase */
        <div className="border-t border-gray-100 pt-16 mb-16">
          <div className="max-w-2xl mb-12">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-mono block mb-2">
              00 · Reference Corpora
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-black font-normal mb-3">
              Select a linguistic corpus to begin.
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Your library is currently empty. Initialize your vocabulary from peer-reviewed academic lists and standardized corpus samples with authentic citations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {decks.map((deck, idx) => (
              <div 
                key={deck.id}
                className="bg-white border border-gray-200/80 p-8 flex flex-col justify-between hover:border-black transition-all"
              >
                <div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-gray-400 uppercase tracking-wider mb-4">
                    <span>[{deck.code}] 0{idx + 1} / 04</span>
                    <span>CEFR {deck.cefr_level} · {deck.word_count} Words</span>
                  </div>

                  <h3 className="font-editorial text-2xl text-black font-normal mb-1">{deck.title}</h3>
                  <p className="text-xs text-gray-400 italic font-serif mb-3">{deck.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{deck.description}</p>
                  
                  {/* Academic Citation Reference */}
                  <p className="text-[11px] text-gray-400 font-mono italic mb-6 border-l border-gray-200 pl-3 leading-relaxed">
                    Ref: {deck.citation}
                  </p>

                  <div className="font-serif italic text-xs text-gray-500 mb-6 leading-relaxed">
                    {deck.words_preview.join(' · ')}
                    {deck.word_count > deck.words_preview.length && ` · +${deck.word_count - deck.words_preview.length} more`}
                  </div>
                </div>

                <button
                  onClick={() => handleImportDeck(deck.id)}
                  disabled={importingDeckId === deck.id}
                  className="w-full text-xs uppercase tracking-wider py-3 border border-black text-black hover:bg-black hover:text-white transition-colors font-medium text-center"
                >
                  {importingDeckId === deck.id ? 'Importing words...' : `Import ${deck.word_count} Words`}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : filteredWords.length === 0 ? (
        /* Empty search results */
        <div className="text-center py-20 bg-neutral-50/50 border border-gray-100 p-8">
          <p className="font-editorial text-2xl text-gray-700 mb-2 font-normal">No matching words found</p>
          <p className="text-xs text-gray-400 mb-6">No entries match your query "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs uppercase tracking-wider underline text-black hover:text-gray-600"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* Word Cards Grid */
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
                    <h3 className="font-editorial text-2xl text-black font-normal">{word.text}</h3>
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
      )}
    </div>
  );
}
