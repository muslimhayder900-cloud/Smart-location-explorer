
import React, { useState, useRef, useEffect } from 'react';
import { callGeminiWithMaps } from './services/geminiService';
import { Message, Location } from './types';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'أهلاً بك! أنا مستشارك الذكي للمواقع. كيف يمكنني مساعدتك اليوم في العثور على وجهتك القادمة؟',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location | undefined>(undefined);
  
  // إعدادات الخط
  const [showSettings, setShowSettings] = useState(false);
  const [fontColor, setFontColor] = useState('text-yellow-500');
  const [fontSize, setFontSize] = useState('text-[15px]');
  const [fontWeight, setFontWeight] = useState('font-semibold');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Location error:", err.message),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      location: location
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await callGeminiWithMaps(input, location);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "عذراً، لم أستطع إتمام البحث حالياً. يرجى التأكد من اتصالك بالإنترنت.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fontColors = [
    { label: 'أصفر', value: 'text-yellow-500', bg: 'bg-yellow-500' },
    { label: 'أزرق', value: 'text-blue-600', bg: 'bg-blue-600' },
    { label: 'أسود', value: 'text-black', bg: 'bg-black' },
    { label: 'أبيض', value: 'text-white', bg: 'bg-white border border-gray-200' },
    { label: 'أخضر', value: 'text-green-600', bg: 'bg-green-600' },
  ];

  const fontSizes = [
    { label: 'صغير', value: 'text-sm' },
    { label: 'متوسط', value: 'text-[15px]' },
    { label: 'كبير', value: 'text-lg' },
    { label: 'ضخم', value: 'text-xl' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <i className="fas fa-location-arrow text-xl"></i>
          </div>
          <h1 className="font-bold text-gray-800">مستكشف المواقع الذكي</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="تخصيص الخط"
          >
            <i className="fas fa-font"></i>
          </button>
          
          <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${location ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {location ? 'الموقع مفعل' : 'الموقع غير مفعل'}
          </div>
        </div>
      </header>

      {/* Font Settings Overlay */}
      {showSettings && (
        <div className="absolute top-16 left-6 bg-white border border-gray-100 shadow-2xl rounded-2xl p-5 z-30 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="font-bold text-gray-800 text-sm">تخصيص شريط البحث</h3>
            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-2">لون الخط</p>
              <div className="flex flex-wrap gap-2">
                {fontColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFontColor(color.value)}
                    className={`w-8 h-8 rounded-full ${color.bg} ${fontColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''} transition-all`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-2">حجم الخط</p>
              <div className="flex flex-wrap gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize(size.value)}
                    className={`px-3 py-1 text-[11px] rounded-lg border ${fontSize === size.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-2">نمط الخط</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFontWeight('font-semibold')}
                  className={`flex-1 py-1 text-[11px] rounded-lg border ${fontWeight === 'font-semibold' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  عريض
                </button>
                <button
                  onClick={() => setFontWeight('font-normal')}
                  className={`flex-1 py-1 text-[11px] rounded-lg border ${fontWeight === 'font-normal' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  عادي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-slate-50/50">
        <div className="max-w-3xl mx-auto">
          {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          {isLoading && (
            <div className="flex justify-end mb-4">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                <div className="animate-pulse flex space-x-1 space-x-reverse">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-400 font-medium">جاري البحث...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-4 border-t shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ابحث عن مكان (مثلاً: مطاعم قريبة، صيدلية...)"
            className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-300 ${fontColor} ${fontSize} ${fontWeight}`}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-blue-100"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
