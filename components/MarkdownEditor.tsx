import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';

interface Props {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

const MarkdownEditor: React.FC<Props> = ({ initialContent, onSave, onCancel }) => {
  const [content, setContent] = useState(initialContent);

  // Synchronize state with prop changes if needed
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex-1 min-h-0 w-full h-full flex flex-col relative">
        {/* Floating Toolbar - to maintain immersion */}
        <div className="absolute top-4 right-8 z-10 flex gap-2">
          <button
            onClick={onCancel}
            className="flex items-center justify-center w-10 h-10 text-stone-400 hover:text-stone-900 bg-white/80 backdrop-blur-sm rounded-full border border-stone-100 hover:border-stone-200 transition-all shadow-sm group"
            title="取消并退出"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => onSave(content)}
            className="flex items-center justify-center w-10 h-10 bg-stone-900 text-white hover:bg-black rounded-full transition-all shadow-md hover:shadow-lg group"
            title="保存修改"
          >
            <Save size={18} />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full flex-1 bg-transparent text-gray-800 leading-loose resize-none outline-none font-serif text-lg py-12 px-8 md:px-[calc(50%-20rem)] lg:px-[calc(50%-24rem)] border-none focus:ring-0 focus:outline-none ring-0 shadow-none block custom-scrollbar placeholder-gray-300"
          placeholder="在此处输入或编辑内容..."
          autoFocus
        />

        <div className="px-8 md:px-[calc(50%-20rem)] lg:px-[calc(50%-24rem)] shrink-0">
          <div className="py-4 border-t border-stone-50 text-right text-[10px] text-stone-300 font-serif italic tracking-widest">
            * 沉浸式创作模式 · 支持 MARKDOWN 语法
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
