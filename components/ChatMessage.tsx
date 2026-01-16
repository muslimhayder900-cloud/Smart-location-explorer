
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-start animate-slide-in-left' : 'justify-end'}`}>
      <div className={`message-bubble flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm border transition-all ${
            isUser 
              ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
              : 'bg-white text-gray-800 border-gray-200 rounded-tl-none hover:shadow-md'
          }`}
        >
          <div className="text-[14px] leading-relaxed">
            {message.content}
          </div>
          
          {message.location && isUser && (
            <div className="mt-2 pt-1 border-t border-blue-400 text-[10px] flex items-center gap-1 opacity-80">
              <i className="fas fa-location-dot"></i>
              <span>موقع البحث: {message.location.latitude.toFixed(2)}, {message.location.longitude.toFixed(2)}</span>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 justify-end max-w-full">
            {message.sources.map((source, idx) => {
              const item = source.maps || source.web;
              const isMap = !!source.maps;
              
              return (
                <a
                  key={idx}
                  href={item?.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border shadow-sm hover:scale-105 ${
                    isMap 
                    ? 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100' 
                    : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <i className={isMap ? "fas fa-map-location-dot" : "fas fa-globe-americas"}></i>
                  <span className="truncate max-w-[150px]">{item?.title || 'فتح الرابط'}</span>
                </a>
              );
            })}
          </div>
        )}
        
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
