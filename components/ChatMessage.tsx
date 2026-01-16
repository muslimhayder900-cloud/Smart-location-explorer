
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div className={`message-bubble flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm border ${
            isUser 
              ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
              : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
          }`}
        >
          <div className="text-[14px] leading-relaxed">
            {message.content}
          </div>
          
          {message.location && isUser && (
            <div className="mt-2 pt-1 border-t border-blue-400 text-[10px] flex items-center gap-1 opacity-80">
              <i className="fas fa-location-dot"></i>
              <span>موقعي الحالي</span>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 justify-end">
            {message.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.maps?.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-colors"
              >
                <i className="fas fa-map-marker-alt"></i>
                <span className="truncate max-w-[120px]">{source.maps?.title}</span>
              </a>
            ))}
          </div>
        )}
        
        <span className="text-[10px] text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
