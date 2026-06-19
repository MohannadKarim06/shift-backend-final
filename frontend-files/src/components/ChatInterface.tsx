import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, User, Bot, Sparkles, RefreshCw, Copy, Check, Image as ImageIcon, X } from 'lucide-react';
import { ChatMessage, Workflow } from '../types';
import { generateWorkflowAgentResponse } from '../services/api';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

interface ChatInterfaceProps {
  workflow: Workflow;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ workflow }) => {
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial greeting
    const greeting = t('chatGreeting').replace('{title}', workflow.title);
    
    setMessages([{ role: 'model', text: greeting }]);
  }, [workflow, t]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !image) || loading) return;

    const userMessage: ChatMessage = { role: 'user', text: input, image: image || undefined };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentImage = image;
    setInput('');
    setImage(null);
    setLoading(true);

    try {
      const response = await generateWorkflowAgentResponse(workflow, messages, currentInput, currentImage || undefined);
      const modelMessage: ChatMessage = { role: 'model', text: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: t('chatError') }]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-100">
            <Bot size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">{workflow.title} {t('admin').toLowerCase() === 'admin' ? 'Agent' : t('admin')}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{t('onlineReady')}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', text: t('chatResetMsg').replace('{title}', workflow.title) }])}
          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title={t('resetChat')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-zinc-900 text-white" : "bg-red-50 text-red-600"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed relative group",
                msg.role === 'user' 
                  ? "bg-zinc-900 text-white rounded-tr-none" 
                  : "bg-zinc-50 text-zinc-800 border border-zinc-100 rounded-tl-none"
              )}>
                {msg.image && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-zinc-700">
                    <img 
                      src={msg.image} 
                      alt="User uploaded" 
                      className="max-w-full h-auto max-h-64 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => copyToClipboard(msg.text)}
                    className="absolute -right-10 top-0 p-2 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex gap-4 mr-auto max-w-[85%]">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600 flex-shrink-0 mt-1">
              <Sparkles size={16} className="animate-spin" />
            </div>
            <div className="p-4 bg-zinc-50 text-zinc-400 border border-zinc-100 rounded-2xl rounded-tl-none text-sm italic flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {t('agentThinking')}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50">
        <AnimatePresence>
          {image && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-3 relative inline-block"
            >
              <img 
                src={image} 
                alt="Upload preview" 
                className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-md"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 p-1 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
              >
                <X size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative flex items-center gap-2">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-500 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
            title={t('uploadImage')}
          >
            <ImageIcon size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('chatPlaceholder')}
            className={cn(
              "flex-1 py-3 bg-white border-zinc-200 focus:border-red-600 focus:ring-0 rounded-xl text-sm shadow-sm transition-all",
              isRTL ? "pr-4 pl-12" : "pl-4 pr-12"
            )}
          />
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !image) || loading}
            className={cn(
              "absolute p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:bg-zinc-400",
              isRTL ? "left-2" : "right-2"
            )}
          >
            <Send size={18} className={cn(isRTL && "rotate-180")} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2 text-center font-medium uppercase tracking-widest">
          {'Powered by Claude'}
        </p>
      </div>
    </div>
  );
};
