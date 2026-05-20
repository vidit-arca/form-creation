import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableField({ field, isActive, onClick, onDuplicate, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isActive ? 1 : 0
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={onClick}
      className={`p-6 border-b border-gray-100 cursor-pointer transition relative group ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent bg-white'}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 cursor-grab text-gray-400 hover:text-gray-600 p-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>
      </div>
      
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); onDuplicate(field); }}
        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 bg-white shadow-sm border border-gray-200 rounded-md transition"
        title="Duplicate Field"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
      </button>

      {children}
    </div>
  );
}
