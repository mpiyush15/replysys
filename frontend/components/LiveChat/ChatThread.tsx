'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MdSend, MdAttachFile } from 'react-icons/md';

interface Message {
  _id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  senderPhone: string;
  recipientPhone: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  messageType: string;
}

interface Conversation {
  _id: string;
  contactPhone: string;
  contactName: string;
}

interface ChatThreadProps {
  token: string | null;
  selectedConversation: Conversation | null;
}

export function ChatThread({ token, selectedConversation }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation?._id) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/messages?conversationId=${selectedConversation._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation?._id, token]);

  useEffect(() => {
    if (selectedConversation?._id && token) {
      fetchMessages();
    }
  }, [selectedConversation?._id, token, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !token) return;

    try {
      setSending(true);
      const newMessage: Message = {
        _id: Date.now().toString(),
        content: messageText,
        direction: 'outbound',
        senderPhone: '', // Will be set by backend
        recipientPhone: selectedConversation.contactPhone,
        status: 'pending',
        createdAt: new Date().toISOString(),
        messageType: 'text',
      };

      // Add optimistically
      setMessages([...messages, newMessage]);
      setMessageText('');

      // Send to backend
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/messages/send`,
        {
          to: selectedConversation.contactPhone,
          message: messageText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh messages
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!selectedConversation) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Select a conversation to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <h3 className="font-bold text-slate-900">
          {selectedConversation.contactName || selectedConversation.contactPhone}
        </h3>
        <p className="text-sm text-slate-600">{selectedConversation.contactPhone}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.direction === 'outbound'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm break-words">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.direction === 'outbound' ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {msg.direction === 'outbound' && ` · ${msg.status}`}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600">
            <MdAttachFile className="text-xl" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <MdSend className="text-xl" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
