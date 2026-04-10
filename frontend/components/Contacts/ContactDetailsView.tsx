'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdEdit, MdDelete } from 'react-icons/md';
import axios from 'axios';
import { Modal } from '@/components/Modal/Modal';

interface ContactDetailsViewProps {
  contact: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contact: any) => void;
  onDelete?: (contact: any) => void;
  token: string | null;
}

export function ContactDetailsView({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  token,
}: ContactDetailsViewProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  useEffect(() => {
    if (isOpen && contact?.id) {
      fetchConversations();
    }
  }, [isOpen, contact?.id]);

  const fetchConversations = async () => {
    if (!contact?.phoneNumber) return;
    
    setLoadingConvs(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/contacts/${contact.id}/conversations`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setConversations(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoadingConvs(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact?.name || 'Contact Details'}
      subtitle={contact?.phoneNumber}
      size="md"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(contact)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2"
            >
              <MdEdit className="text-lg" /> Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this contact?')) {
                  onDelete(contact);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              <MdDelete className="text-lg" />
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* Contact Info */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase mb-3">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-600">Phone</span>
              <span className="text-sm font-medium text-slate-900">{contact?.phoneNumber}</span>
            </div>
            {contact?.email && (
              <div className="flex justify-between">
                <span className="text-xs text-slate-600">Email</span>
                <span className="text-sm font-medium text-slate-900">{contact.email}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-xs text-slate-600">Added</span>
              <span className="text-sm text-slate-900">
                {new Date(contact?.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {contact?.tags && contact.tags.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact?.notes && (
          <div>
            <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Notes</h3>
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{contact.notes}</p>
          </div>
        )}

        {/* Conversations */}
        <div>
          <h3 className="text-xs font-semibold text-slate-600 uppercase mb-2">Recent Conversations</h3>
          {loadingConvs ? (
            <div className="flex justify-center py-4">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-slate-600">No conversations yet</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {conversations.map((conv: any, idx: number) => (
                <div key={idx} className="p-2 bg-slate-50 rounded text-xs">
                  <p className="font-medium text-slate-900">{conv.lastMessage || 'No message'}</p>
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(conv.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}