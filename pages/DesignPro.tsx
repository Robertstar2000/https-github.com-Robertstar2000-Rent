
import React, { useState, useEffect } from 'react';
import { Layers, Move, Plus, Trash2, Download, Save, Grid, Square, Circle } from 'lucide-react';

interface DesignElement {
  id: string;
  type: 'table' | 'chair' | 'tent' | 'stage';
  x: number;
  y: number;
  rotation: number;
}

const DesignPro: React.FC = () => {
  const [elements, setElements] = useState<DesignElement[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tallman_design_draft');
    if (saved) {
      setElements(JSON.parse(saved));
    } else {
      setElements([
        { id: '1', type: 'tent', x: 100, y: 100, rotation: 0 },
        { id: '2', type: 'table', x: 300, y: 300, rotation: 0 },
      ]);
    }
  }, []);

  const saveDraft = () => {
    localStorage.setItem('tallman_design_draft', JSON.stringify(elements));
    alert("Draft layout saved successfully.");
  };

  const addElement = (type: DesignElement['type']) => {
    const newElement: DesignElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50 + (elements.length * 10),
      y: 50 + (elements.length * 10),
      rotation: 0
    };
    setElements([...elements, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
  };

  const exportPlan = () => {
    const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor_plan.json';
    a.click();
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">DesignPro 2D Layout</h2>
          <p className="text-slate-500">Create detailed floor plans and event layouts.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={saveDraft}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm"
          >
            <Save size={18} />
            Save Draft
          </button>
          <button 
            onClick={exportPlan}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-md"
          >
            <Download size={18} />
            Export Plan
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        <div className="w-64 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-4 overflow-hidden">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Library</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => addElement('tent')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 transition-all">
              <Square className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase">Tent</span>
            </button>
            <button onClick={() => addElement('table')} className="flex flex-col items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-300 transition-all">
              <Circle className="text-orange-500" />
              <span className="text-[10px] font-bold uppercase">Table</span>
            </button>
          </div>

          <div className="mt-8 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active Items</h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {elements.map((el) => (
                <div key={el.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs border border-slate-100">
                  <span className="font-semibold capitalize text-slate-700">{el.type}</span>
                  <button onClick={() => removeElement(el.id)} className="text-slate-300 hover:text-rose-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {elements.length === 0 && <p className="text-[10px] text-slate-400 italic">Canvas is empty.</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] [background-size:24px_24px]">
          {elements.map((el) => (
            <div 
              key={el.id} 
              className="absolute group cursor-move transition-transform active:scale-105"
              style={{ top: el.y, left: el.x }}
            >
              <div className={`
                flex items-center justify-center shadow-lg border-2
                ${el.type === 'tent' ? 'w-48 h-32 bg-blue-50/80 border-blue-400 rounded-lg' : ''}
                ${el.type === 'table' ? 'w-12 h-12 bg-orange-50/80 border-orange-400 rounded-full' : ''}
                ${el.type === 'stage' ? 'w-64 h-24 bg-purple-50/80 border-purple-400 rounded-sm' : ''}
                ${el.type === 'chair' ? 'w-6 h-6 bg-slate-50/80 border-slate-400 rounded' : ''}
              `}>
                <span className="text-[8px] font-bold uppercase text-slate-500 opacity-50">{el.type}</span>
              </div>
            </div>
          ))}
          <div className="absolute bottom-6 right-6 text-[10px] text-slate-400 font-bold uppercase">Grid Enabled</div>
        </div>
      </div>
    </div>
  );
};

export default DesignPro;
