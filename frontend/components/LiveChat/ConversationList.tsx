'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { MdSearch } from 'react-icons/md';

interface Conversation {
  _id: string;
  contactPhone: string;
  contactName: string;
  lastMessage: string;
  lastMessageType: 'inbound' | 'outbound';
  unreadCount: number;
  lastMessageAt: string;
  status: 'open' | 'closed' | 'archived';
}

interface ConversationListProps {
  token: string | null;
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  token,
  selectedConversation,
  onSelectConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'REQUESTING' | 'INTERVENED'>('ACTIVE');

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contactPhone?.includes(searchQuery)
  );

  const tabs = [
    { name: 'ACTIVE', count: conversations.filter(c => c.status === 'open').length },
    { name: 'REQUESTING', count: conversations.filter(c => c.unreadCount > 0).length },
    { name: 'INTERVENED', count: 0 },
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Messages</h2>

        {/* Search */}
        <div className="relative">
          <MdSearch className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or phone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4 pt-3">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name as any)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition ${
              activeTab === tab.name
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.name}({tab.count})
          </button>
        ))}
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-600">
            <p className="text-sm">No conversations</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <motion.button
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                whileHover={{ scale: 1.01 }}
                className={`w-full p-3 rounded-lg text-left transition ${
                  selectedConversation?._id === conversation._id
                    ? 'bg-slate-100 border border-slate-900'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {conversation.contactName?.charAt(0).toUpperCase() || '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-slate-900 truncate">
                        {conversation.contactName || conversation.contactPhone}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-1">
                      {conversation.lastMessageType === 'inbound' ? '📥' : '📤'}{' '}
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
