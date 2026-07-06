import { Link, useLocation } from 'react-router-dom';

export default function Nav() {
  const location = useLocation();
  const path = location.pathname;

  const tabs = [
    { name: 'COLLECT', path: '/' },
    { name: 'USE', path: '/practice' },
    { name: 'OWN', path: '/progress' }
  ];

  return (
    <nav className="w-full mb-16">
      <div className="grid grid-cols-3 border-b border-gray-100 pb-4">
        {tabs.map((tab, index) => {
          const isActive = path === tab.path;
          
          // Align COLLECT to left, USE to center, OWN to right
          let justifyClass = 'justify-center';
          if (index === 0) justifyClass = 'justify-start';
          if (index === 2) justifyClass = 'justify-end';

          return (
            <div key={tab.name} className={`flex ${justifyClass}`}>
              <Link
                to={tab.path}
                className={`text-xs tracking-wide uppercase transition-colors relative ${
                  isActive 
                    ? 'text-black font-bold' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.name}
                {isActive && (
                  <div className="absolute left-1/2 -bottom-[20px] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#EC4899]"></div>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
