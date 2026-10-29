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
  
  // Single Add Word Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [addError, setAddError] = useState('');

  // Academic Decks State
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

  // Initial load: words, stats, and academic decks
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
      
      const skippedMsg = res.skipped_count > 0 ? ` (${res.skipped_count} already existed)` : '';
      setImportNotification(`Successfully added ${res.imported_count} words from "${res.title}"!${skippedMsg}`);
      setTimeout(() => setImportNotification(null), 4500);
    } catch (e: any) {
      console.error('Failed to import corpus deck:', e);
      setImportNotification('Import failed. Please verify that the backend is running.');
      setTimeout(() => setImportNotification(null), 4500);
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
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-3.5 shadow-2xl rounded-none border-l-4 border-[#EC4899] flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-medium">{importNotification}</span>
          <button 
            onClick={() => setImportNotification(null)}
            className="text-gray-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Word Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white p-8 md:p-12 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }}
              className="absolute top-6 right-6 text-gray-400 hover:text-black"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="font-editorial text-3xl mb-2 text-black">Add a Word</h2>
            <p className="text-gray-500 text-sm mb-8">Enter a new word to add to your personal library.</p>
            <input 
              type="text" 
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="e.g. ubiquitous" 
              className="w-full border-b border-gray-200 pb-2 mb-4 focus:outline-none focus:border-black font-editorial text-2xl"
              autoFocus
            />
            {addError && <p className="text-red-500 text-sm mb-4">{addError}</p>}
            <div className="flex justify-end gap-4 text-sm font-medium mt-6">
              <button onClick={() => { setIsAddModalOpen(false); setAddError(''); setNewWord(''); }} className="text-gray-400 hover:text-black active:scale-95 transition-all">Cancel</button>
              <button onClick={handleAddWord} className="text-white bg-black px-6 py-2.5 active:scale-95 transition-all hover:bg-gray-800">Add Word</button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Decks Modal */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-widest text-[#EC4899] font-semibold bg-[#EC4899]/10 px-2.5 py-1 rounded">
                    Corpus Grounded
                  </span>
                  <span className="text-xs text-gray-400">Peer-Reviewed Linguistics & Standardized Lists</span>
                </div>
                <h2 className="font-editorial text-3xl md:text-4xl text-black mt-2">
                  Standardized Linguistic Corpora
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Vocabulary sets derived from corpus linguistics (AWL, Oxford 5000, GRE, COCA) with published academic citations.
                </p>
              </div>
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="text-gray-400 hover:text-black p-1"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Deck Tabs */}
            <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar bg-gray-50/50">
              {decks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => setSelectedDeckId(deck.id)}
                  className={`px-6 py-3.5 text-sm font-medium whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                    selectedDeckId === deck.id
                      ? 'border-black text-black bg-white font-semibold'
                      : 'border-transparent text-gray-500 hover:text-black'
                  }`}
                >
                  <span>{deck.icon}</span>
                  <span>{deck.title}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-1 font-mono">
                    {deck.cefr_level}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Deck Details & Word List */}
            <div className="p-8 overflow-y-auto flex-1">
              {loadingDeckDetail ? (
                <div className="py-24 text-center text-gray-400 text-sm">Loading corpus words...</div>
              ) : selectedDeckDetail ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6 pb-6 border-b border-gray-100">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                          {selectedDeckDetail.badge}
                        </span>
                        <span className="text-xs text-gray-400">• CEFR {selectedDeckDetail.cefr_level}</span>
                        <span className="text-xs text-gray-400">• {selectedDeckDetail.word_count} Words</span>
                      </div>
                      <h3 className="font-editorial text-2xl text-black">{selectedDeckDetail.title}</h3>
                      <p className="text-xs text-gray-500 mb-3">{selectedDeckDetail.subtitle}</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">{selectedDeckDetail.description}</p>
                      
                      {/* Academic Citation Box */}
                      <div className="bg-gray-50 border-l-2 border-black p-3 text-xs text-gray-600 font-mono leading-normal">
                        <span className="font-bold text-gray-800">Source: </span>
                        {selectedDeckDetail.citation}
                      </div>
                    </div>

                    <button
                      onClick={() => handleImportDeck(selectedDeckDetail.id)}
                      disabled={importingDeckId === selectedDeckDetail.id}
                      className="bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 text-sm font-medium py-3 px-6 active:scale-95 transition-all shrink-0 self-start"
                    >
                      {importingDeckId === selectedDeckDetail.id ? 'Importing words...' : `Import Deck (${selectedDeckDetail.word_count} Words)`}
                    </button>
                  </div>

                  {/* Words List */}
                  <div className="space-y-4">
                    {selectedDeckDetail.words.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50/60 border border-gray-100/80 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="font-editorial text-xl text-black font-semibold">{item.text}</span>
                          {item.phonetic && <span className="text-xs text-gray-400 font-mono">{item.phonetic}</span>}
                          {item.part_of_speech && <span className="text-xs italic text-gray-400">({item.part_of_speech})</span>}
                          {item.difficulty && (
                            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 ml-auto">
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.definition}</p>
                        <p className="text-xs text-gray-500 italic border-l-2 border-[#EC4899]/40 pl-3">
                          "{item.example}"
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 px-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
              <span>Importing dynamically updates Dictionary metadata and avoids duplicates.</span>
              <button 
                onClick={() => setIsPresetModalOpen(false)}
                className="text-black font-medium hover:underline"
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
            className="text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-400 active:scale-95 transition-all font-medium text-sm px-4 py-2 rounded-full flex items-center gap-1.5 shrink-0"
            title="Browse standardized linguistic corpora"
          >
            <span>📚</span> Curated Decks
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="text-white bg-black hover:bg-gray-800 border border-black active:scale-95 transition-all font-medium text-sm px-5 py-2 rounded-full flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span className="text-lg leading-none mt-[-2px]">+</span> Add Word
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {words.length === 0 ? (
        /* Empty State: Corpus Showcase */
        <div className="bg-[#FAF9F6] border border-gray-200/80 p-8 md:p-12 mb-12">
          <div className="max-w-2xl mb-8">
            <span className="text-xs uppercase tracking-widest text-[#EC4899] font-semibold bg-[#EC4899]/10 px-3 py-1 rounded-full">
              Standardized Lexicon
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-black mt-4 mb-3">
              Corpus-grounded vocabulary to jumpstart your training.
            </h2>
            <p className="text-gray-600 text-base leading-relaxed">
              Your library is ready. Import verified lexical sets derived from published linguistic corpora (AWL, Oxford 5000, GRE, COCA) complete with academic citations and authentic context sentences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {decks.map((deck) => (
              <div 
                key={deck.id}
                className="bg-white p-6 md:p-8 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{deck.icon}</span>
                    <span className="text-xs font-medium uppercase tracking-wider text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded font-mono">
                      CEFR {deck.cefr_level} • {deck.word_count} Words
                    </span>
                  </div>
                  <h3 className="font-editorial text-2xl text-black mb-1">{deck.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{deck.subtitle}</p>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{deck.description}</p>
                  
                  {/* Academic Citation Reference */}
                  <p className="text-[11px] text-gray-400 italic mb-4 font-mono">
                    Ref: {deck.citation}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {deck.words_preview.map((w) => (
                      <span key={w} className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded font-mono">
                        {w}
                      </span>
                    ))}
                    {deck.word_count > deck.words_preview.length && (
                      <span className="text-xs text-gray-400 px-1 py-1">+{deck.word_count - deck.words_preview.length} more</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleImportDeck(deck.id)}
                  disabled={importingDeckId === deck.id}
                  className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-300 text-sm font-medium py-3 px-4 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  {importingDeckId === deck.id ? (
                    <span>Importing corpus words...</span>
                  ) : (
                    <span>Import {deck.word_count} Words</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : filteredWords.length === 0 ? (
        /* Empty search results */
        <div className="text-center py-20 bg-gray-50/50 border border-gray-100 p-8">
          <p className="font-editorial text-2xl text-gray-700 mb-2">No matching words found</p>
          <p className="text-sm text-gray-400 mb-6">We couldn't find any words matching "{searchQuery}".</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-sm underline text-black hover:text-gray-600"
          >
            Clear search filter
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
      )}
    </div>
  );
}
