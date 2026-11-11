import { useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { TOOLBOX_ITEMS } from '../../constants/toolboxItems';

export function Toolbox({ addField, searchQuery, setSearchQuery }) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isInputFocused =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        document.activeElement?.isContentEditable;
      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <aside className="w-68 bg-white border-r border-slate-200 flex flex-col z-10 select-none">
      {/* Toolbox Header */}
      <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xs">
            +
          </div>
          <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900 font-mono">
            Field Palette
          </h2>
        </div>
        <span className="text-[10px] font-mono text-slate-400">32 TOOLS</span>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search fields (press '/')..."
            aria-label="Search form fields palette"
            className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="absolute right-2 top-2 font-mono text-[10px] text-slate-400 bg-white px-1 rounded border border-slate-200">
            /
          </kbd>
        </div>
      </div>

      {/* Field Item Categories */}
      <div className="p-3 flex-1 overflow-y-auto space-y-4 text-xs">
        {[...new Set(TOOLBOX_ITEMS.map((item) => item.category))].map((category) => {
          const items = TOOLBOX_ITEMS.filter(
            (item) =>
              item.category === category &&
              item.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (items.length === 0) return null;
          return (
            <div key={category} className="space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 font-mono">
                {category}
              </p>
              <div className="space-y-1">
                {items.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addField(item.type)}
                    className={`w-full text-left px-3 py-2 rounded-md border border-slate-200/80 bg-white hover:border-blue-400 hover:bg-blue-50/40 text-slate-800 transition shadow-2xs text-xs font-medium flex items-center justify-between group active:translate-y-[1px] ${
                      item.type === 'page_break' ? 'border-dashed bg-slate-50/60' : ''
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-700 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
