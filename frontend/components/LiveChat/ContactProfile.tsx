'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';

interface Conversation {
  _id: string;
  contactPhone: string;
  contactName: string;
  contactEmail?: string;
  status: 'open' | 'closed' | 'archived';
  unreadCount: number;
  tags?: string[];
  notes?: string;
  lastMessageAt: string;
}

interface ContactProfileProps {
  selectedConversation: Conversation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContactProfile({ selectedConversation, isOpen, onClose }: ContactProfileProps) {
  const [expandedSections, setExpandedSections] = useState({
    payments: false,
    campaigns: false,
    attributes: false,
    tags: false,
    journey: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!selectedConversation) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shadow-lg"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Chat Profile</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition"
            >
              <MdClose className="text-xl text-slate-600" />
            </button>
          </div>

          {/* Contact Info */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center font-bold text-lg">
                {selectedConversation.contactName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-bold text-slate-900">
                  {selectedConversation.contactName || 'Unknown'}
                </p>
                <p className="text-sm text-slate-600">
                  {selectedConversation.contactPhone}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className="font-medium text-slate-900 capitalize">
                  {selectedConversation.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Last Active</span>
                <span className="font-medium text-slate-900">
                  {new Date(selectedConversation.lastMessageAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unread</span>
                <span className="font-medium text-slate-900">
                  {selectedConversation.unreadCount}
                </span>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="flex-1 overflow-y-auto">
            {/* Payments */}
            <motion.div className="border-b border-slate-200">
              <button
                onClick={() => toggleSection('payments')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">Payments</span>
                {expandedSections.payments ? (
                  <MdExpandLess className="text-xl text-slate-600" />
                ) : (
                  <MdExpandMore className="text-xl text-slate-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.payments && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-sm text-slate-600"
                  >
                    <p>No payment data</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Campaigns */}
            <motion.div className="border-b border-slate-200">
              <button
                onClick={() => toggleSection('campaigns')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">Campaigns</span>
                {expandedSections.campaigns ? (
                  <MdExpandLess className="text-xl text-slate-600" />
                ) : (
                  <MdExpandMore className="text-xl text-slate-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.campaigns && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-sm text-slate-600"
                  >
                    <p>No campaign data</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Attributes */}
            <motion.div className="border-b border-slate-200">
              <button
                onClick={() => toggleSection('attributes')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">Attributes</span>
                {expandedSections.attributes ? (
                  <MdExpandLess className="text-xl text-slate-600" />
                ) : (
                  <MdExpandMore className="text-xl text-slate-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.attributes && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-sm text-slate-600"
                  >
                    <p>No attribute data</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tags */}
            <motion.div className="border-b border-slate-200">
              <button
                onClick={() => toggleSection('tags')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">Tags</span>
                {expandedSections.tags ? (
                  <MdExpandLess className="text-xl text-slate-600" />
                ) : (
                  <MdExpandMore className="text-xl text-slate-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.tags && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 space-y-2"
                  >
                    {selectedConversation.tags && selectedConversation.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedConversation.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-slate-200 text-slate-900 px-2 py-1 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No tags</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Customer Journey */}
            <motion.div className="border-b border-slate-200">
              <button
                onClick={() => toggleSection('journey')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">Customer Journey</span>
                {expandedSections.journey ? (
                  <MdExpandLess className="text-xl text-slate-600" />
                ) : (
                  <MdExpandMore className="text-xl text-slate-600" />
                )}
              </button>
              <AnimatePresence>
                {expandedSections.journey && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-sm text-slate-600"
                  >
                    <p>No journey data</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
