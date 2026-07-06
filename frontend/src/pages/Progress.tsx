import Nav from '../components/Nav';

export default function Progress() {
  return (
    <div className="animate-enter">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end mb-16 mt-8">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-400 mb-4">Total Words Mastered</div>
          <div className="flex items-baseline gap-4">
            <span className="font-editorial text-5xl md:text-6xl text-black">3</span>
            <span className="text-gray-400 text-base">out of 8 words in library</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs uppercase tracking-wide mb-4">
            <span className="text-gray-400">Mastery Progress</span>
            <span className="text-[#EC4899]">37.5%</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 mb-4 overflow-hidden">
            <div className="bg-[#EC4899] h-full w-[37.5%]"></div>
          </div>
          <div className="flex justify-between text-base text-gray-500">
            <span>82% Accuracy</span>
            <span>12 Sessions passed</span>
          </div>
        </div>
      </div>

      <Nav />

      {/* Sub-tabs */}
      <div className="flex gap-8 mb-16 text-xs uppercase tracking-wide">
        <button className="text-gray-900 font-semibold">Overview</button>
        <button className="text-gray-400 font-normal hover:text-black transition-colors">Practice History</button>
        <button className="text-gray-400 font-normal hover:text-black transition-colors">Mastered Words</button>
      </div>

      {/* Overview Stat Blocks (Vertical Dividers instead of Border Boxes) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        <div className="px-8 first:pl-0">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Total Words</div>
          <div className="font-editorial text-4xl md:text-5xl text-black">8</div>
        </div>
        <div className="px-8">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-4">Total Sessions</div>
          <div className="font-editorial text-4xl md:text-5xl text-black">15</div>
        </div>
        <div className="px-8">
          <div className="text-xs text-[#EC4899] uppercase tracking-wide mb-4">Passed Sessions</div>
          <div className="font-editorial text-4xl md:text-5xl text-[#EC4899]">12</div>
        </div>
        <div className="px-8 last:pr-0">
          <div className="text-xs text-blue-500 uppercase tracking-wide mb-4">Overall Accuracy</div>
          <div className="font-editorial text-4xl md:text-5xl text-blue-500">80<span className="text-2xl font-sans text-gray-300 ml-1">%</span></div>
        </div>
      </div>
      
    </div>
  )
}
