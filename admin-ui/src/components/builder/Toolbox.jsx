import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TOOLBOX_ITEMS } from '../../constants/toolboxItems';

export function Toolbox({ addField, searchQuery, setSearchQuery }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isInputFocused = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-64 bg-white shadow-md border-r border-gray-200 flex flex-col z-10">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <Link to="/" className="text-gray-500 hover:text-gray-800">← Back</Link>
        <h2 className="font-bold text-lg text-gray-800">Toolbox</h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-2">
        <div className="mb-4 relative">
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder="Search fields (press '/')" 
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        {[...new Set(TOOLBOX_ITEMS.map(item => item.category))].map(category => {
          const items = TOOLBOX_ITEMS.filter(item => item.category === category && item.label.toLowerCase().includes(searchQuery.toLowerCase()));
          if (items.length === 0) return null;
          return (
            <React.Fragment key={category}>
              <p className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ${category !== TOOLBOX_ITEMS[0].category ? 'mt-6' : ''}`}>{category}</p>
              {items.map(item => (
                <button 
                  key={item.type}
                  onClick={() => addField(item.type)} 
                  className={`w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition shadow-sm text-sm font-medium ${item.type === 'page_break' ? 'border-dashed bg-gray-50' : ''}`}
                >
                  {item.label}
                </button>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
