import { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import { api } from '../lib/api';

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [wordStats, setWordStats] = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [me, sessions, words] = await Promise.all([
          api.get('/auth/me'),
          api.get('/sessions/stats'),
          api.get('/words/stats'),
        ]);
        const savedStrictness = localStorage.getItem('grading_strictness') as Strictness | null;
        if (savedStrictness && me) {
          me.grading_strictness = savedStrictness;
        }
        setUser(me);
        setSessionStats(sessions);
        setWordStats(words);
      } catch (e) {
        console.error('Failed to load progress data:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleStrictnessChange = async (value: Strictness) => {
    if (!user) return;
    // Optimistic update & persist in localStorage
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

  const mastery = wordStats && wordStats.total > 0
    ? Math.round((wordStats.mastered / wordStats.total) * 1000) / 10
    : 0;

  return (
    <div className="animate-enter">
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
            <span className="text-gray-400">Mastery Progress</span>
            <span className="text-[#EC4899]">{mastery}%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 mb-4 overflow-hidden">
            <div
              className="bg-[#EC4899] h-full transition-all duration-500"
              style={{ width: `${mastery}%` }}
            />
          </div>
          <div className="flex justify-between text-base text-gray-500">
            <span>{sessionStats?.accuracy ?? 0}% Accuracy</span>
            <span>{sessionStats?.passed_sessions ?? 0} Sessions passed</span>
          </div>
        </div>
      </div>

      <Nav />

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
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-8">Word Status</div>
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
                  ? 'text-gray-900 font-semibold'
                  : 'text-gray-400 font-normal hover:text-black transition-colors'
              }
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
        <p className="text-gray-400 text-sm mt-4 max-w-lg">
          {user?.grading_strictness === 'Lenient' && 'Passes if meaning is correct, even with minor grammar issues. Naturalness is not required.'}
          {user?.grading_strictness === 'Normal' && 'Passes if meaning is correct and phrasing sounds native or only slightly off.'}
          {user?.grading_strictness === 'Strict' && 'Passes only if meaning is fully correct and phrasing sounds completely native.'}
        </p>
      </div>

      {/* Storage & Profile */}
      <div className="mb-20">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-8">Storage & Mode</div>
        <div className="flex items-center justify-between border-t border-gray-100 pt-6">
          <div>
            <div className="font-editorial text-2xl text-black">Local-First Storage</div>
            <p className="text-gray-400 text-sm mt-1">
              Your vocabulary and AI practice history are safely stored on your local machine.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded">
              Local Mode Active
            </span>
            <button
              onClick={handleClearLocalData}
              className="text-xs uppercase tracking-wide text-gray-400 hover:text-red-600 transition-colors border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded"
            >
              Clear Local Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
