'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  MdSend,
  MdAttachFile,
  MdMoreVert,
  MdSearch,
  MdCall,
  MdVideocam,
  MdInfo,
  MdDelete,
  MdCheckCircle,
  MdDone,
  MdDoneAll,
  MdSchedule
} from 'react-icons/md';

interface Conversation {
  _id: string;
  contactPhone: string;
  contactName: string;
  lastMessage: string;
  unreadCount: number;
  lastMessageAt: string;
  status: 'open' | 'closed' | 'archived';
}

interface Message {
  _id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: 'pending' | 'sent' | 'delivered' | 'read';
  sentAt: string;
  senderPhone: string;
}

export default function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [isClient, setIsClient] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = Array.isArray(response.data.data) ? response.data.data : response.data.data?.conversations || [];
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [token]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/messages/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = Array.isArray(response.data.data) ? response.data.data : response.data.data?.messages || [];
      setMessages(data.sort((a: Message, b: Message) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [token]);

  // Load conversations on mount
  useEffect(() => {
    if (isClient && token) {
      fetchConversations();
    }
  }, [isClient, token, fetchConversations]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation?._id) {
      fetchMessages(selectedConversation._id);
    }
  }, [selectedConversation, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/messages/conversations/${selectedConversation._id}/messages`,
        {
          message: messageInput.trim(),
          phoneNumberId: selectedConversation.contactPhone
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessageInput('');
        // Add message to UI optimistically
        const newMessage: Message = {
          _id: response.data.data?._id || Date.now().toString(),
          content: messageInput.trim(),
          direction: 'outbound',
          status: 'sent',
          sentAt: new Date().toISOString(),
          senderPhone: selectedConversation.contactPhone
        };
        setMessages([...messages, newMessage]);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactPhone?.includes(searchQuery)
  );

  const formatTime = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
        return <MdDoneAll className="text-blue-500 text-sm" />;
      case 'delivered':
        return <MdDone className="text-gray-500 text-sm" />;
      case 'sent':
        return <MdCheckCircle className="text-gray-400 text-sm" />;
      case 'pending':
        return <MdSchedule className="text-gray-300 text-sm" />;
      default:
        return null;
    }
  };

  if (!isClient) return null;

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={() => {}}>
        <div className="w-full h-full flex bg-slate-50">
          {/* Conversations Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Messages</h1>
              <div className="relative">
                <MdSearch className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full border border-slate-200 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-2"></div>
                    <p className="text-slate-600 text-sm">Loading...</p>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-500">
                    <MdInfo className="text-4xl mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredConversations.map((conversation) => (
                    <motion.button
                      key={conversation._id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                        selectedConversation?._id === conversation._id ? 'bg-green-50 border-l-4 border-green-500' : ''
                      }`}
                      whileHover={{ backgroundColor: 'rgb(248, 250, 252)' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm truncate">
                              {conversation.contactName || conversation.contactPhone}
                            </h3>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 truncate mt-1">{conversation.lastMessage}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-white">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div>
                  <h2 className="font-bold text-slate-900">
                    {selectedConversation.contactName || selectedConversation.contactPhone}
                  </h2>
                  <p className="text-xs text-slate-600">{selectedConversation.contactPhone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <MdCall className="text-xl" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <MdVideocam className="text-xl" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <MdMoreVert className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-2"></div>
                      <p className="text-slate-600 text-sm">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-500 text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                            message.direction === 'outbound'
                              ? 'bg-green-500 text-white rounded-br-none'
                              : 'bg-slate-200 text-slate-900 rounded-bl-none'
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                            <span>{formatTime(message.sentAt)}</span>
                            {message.direction === 'outbound' && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-end gap-3">
                  <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
                    <MdAttachFile className="text-xl" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-100 rounded-full border border-slate-200 focus:outline-none focus:border-green-500 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    className="p-2 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 text-white rounded-full transition-colors"
                  >
                    <MdSend className="text-xl" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="text-center">
                <MdInfo className="text-6xl text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a conversation</h2>
                <p className="text-slate-600">Choose a conversation from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
