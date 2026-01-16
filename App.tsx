
import React, { useState, useRef, useEffect } from 'react';
import { callGeminiWithMaps } from './services/geminiService';
import { Message, Location } from './types';
import ChatMessage from './components/ChatMessage';

const STORAGE_KEY = 'smart_explorer_chat_history';

const App: React.FC = () => {
  // تحميل الرسائل من التخزين المحلي عند البدء
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // تحويل السلاسل الزمنية إلى كائنات Date
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'أهلاً بك! أنا مستشارك الذكي للمواقع. كيف يمكنني مساعدتك اليوم في العثور على وجهتك القادمة باستخدام خرائط Google؟',
        timestamp: new Date(),
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<Location | undefined>(undefined);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // إعدادات الخط
  const [showSettings, setShowSettings] = useState(false);
  const [fontColor, setFontColor] = useState('text-yellow-500');
  const [fontSize, setFontSize] = useState('text-[15px]');
  const [fontWeight, setFontWeight] = useState('font-semibold');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // تحقق من حالة الإشعارات عند البدء
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // حفظ الرسائل في التخزين المحلي عند كل تغيير
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
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

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === 'granted');
    if (permission === 'granted') {
      new Notification("تم تفعيل الإشعارات", {
        body: "سنقوم بتنبيهك عند استلام ردود جديدة وأحداث محلية.",
        icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png"
      });
    }
  };

  const sendNotification = (content: string) => {
    if (notificationsEnabled && document.visibilityState === 'hidden') {
      new Notification("رسالة جديدة من المستكشف", {
        body: content,
        icon: "https://cdn-icons-png.flaticon.com/512/854/854878.png"
      });
    }
  };

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
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        sources: response.sources
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      sendNotification(response.text);
      
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

  const clearChat = () => {
    if (confirm("هل تريد بالتأكيد مسح سجل المحادثة؟")) {
      const welcomeMsg: Message = {
        id: 'welcome',
        role: 'assistant',
        content: 'أهلاً بك! أنا مستشارك الذكي للمواقع. كيف يمكنني مساعدتك اليوم؟',
        timestamp: new Date(),
      };
      setMessages([welcomeMsg]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const openInGoogleMaps = () => {
    if (location) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps`, '_blank');
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
          {/* أيقونة التطبيق الدائرية - تم تغييرها من rounded-lg إلى rounded-full */}
          <div className="bg-[#1a2b3c] p-2.5 rounded-full text-white shadow-lg ring-2 ring-blue-500/20">
            <i className="fas fa-search-location text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-gray-800 leading-none tracking-tight">مستكشف المواقع</h1>
            <span className="text-[9px] text-blue-500 font-extrabold uppercase tracking-widest">Smart Site Explorer</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={clearChat}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-red-500 transition-colors text-xs font-bold"
            title="مسح السجل"
          >
            <i className="fas fa-history"></i>
          </button>

          <button 
            onClick={openInGoogleMaps}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a2b3c] text-white rounded-full text-xs font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            <i className="fas fa-map"></i>
            <span className="hidden sm:inline">الخرائط</span>
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-100"
            title="الإعدادات"
          >
            <i className="fas fa-sliders"></i>
          </button>
          
          <div className={`w-3 h-3 rounded-full shadow-inner ${location ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title={location ? 'الموقع نشط' : 'الموقع غير متاح'}></div>
        </div>
      </header>

      {/* Settings Overlay */}
      {showSettings && (
        <div className="absolute top-16 left-6 bg-white border border-gray-100 shadow-2xl rounded-3xl p-6 z-30 w-80 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-5 border-b pb-3">
            <div className="flex items-center gap-2">
              <i className="fas fa-magic text-blue-500"></i>
              <h3 className="font-bold text-gray-800 text-sm">التخصيص الذكي</h3>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="space-y-5">
            {/* التنبيهات */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">نظام التنبيهات</p>
              <button
                onClick={requestNotificationPermission}
                disabled={notificationsEnabled}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full border text-[12px] transition-all ${
                  notificationsEnabled 
                    ? 'bg-green-50 border-green-100 text-green-700 font-bold' 
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`fas ${notificationsEnabled ? 'fa-bell' : 'fa-bell-slash'}`}></i>
                  <span>{notificationsEnabled ? 'الإشعارات نشطة' : 'تفعيل الإشعارات'}</span>
                </div>
                {notificationsEnabled && <i className="fas fa-check-circle"></i>}
              </button>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">لون التمييز</p>
              <div className="flex flex-wrap gap-2.5">
                {fontColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setFontColor(color.value)}
                    className={`w-7 h-7 rounded-full ${color.bg} ${fontColor === color.value ? 'ring-4 ring-blue-500/20 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'} transition-all`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">حجم النص</p>
              <div className="flex flex-wrap gap-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize(size.value)}
                    className={`px-3 py-1.5 text-[11px] rounded-full border font-medium ${fontSize === size.value ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t">
              <button 
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 hover:bg-red-50 rounded-full text-[12px] font-bold transition-all border border-transparent hover:border-red-100"
              >
                <i className="fas fa-trash-can"></i>
                <span>مسح كافة المحادثات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto">
          {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
          {isLoading && (
            <div className="flex justify-end mb-4">
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="flex space-x-1.5 space-x-reverse">
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-[11px] text-blue-500 font-bold tracking-tight">جاري البحث في الخرائط...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white p-5 border-t border-gray-100">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3 items-center">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ابحث عن مطعم، مقهى، أو مكان..."
              className={`w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all placeholder:text-gray-300 shadow-inner ${fontColor} ${fontSize} ${fontWeight}`}
              disabled={isLoading}
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-200 transition-colors group-focus-within:text-blue-200">
              <i className="fas fa-location-crosshairs"></i>
            </div>
          </div>
          {/* زر البحث الدائري - تم تغييره من rounded-xl إلى rounded-full */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-blue-200 flex-shrink-0"
          >
            <i className={`fas ${isLoading ? 'fa-circle-notch fa-spin' : 'fa-magnifying-glass'} text-lg`}></i>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
