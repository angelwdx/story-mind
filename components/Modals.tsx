
import React, { useState, useEffect, useMemo } from 'react';
import { X, Settings, Sparkles, FileText, Gavel, Save, RotateCcw, ChevronDown, Search, LayoutList, CheckCircle2, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { ApiConfig } from '../types';
import MarkdownViewer from './MarkdownViewer';
import { PROMPTS, THEME_MATCH_PROMPT } from '../constants';
import { testConnection } from '../services/apiService';
import { useAlert } from './CustomAlert';

// Map keys to readable names
const PROMPT_NAMES: Record<string, string> = {
    'JUDGE': '选题判官',
    'DEMON_EDITOR': '魔鬼编辑 (审阅)',
    'DEMON_REWRITE_SPECIFIC': '魔鬼重写 (执行)',
    'USER_FEEDBACK_REWRITE': '用户反馈重写 (FEEDBACK)',
    'PLOT_CRITIQUE': '剧情医生 (PLOT_CRITIQUE)',
    'GEN_TITLE': '起名大师 (GEN_TITLE)',
    'DNA': '核心DNA (DNA)',
    'CHARACTERS': '角色动力学 (CHARACTERS)',
    'WORLD': '世界观 (WORLD)',
    'PLOT': '情节架构 (PLOT)',
    'BLUEPRINT': '章节蓝图 (BLUEPRINT)',
    'STATE_INIT': '角色状态 (STATE_INIT)',
    'STATE_UPDATE': '状态同步 (STATE_UPDATE)',
    'CHAPTER_1': '首章创作 (CHAPTER_1)',
    'CHAPTER_NEXT': '后续章节 (CHAPTER_NEXT)',
    'THEME_MATCH_PROMPT': '题材匹配 (THEME_MATCH)'
};

export const PromptManagerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    customPrompts: Record<string, string>;
    onUpdatePrompts: (newPrompts: Record<string, string>) => void;
}> = ({ isOpen, onClose, customPrompts, onUpdatePrompts }) => {
    // Combine all keys
    const allKeys = useMemo(() => [
        ...Object.keys(PROMPTS),
        'THEME_MATCH_PROMPT'
    ], []);

    const { showConfirm } = useAlert();
    const [selectedKey, setSelectedKey] = useState<string>(allKeys[0]);
    const [currentValue, setCurrentValue] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Get default value helper
    const getDefaultValue = (key: string) => {
        if (key === 'THEME_MATCH_PROMPT') return THEME_MATCH_PROMPT;
        return PROMPTS[key as keyof typeof PROMPTS] || "";
    };

    // Load initial value when selected key changes
    useEffect(() => {
        const val = customPrompts[selectedKey] || getDefaultValue(selectedKey);
        setCurrentValue(val);
        setUnsavedChanges(false);
    }, [selectedKey, customPrompts, isOpen]);

    // Handle text change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCurrentValue(e.target.value);
        const savedVal = customPrompts[selectedKey] || getDefaultValue(selectedKey);
        setUnsavedChanges(e.target.value !== savedVal);
    };

    const handleSaveCurrent = () => {
        onUpdatePrompts({
            ...customPrompts,
            [selectedKey]: currentValue
        });
        setUnsavedChanges(false);
    };

    const handleResetCurrent = async () => {
        const confirmed = await showConfirm("确定要恢复默认设置吗？这将清除该提示词的所有自定义修改。", "warning");
        if (confirmed) {
            // Always create a new object to ensure React state update triggers
            const newPrompts = { ...customPrompts };

            // Delete the key if it exists (safe operation even if it doesn't)
            delete newPrompts[selectedKey];

            // Always propagate change to parent to force re-evaluation of 'isCustomized' state
            // and trigger useEffect to reset local value
            onUpdatePrompts(newPrompts);

            // Immediate UI feedback
            const def = getDefaultValue(selectedKey);
            setCurrentValue(def);
            setUnsavedChanges(false);
        }
    };

    const filteredKeys = allKeys.filter(k =>
        k.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (PROMPT_NAMES[k] || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white border border-gray-100 rounded-xl w-full max-w-6xl h-[90vh] flex shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden ring-1 ring-black/5">

                {/* Left Sidebar: Prompt List */}
                <div className="w-64 md:w-80 bg-gray-50 border-r border-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center mb-3">
                            <FileText className="mr-2 text-black" size={20} /> 提示词管理
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索提示词..."
                                className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg pl-9 pr-3 py-2 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {filteredKeys.map(key => {
                            const isCustomized = Object.prototype.hasOwnProperty.call(customPrompts, key);
                            const isActive = selectedKey === key;
                            return (
                                <button
                                    key={key}
                                    onClick={async () => {
                                        if (unsavedChanges) {
                                            const confirmed = await showConfirm("您有未保存的修改，切换将丢失进度，确认切换吗？", "warning");
                                            if (confirmed) {
                                                setSelectedKey(key);
                                            }
                                        } else {
                                            setSelectedKey(key);
                                        }
                                    }}
                                    className={`w-full text-left px-3 py-3 rounded-lg text-sm flex items-center justify-between transition-all ${isActive
                                        ? 'bg-black text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                                        }`}
                                >
                                    <div className="flex flex-col truncate">
                                        <span className="font-bold truncate">{PROMPT_NAMES[key] || key}</span>
                                        <span className={`text-[10px] font-mono truncate ${isActive ? 'text-gray-400' : 'text-gray-400'}`}>{key}</span>
                                    </div>
                                    {isCustomized && <div className={`w-2 h-2 rounded-full shrink-0 ml-2 ${isActive ? 'bg-emerald-400' : 'bg-emerald-500'}`} title="已自定义修改" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right Content: Editor */}
                <div className="flex-1 flex flex-col bg-white min-w-0">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center h-16 shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-gray-900 font-serif font-bold text-lg flex items-center">
                                {PROMPT_NAMES[selectedKey] || selectedKey}
                            </h2>
                            <span className="text-xs text-gray-400 font-mono">Key: {selectedKey}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            {unsavedChanges && <span className="text-xs text-amber-600 animate-pulse flex items-center font-medium"><AlertCircle size={12} className="mr-1" /> 未保存</span>}

                            <button
                                onClick={handleResetCurrent}
                                className="text-xs flex items-center text-gray-500 hover:text-red-500 px-3 py-1.5 rounded hover:bg-red-50 transition-colors border border-gray-200 hover:border-red-200"
                                title="恢复为系统默认提示词"
                            >
                                <RotateCcw size={14} className="mr-1.5" /> 恢复默认
                            </button>

                            <button
                                onClick={handleSaveCurrent}
                                disabled={!unsavedChanges}
                                className={`text-xs flex items-center px-4 py-1.5 rounded-lg font-bold transition-all ${unsavedChanges
                                    ? 'bg-black hover:bg-gray-800 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Save size={14} className="mr-1.5" /> {unsavedChanges ? '保存修改' : '已保存'}
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 relative flex flex-col bg-gray-50/30">
                        <div className="absolute inset-0 p-6">
                            <textarea
                                value={currentValue}
                                onChange={handleChange}
                                className="w-full h-full bg-white border border-gray-200 rounded-xl p-6 font-mono text-sm text-gray-800 resize-none outline-none focus:border-black focus:ring-1 focus:ring-black/5 transition-all custom-scrollbar leading-relaxed shadow-sm"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* Footer / Info */}
                    <div className="p-3 border-t border-gray-100 bg-white text-xs text-gray-500 flex justify-between items-center shrink-0">
                        <div className="flex items-center">
                            <AlertCircle size={12} className="mr-1.5 text-gray-400" />
                            提示：修改后的提示词需要手动保存才能生效。请确保保留关键的变量占位符（如 {'{STORY_DNA}'}）。
                        </div>
                        <button onClick={onClose} className="hover:text-gray-900 transition-colors font-medium">关闭窗口 (ESC)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 剧情结构选择模态框
export const PlotStructureModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    plotStructures: Array<{ id: number; name: string; description: string }>;
    selectedStructure: string;
    onSelectStructure: (structureName: string) => void;
}> = ({ isOpen, onClose, plotStructures, selectedStructure, onSelectStructure }) => {
    const [searchTerm, setSearchTerm] = useState("");

    // 过滤剧情结构
    const filteredStructures = plotStructures.filter(structure => {
        const searchLower = searchTerm.toLowerCase();
        return (
            structure.name.toLowerCase().includes(searchLower) ||
            structure.description.toLowerCase().includes(searchLower)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
            <div className="bg-white border border-gray-100 rounded-xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 ring-1 ring-black/5">
                {/* 标题栏 */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white rounded-t-xl">
                    <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 text-black mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        选择剧情结构
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* 搜索栏 */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="搜索结构名称或描述..."
                            className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all placeholder:text-gray-400 shadow-sm"
                        />
                    </div>
                </div>

                {/* 结构列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {filteredStructures.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <p>未找到匹配的剧情结构</p>
                        </div>
                    ) : (
                        filteredStructures.map((structure) => {
                            // 解析名称，确保格式为 中文名称 (英文名称)
                            let formattedName = structure.name;
                            if (!structure.name.includes('(') && !structure.name.includes(')')) {
                                // 如果没有英文名称，保持原样
                                formattedName = structure.name;
                            }

                            return (
                                <div
                                    key={structure.id}
                                    onClick={() => {
                                        onSelectStructure(structure.name);
                                        onClose();
                                    }}
                                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${selectedStructure === structure.name
                                        ? 'bg-black text-white border-black shadow-md'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                        }`}
                                >
                                    <h4 className={`text-lg font-bold mb-2 font-serif ${selectedStructure === structure.name ? 'text-white' : 'text-gray-900'}`}>
                                        {formattedName}
                                    </h4>
                                    <div className={`text-sm whitespace-pre-line leading-relaxed ${selectedStructure === structure.name ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {structure.description}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

// 改名为 PromptEditorModal 并增加编辑功能
export const PromptEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    prompt: string;
    defaultPrompt: string;
    onSave: (newPrompt: string) => void;
    currentKey?: string;
    relatedKeys?: string[];
    onKeyChange?: (key: string) => void;
    fullPrompt: string;
    isFullPromptView: boolean;
    onTogglePromptView: () => void;
    currentChapter?: number;
    totalChapters?: number;
    onChapterChange?: (chapter: number) => void;
}> = ({ isOpen, onClose, prompt, defaultPrompt, onSave, currentKey, relatedKeys, onKeyChange, fullPrompt, isFullPromptView, onTogglePromptView, currentChapter = 1, totalChapters = 12, onChapterChange }) => {
    const [value, setValue] = useState(prompt);

    // 当打开或 prompt 变化时更新内部状态
    useEffect(() => {
        setValue(prompt);
    }, [prompt, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-gray-100 rounded-xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 ring-1 ring-black/5">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white h-16">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                            <FileText className="mr-2 text-black" size={20} />
                            {relatedKeys && relatedKeys.length > 1 ? '切换提示词专家：' : '编辑系统提示词'}
                        </h3>

                        {relatedKeys && relatedKeys.length > 1 && onKeyChange && currentKey && (
                            <div className="relative group">
                                <select
                                    value={currentKey}
                                    onChange={(e) => onKeyChange(e.target.value)}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded pl-3 pr-8 py-1 focus:border-black focus:outline-none cursor-pointer font-bold hover:bg-gray-100 transition-colors"
                                >
                                    {relatedKeys.map(key => (
                                        <option key={key} value={key}>
                                            {PROMPT_NAMES[key] || key}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        )}

                        {/* 章节选择器 */}
                        {(currentKey === 'CHAPTER_1' || currentKey === 'CHAPTER_NEXT') && (
                            <div className="relative group">
                                <select
                                    value={currentChapter}
                                    onChange={(e) => onChapterChange?.(parseInt(e.target.value))}
                                    className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded pl-3 pr-8 py-1 focus:border-black focus:outline-none cursor-pointer font-bold hover:bg-gray-100 transition-colors"
                                >
                                    {/* 根据当前提示词决定显示哪些章节 */}
                                    {currentKey === 'CHAPTER_1' ? (
                                        /* 首章创作只显示第1章 */
                                        <option key={1} value={1}>
                                            第 1 章
                                        </option>
                                    ) : (
                                        /* 后续章节显示第2章及以后 */
                                        Array.from({ length: totalChapters - 1 }, (_, i) => i + 2).map(chapter => (
                                            <option key={chapter} value={chapter}>
                                                第 {chapter} 章
                                            </option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" size={14} />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setValue(defaultPrompt)}
                            className="text-xs flex items-center text-gray-400 hover:text-amber-600 px-3 py-1 rounded hover:bg-amber-50 transition-colors"
                            title="恢复默认提示词"
                        >
                            <RotateCcw size={14} className="mr-1" /> 恢复默认
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 bg-gray-50/30">
                    <div className="flex border-b border-gray-100 bg-white">
                        <button
                            onClick={() => onTogglePromptView()}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${!isFullPromptView ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            模板提示词
                        </button>
                        <button
                            onClick={() => onTogglePromptView()}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${isFullPromptView ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            完整提示词 (AI实际接收)
                        </button>
                    </div>

                    {!isFullPromptView ? (
                        <>
                            <div className="p-2 bg-orange-50 text-orange-700 text-xs text-center border-b border-orange-100 flex items-center justify-center">
                                <AlertCircle size={12} className="mr-1.5" />
                                在此修改提示词将影响接下来的生成结果。变量（如 {'{topic}'}）会被自动替换，请保留它们。
                            </div>
                            <textarea
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="flex-1 w-full bg-white p-6 font-mono text-sm text-gray-800 resize-none outline-none focus:bg-white transition-colors custom-scrollbar leading-relaxed"
                                spellCheck={false}
                                placeholder="在此输入提示词..."
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="p-2 bg-emerald-50 text-emerald-700 text-xs text-center border-b border-emerald-100 flex items-center justify-center">
                                <Sparkles size={12} className="mr-1.5" />
                                以下是AI实际接收的完整提示词，所有变量已替换为当前项目的实际值。
                            </div>
                            <div className="flex-1 w-full bg-white p-6 font-mono text-sm text-gray-800 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed">
                                {fullPrompt || "暂无完整提示词..."}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl flex justify-between space-x-3">
                    {isFullPromptView && (
                        <button
                            onClick={() => navigator.clipboard.writeText(fullPrompt)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm flex items-center font-medium"
                            title="复制完整提示词"
                        >
                            <Copy size={16} className="mr-2" /> 复制完整提示词
                        </button>
                    )}
                    {!isFullPromptView && (
                        <button
                            onClick={() => {
                                onSave(value);
                                onClose();
                            }}
                            className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-bold flex items-center text-sm shadow-md"
                        >
                            <Save size={16} className="mr-2" /> 保存修改
                        </button>
                    )}
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors text-sm font-medium">
                        关闭
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CustomRequestModal: React.FC<{ isOpen: boolean; onClose: () => void; onSubmit: (val: string) => void; title: string }> = ({ isOpen, onClose, onSubmit, title }) => {
    const [value, setValue] = useState("");
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-gray-100 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 ring-1 ring-black/5">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white h-16 rounded-t-xl">
                    <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                        <Sparkles className="mr-2 text-black" size={20} /> 自定义生成要求
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-3">
                        请输入您对“{title}”的具体修改意见或创作要求。AI 将基于您的想法重新生成内容。
                    </p>
                    <textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full h-32 bg-white border border-gray-200 rounded-lg p-3 text-gray-900 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none resize-none shadow-sm transition-all"
                        placeholder="例如：希望这个情节更反转一点... / 希望主角表现得更冷酷..."
                        autoFocus
                    />
                </div>
                <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50/50 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
                    <button
                        onClick={() => {
                            onSubmit(value);
                            setValue("");
                            onClose();
                        }}
                        disabled={!value.trim()}
                        className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
                    >
                        确认重新生成
                    </button>
                </div>
            </div>
        </div>
    );
};

export const JudgeResultModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    content: string;
    onSelectProposal?: (proposalIndex: number) => void;
}> = ({ isOpen, onClose, content, onSelectProposal }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-red-200 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 ring-4 ring-red-50 ring-offset-0">
                <div className="flex justify-between items-center p-4 border-b border-red-100 bg-red-50/50 h-16 rounded-t-xl">
                    <h3 className="text-lg font-serif font-bold text-red-900 flex items-center">
                        <Gavel className="mr-2 text-red-700" size={20} /> 选题生死官 · 判决书
                    </h3>
                    <button onClick={onClose} className="text-red-400 hover:text-red-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto bg-white">
                    <div className="prose prose-red max-w-none prose-sm sm:prose-base prose-headings:font-serif prose-headings:text-red-950 prose-p:text-gray-800 prose-strong:text-red-900 leading-relaxed font-serif">
                        <MarkdownViewer content={content} />
                    </div>
                </div>
                <div className="p-4 border-t border-red-100 bg-red-50/30 rounded-b-xl">
                    <div className="flex flex-col gap-3">
                        <div className="text-sm text-red-600/80 text-center mb-2 font-serif">
                            判官已提供优化方案，您可以选择采纳其中一个方案重写DNA，或保持原样
                        </div>
                        <div className="flex gap-3 justify-center flex-wrap">
                            {onSelectProposal && (
                                <>
                                    <button
                                        onClick={() => { onSelectProposal(1); onClose(); }}
                                        className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white border border-red-900 rounded-lg transition-colors font-bold shadow-sm"
                                    >
                                        采纳方案一
                                    </button>
                                    <button
                                        onClick={() => { onSelectProposal(2); onClose(); }}
                                        className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white border border-red-900 rounded-lg transition-colors font-bold shadow-sm"
                                    >
                                        采纳方案二
                                    </button>
                                    <button
                                        onClick={() => { onSelectProposal(3); onClose(); }}
                                        className="px-6 py-2 bg-red-900 hover:bg-red-800 text-white border border-red-900 rounded-lg transition-colors font-bold shadow-sm"
                                    >
                                        采纳方案三
                                    </button>
                                </>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-lg transition-colors font-medium"
                            >
                                保持原样
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ConfigModal: React.FC<{ isOpen: boolean; onClose: () => void; config: ApiConfig; onSave: (c: ApiConfig) => void }> = ({ isOpen, onClose, config, onSave }) => {
    // 模型预设配置
    const MODEL_PRESETS = {
        google: {
            baseUrl: 'https://generativelanguage.googleapis.com',
            models: [
                { value: 'gemini-3-pro-preview', label: 'Gemini 3.0 Pro (Preview)' },
                { value: 'gemini-3-flash-preview', label: 'Gemini 3.0 Flash (Preview)' },
                { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
                { value: 'gemini-2.5-pro-preview', label: 'Gemini 2.5 Pro (Preview)' },
                { value: 'custom', label: '自定义' }
            ]
        },
        openai: {
            baseUrl: 'https://api.openai.com',
            models: [
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-3.5-turbo-instruct', label: 'GPT-3.5 Turbo Instruct' },
                { value: 'custom', label: '自定义' }
            ]
        },
        claude: {
            baseUrl: 'https://api.anthropic.com',
            models: [
                { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
                { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
                { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
                { value: 'claude-2.1', label: 'Claude 2.1' },
                { value: 'custom', label: '自定义' }
            ]
        },
        deepseek: {
            baseUrl: 'https://api.deepseek.com',
            models: [
                { value: 'deepseek-chat', label: 'DeepSeek Chat' },
                { value: 'deepseek-coder', label: 'DeepSeek Coder' },
                { value: 'deepseek-r1', label: 'DeepSeek R1' },
                { value: 'custom', label: '自定义' }
            ]
        },
        custom: {
            baseUrl: '',
            models: [
                { value: 'custom', label: '自定义' }
            ]
        }
    };

    // 初始化配置
    const initialConfig = {
        provider: 'google' as const,
        baseUrl: 'https://generativelanguage.googleapis.com',
        apiKey: '',
        textModel: 'gemini-2.5-flash',
        customTextModel: ''
    };

    // 状态管理
    const [localConfig, setLocalConfig] = useState(config || initialConfig);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [testMessage, setTestMessage] = useState('');

    useEffect(() => {
        setLocalConfig(config || initialConfig);
    }, [config, isOpen]);

    // 处理provider变化，自动更新baseUrl和默认模型
    const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const provider = e.target.value as ApiConfig['provider'];
        const preset = MODEL_PRESETS[provider];

        setLocalConfig(prev => ({
            ...prev,
            provider,
            baseUrl: preset.baseUrl,
            textModel: preset.models[0].value
        }));

        // 重置测试结果
        setTestResult(null);
        setTestMessage('');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalConfig(prev => ({ ...prev, [name]: value }));

        // 重置测试结果
        setTestResult(null);
        setTestMessage('');
    };

    // 处理测试连接
    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        setTestMessage('正在测试连接...');

        try {
            const result = await testConnection(localConfig);
            setTestResult(result.success ? 'success' : 'error');
            setTestMessage(result.message);
        } catch (error: any) {
            setTestResult('error');
            setTestMessage(`连接失败: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-gray-100 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 ring-1 ring-black/5">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white h-16 rounded-t-xl">
                    <h3 className="text-lg font-serif font-bold text-gray-900 flex items-center">
                        <Settings className="mr-2 text-black" size={20} /> 配置接口
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {/* 模型提供商选择 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">🏢 模型提供商</label>
                        <select
                            name="provider"
                            value={localConfig.provider}
                            onChange={handleProviderChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all"
                        >
                            <option value="google">Google Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="claude">Anthropic Claude</option>
                            <option value="deepseek">DeepSeek</option>
                            <option value="custom">自定义 (OpenAI兼容)</option>
                        </select>
                    </div>

                    {/* 基本网址 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">🔗 地址 (基本网址)</label>
                        <input
                            name="baseUrl"
                            value={localConfig.baseUrl}
                            onChange={handleChange}
                            placeholder={MODEL_PRESETS[localConfig.provider].baseUrl}
                            className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    {/* API密钥 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">🔑 API密钥</label>
                        <input
                            name="apiKey"
                            type="password"
                            value={localConfig.apiKey}
                            onChange={handleChange}
                            placeholder="sk-..."
                            className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all placeholder:text-gray-400"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {localConfig.provider === 'google' && '获取API密钥: https://aistudio.google.com/app/apikey'}
                            {localConfig.provider === 'openai' && '获取API密钥: https://platform.openai.com/api-keys'}
                            {localConfig.provider === 'claude' && '获取API密钥: https://console.anthropic.com/settings/keys'}
                            {localConfig.provider === 'deepseek' && '获取API密钥: https://platform.deepseek.com/apikeys'}
                            {localConfig.provider === 'custom' && '输入第三方OpenAI兼容API密钥'}
                        </p>
                    </div>

                    {/* 文本模型选择 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">🤖 文本模型名称 (Text Model)</label>
                        <select
                            name="textModel"
                            value={localConfig.textModel}
                            onChange={handleChange}
                            className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all"
                        >
                            {MODEL_PRESETS[localConfig.provider].models.map(model => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                        {localConfig.textModel === 'custom' && (
                            <input
                                name="customTextModel"
                                value={localConfig.customTextModel || ''}
                                onChange={handleChange}
                                placeholder="输入自定义模型名称，例如：gpt-4o, claude-3-opus等"
                                className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm text-gray-900 mt-2 focus:border-black focus:ring-1 focus:ring-black/5 outline-none transition-all"
                            />
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
                    {/* 测试结果反馈 */}
                    {testResult && (
                        <div className={`flex items-center mb-4 p-3 rounded-lg ${testResult === 'success' ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                            {testResult === 'success' ? (
                                <CheckCircle2 size={18} className="text-emerald-500 mr-2" />
                            ) : (
                                <AlertCircle size={18} className="text-red-500 mr-2" />
                            )}
                            <span className={`text-sm ${testResult === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {testMessage}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting || !localConfig.apiKey}
                            className="text-gray-500 hover:text-black text-sm flex items-center transition-colors disabled:opacity-50"
                        >
                            {isTesting ? <RefreshCw className="animate-spin mr-2" size={16} /> : <div className="w-4 h-4 mr-2 rounded-full border border-gray-400"></div>}
                            测试连接
                        </button>

                        <div className="flex space-x-3">
                            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-medium transition-colors">取消</button>
                            <button
                                onClick={() => {
                                    onSave(localConfig);
                                    onClose();
                                }}
                                className="px-6 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
                            >
                                保存配置
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
