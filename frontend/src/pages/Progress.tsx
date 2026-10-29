import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Nav from '../components/Nav';
import { api } from '../lib/api';
import type { DeckSummary, DeckDetail } from '../types';

type Strictness = 'Lenient' | 'Normal' | 'Strict';

interface UserProfile {
  id: number;
  username: string;
  grading_strictness: Strictness;
  created_at: string;
}

interface SessionStats {
  total_sessions: number;
  passed_sessions: number;
  accuracy: number;
}

interface WordStats {
  mastered: number;
  practicing: number;
  new: number;
  total: number;
}

export default function Progress() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('tab') === 'corpora' ? 'corpora' : 'mastery';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [wordStats, setWordStats] = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Curated Corpora Decks state
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedDeckDetail, setSelectedDeckDetail] = useState<DeckDetail | null>(null);
  const [loadingDeckDetail, setLoadingDeckDetail] = useState(false);
  const [importingDeckId, setImportingDeckId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [me, sessions, words, decksData] = await Promise.all([
          api.get('/auth/me'),
          api.get('/sessions/stats'),
          api.get('/words/stats'),
          api.get('/decks').catch(() => []),
        ]);
        const savedStrictness = localStorage.getItem('grading_strictness') as Strictness | null;
        if (savedStrictness && me) {
          me.grading_strictness = savedStrictness;
        }
        setUser(me);
        setSessionStats(sessions);
        setWordStats(words);
        setDecks(decksData);
        if (decksData.length > 0) {
          setSelectedDeckId(decksData[0].id);
        }
      } catch (e) {
        console.error('Failed to load progress data:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch deck detail when selecting a deck
  useEffect(() => {
    if (!selectedDeckId) return;
    async function loadDeck() {
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
    loadDeck();
  }, [selectedDeckId]);

  const handleStrictnessChange = async (value: Strictness) => {
    if (!user) return;
    localStorage.setItem('grading_strictness', value);
    setUser({ ...user, grading_strictness: value });
    try {
      await api.patch('/auth/me', { grading_strictness: value });
    } catch (e) {
      console.error('Failed to sync strictness to backend:', e);
    }
  };

  const handleClearLocalData = () => {
    if (window.confirm('Are you sure you want to clear your local storage and reset learning settings?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImportDeck = async (deckId: string) => {
    setImportingDeckId(deckId);
    try {
      const res = await api.post(`/decks/${deckId}/import`);
      const [updatedWordsStats, updatedSessionStats] = await Promise.all([
        api.get('/words/stats'),
        api.get('/sessions/stats'),
      ]);
      setWordStats(updatedWordsStats);
      setSessionStats(updatedSessionStats);
      
      const skippedMsg = res.skipped_count > 0 ? ` (${res.skipped_count} ALREADY PRESENT)` : '';
      setToastMessage(`IMPORTED ${res.imported_count} WORDS FROM "${res.title.toUpperCase()}"${skippedMsg}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e: any) {
      console.error('Failed to import corpus deck:', e);
      setToastMessage('IMPORT FAILED. PLEASE CHECK BACKEND CONNECTION.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setImportingDeckId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-enter">
        <div className="mb-16 mt-8">
          <div className="h-6 bg-gray-100 rounded w-40 mb-6 animate-pulse" />
          <div className="h-12 bg-gray-100 rounded w-24 animate-pulse" />
        </div>
      </div>
    );
  }

  const masteredPercent = wordStats && wordStats.total > 0
    ? Math.round((wordStats.mastered / wordStats.total) * 1000) / 10
    : 0;

  const practicingPercent = wordStats && wordStats.total > 0
    ? Math.round((wordStats.practicing / wordStats.total) * 1000) / 10
    : 0;

  return (
    <div className="animate-enter relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-5 py-3 shadow-xl border-l-2 border-[#EC4899] flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-mono tracking-wider">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end mb-16 mt-8">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-4">Total Words Mastered</div>
          <div className="flex items-baseline gap-4">
            <span className="font-editorial text-5xl md:text-6xl text-black">
              {wordStats?.mastered ?? 0}
            </span>
            <span className="text-gray-400 text-base">
              out of {wordStats?.total ?? 0} words in library
            </span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs uppercase tracking-wide mb-4">
            <span className="text-gray-400">Mastery & Learning Progress</span>
            <span className="font-mono text-black font-medium text-xs">
              <span className="text-[#EC4899] font-bold">{masteredPercent}%</span> Mastered
              {practicingPercent > 0 && (
                <span className="text-gray-400 ml-2">· {practicingPercent}% Practicing</span>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 mb-4 overflow-hidden flex">
            <div
              className="bg-[#EC4899] h-full transition-all duration-500"
              style={{ width: `${masteredPercent}%` }}
              title={`Mastered: ${wordStats?.mastered ?? 0} (${masteredPercent}%)`}
            />
            <div
              className="bg-[#EC4899]/30 h-full transition-all duration-500"
              style={{ width: `${practicingPercent}%` }}
              title={`In Practice: ${wordStats?.practicing ?? 0} (${practicingPercent}%)`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 font-mono">
            <span>{sessionStats?.accuracy ?? 0}% Accuracy</span>
            <span>{sessionStats?.passed_sessions ?? 0} Sessions passed</span>
          </div>
        </div>
      </div>

      <Nav />

      {/* In-Page Sub Navigation Tabs */}
      <div className="flex gap-10 border-b border-gray-100 mb-16 text-xs uppercase tracking-widest font-mono">
        <button
          onClick={() => setSearchParams({ tab: 'mastery' })}
          className={`pb-3 border-b-2 transition-all ${
            activeView === 'mastery'
              ? 'border-black text-black font-semibold'
              : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          01 · Mastery & Settings
        </button>
        <button
          onClick={() => setSearchParams({ tab: 'corpora' })}
          className={`pb-3 border-b-2 transition-all ${
            activeView === 'corpora'
              ? 'border-black text-black font-semibold'
              : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          02 · Curated Corpora
        </button>
      </div>

      {/* VIEW 1: MASTERY & SETTINGS */}
      {activeView === 'mastery' && (
        <div className="animate-in fade-in duration-200">
          {/* Overview Stat Blocks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 mb-20">
            <div className="px-8 first:pl-0">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Total Words</div>
              <div className="font-editorial text-4xl md:text-5xl text-black">
                {wordStats?.total ?? 0}
              </div>
            </div>
            <div className="px-8">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Total Sessions</div>
              <div className="font-editorial text-4xl md:text-5xl text-black">
                {sessionStats?.total_sessions ?? 0}
              </div>
            </div>
            <div className="px-8">
              <div className="text-xs text-[#EC4899] uppercase tracking-wide mb-4">Passed Sessions</div>
              <div className="font-editorial text-4xl md:text-5xl text-[#EC4899]">
                {sessionStats?.passed_sessions ?? 0}
              </div>
            </div>
            <div className="px-8 last:pr-0">
              <div className="text-xs text-blue-500 uppercase tracking-wide mb-4">Overall Accuracy</div>
              <div className="font-editorial text-4xl md:text-5xl text-blue-500">
                {sessionStats?.accuracy ?? 0}
                <span className="text-2xl font-sans text-gray-300 ml-1">%</span>
              </div>
            </div>
          </div>

          {/* Word Status Breakdown */}
          <div className="mb-20">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-8">Word Status Breakdown</div>
            <div className="flex gap-8 md:gap-12">
              <div className="text-center">
                <div className="font-editorial text-4xl md:text-5xl mb-4">{wordStats?.mastered ?? 0}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Mastered</div>
              </div>
              <div className="text-center">
                <div className="font-editorial text-4xl md:text-5xl mb-4">{wordStats?.practicing ?? 0}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400">Practicing</div>
              </div>
              <div className="text-center">
                <div className="font-editorial text-4xl md:text-5xl mb-4">{wordStats?.new ?? 0}</div>
                <div className="text-xs uppercase tracking-wide text-gray-400">New</div>
              </div>
            </div>
          </div>

          {/* Grading Strictness */}
          <div className="mb-20">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-8">Grading Strictness</div>
            <div className="flex gap-8 text-xs uppercase tracking-wide">
              {(['Lenient', 'Normal', 'Strict'] as Strictness[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleStrictnessChange(level)}
                  className={
                    user?.grading_strictness === level
                      ? 'text-gray-900 font-semibold border-b border-black pb-0.5'
                      : 'text-gray-400 font-normal hover:text-black transition-colors'
                  }
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-4 max-w-lg leading-relaxed">
              {user?.grading_strictness === 'Lenient' && 'Passes if meaning is correct, forgiving minor syntax or preposition slips.'}
              {user?.grading_strictness === 'Normal' && 'Passes if meaning is correct and phrasing sounds natural or slightly off.'}
              {user?.grading_strictness === 'Strict' && 'Passes only if meaning is completely accurate and phrasing sounds fully fluent.'}
            </p>
          </div>

          {/* Storage & Reset */}
          <div className="mb-20 border-t border-gray-100 pt-8">
            <div className="text-xs uppercase tracking-wide text-gray-400 mb-6">Storage & Maintenance</div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-editorial text-2xl text-black">Local-First Storage Active</div>
                <p className="text-gray-400 text-xs mt-1">
                  Your vocabulary and practice history are stored in your local SQLite database without external transmission.
                </p>
              </div>
              <button
                onClick={handleClearLocalData}
                className="text-xs uppercase tracking-wider text-gray-400 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-300 px-4 py-2 self-start sm:self-center"
              >
                Clear Local Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CURATED CORPORA (IN-PAGE DEDICATED TAB) */}
      {activeView === 'corpora' && (
        <div className="animate-in fade-in duration-200">
          <div className="max-w-2xl mb-12">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono block mb-2">
              Standardized Linguistic Reference
            </span>
            <h2 className="font-editorial text-3xl md:text-4xl text-black font-normal mb-3">
              Curated Corpora Decks
            </h2>
            <p className="text-gray-500 text-xs leading-relaxed">
              Peer-reviewed vocabulary datasets complete with literature citations, CEFR proficiency levels, and authentic usage contexts. Import any collection into your active library with one click.
            </p>
          </div>

          {/* Deck Horizontal Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar mb-12 bg-neutral-50/50">
            {decks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => setSelectedDeckId(deck.id)}
                className={`px-8 py-4 text-xs font-mono tracking-wider uppercase whitespace-nowrap transition-all border-b-2 ${
                  selectedDeckId === deck.id
                    ? 'border-black text-black bg-white font-semibold'
                    : 'border-transparent text-gray-400 hover:text-black'
                }`}
              >
                [{deck.code}] {deck.title}
              </button>
            ))}
          </div>

          {/* Selected Deck Presentation */}
          {loadingDeckDetail ? (
            <div className="py-24 text-center text-gray-400 text-xs font-mono">LOADING CORPUS DATA...</div>
          ) : selectedDeckDetail ? (
            <div>
              {/* Deck Summary Card */}
              <div className="bg-white border border-gray-200 p-8 md:p-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 font-mono text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                    <span>{selectedDeckDetail.badge}</span>
                    <span>·</span>
                    <span>CEFR {selectedDeckDetail.cefr_level}</span>
                    <span>·</span>
                    <span>{selectedDeckDetail.word_count} Target Words</span>
                  </div>
                  <h3 className="font-editorial text-3xl text-black font-normal mb-1">{selectedDeckDetail.title}</h3>
                  <p className="text-xs text-gray-400 italic font-serif mb-4">{selectedDeckDetail.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">{selectedDeckDetail.description}</p>
                  
                  {/* Academic Citation Blockquote */}
                  <div className="border-l-2 border-black pl-4 py-2 bg-neutral-50 text-[11px] text-gray-600 font-mono leading-relaxed">
                    <span className="font-semibold text-black">Source: </span>
                    {selectedDeckDetail.citation}
                  </div>
                </div>

                <button
                  onClick={() => handleImportDeck(selectedDeckDetail.id)}
                  disabled={importingDeckId === selectedDeckDetail.id}
                  className="bg-black text-white hover:bg-neutral-800 disabled:bg-gray-300 text-xs uppercase tracking-wider px-8 py-4 font-medium transition-colors shrink-0"
                >
                  {importingDeckId === selectedDeckDetail.id ? 'Importing words...' : `Import Collection (${selectedDeckDetail.word_count} Words)`}
                </button>
              </div>

              {/* Word List Entries */}
              <div className="mb-20">
                <div className="text-xs uppercase tracking-wide text-gray-400 font-mono mb-8">
                  Collection Wordlist ({selectedDeckDetail.words.length} Entries)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedDeckDetail.words.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="border border-gray-100 p-6 bg-white hover:border-black/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className="font-editorial text-2xl text-black font-normal">{item.text}</span>
                          {item.phonetic && <span className="text-xs text-gray-400 font-mono">{item.phonetic}</span>}
                          {item.part_of_speech && <span className="text-xs italic text-gray-400">({item.part_of_speech})</span>}
                          {item.difficulty && (
                            <span className="text-[10px] uppercase font-mono tracking-widest text-gray-400 ml-auto">
                              {item.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed mb-4">{item.definition}</p>
                      </div>

                      <div className="text-xs text-gray-500 italic border-l border-gray-200 pl-3 leading-relaxed mt-auto pt-2">
                        "{item.example}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
