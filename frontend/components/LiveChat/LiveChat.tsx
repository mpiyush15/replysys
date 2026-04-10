'use client';

import { useState, useEffect } from 'react';
import { ConversationList } from './ConversationList';
import { ChatThread } from './ChatThread';
import { ContactProfile } from './ContactProfile';

interface Conversation {
  _id: string;
  contactPhone: string;
  contactName: string;
  contactEmail?: string;
  lastMessage: string;
  lastMessageType: 'inbound' | 'outbound';
  unreadCount: number;
  lastMessageAt: string;
  status: 'open' | 'closed' | 'archived';
  tags?: string[];
  notes?: string;
}

interface LiveChatProps {
  token: string | null;
}

export function LiveChat({ token }: LiveChatProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(true);

  // Close profile on mobile when conversation changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsProfileOpen(false);
    }
  }, [selectedConversation]);

  return (
    <div className="flex h-full w-full bg-slate-50">
      {/* Left Column - Conversation List */}
      <ConversationList
        token={token}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
      />

      {/* Middle Column - Chat Thread */}
      <ChatThread token={token} selectedConversation={selectedConversation} />

      {/* Right Column - Contact Profile (Toggle on mobile) */}
      <div className="hidden lg:flex">
        <ContactProfile
          selectedConversation={selectedConversation}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>

      {/* Mobile Profile Toggle Button */}
      <button
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className="lg:hidden fixed bottom-4 right-4 bg-slate-900 text-white p-3 rounded-full shadow-lg"
      >
        👤
      </button>

      {/* Mobile Profile Modal */}
      {isProfileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50">
          <ContactProfile
            selectedConversation={selectedConversation}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
