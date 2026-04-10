'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MdAdd, MdUpload, MdRefresh } from 'react-icons/md';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Table, TableColumn } from '@/components/Table/Table';
import { AddContactModal } from '@/components/Contacts/AddContactModal';
import { BulkUploadModal } from '@/components/Contacts/BulkUploadModal';
import { ContactDetailsView } from '@/components/Contacts/ContactDetailsView';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/contacts`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContacts(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDeleteContact = async (contact: any) => {
    if (!token) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/contacts/${contact._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContacts((prev) => prev.filter((c) => c._id !== contact._id));
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      alert('Failed to delete contact');
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      searchable: true,
      width: 'w-1/3',
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      searchable: true,
      width: 'w-1/4',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      searchable: true,
      width: 'w-1/4',
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (value: string[]) =>
        value && value.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {tag}
              </span>
            ))}
            {value.length > 2 && (
              <span className="px-2 py-1 text-xs text-slate-600">+{value.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-sm">-</span>
        ),
      width: 'w-1/4',
    },
  ];

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={() => {}}>
        <div className="w-full h-full p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
                <p className="text-sm text-slate-600 mt-1">Manage your WhatsApp Business contacts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsBulkOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition text-sm font-medium"
                >
                  <MdUpload />
                  Bulk Upload
                </button>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm font-medium"
                >
                  <MdAdd />
                  Add Contact
                </button>
                <button
                  onClick={fetchContacts}
                  disabled={loading}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                >
                  <MdRefresh className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">Total Contacts</p>
                <p className="text-2xl font-semibold text-slate-900">{contacts.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">This Month</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {contacts.filter((c) => {
                    const date = new Date(c.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-600 mb-1">Tagged</p>
                <p className="text-2xl font-semibold text-slate-900">
                  {contacts.filter((c) => c.tags && c.tags.length > 0).length}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              <Table
                columns={columns}
                data={contacts}
                rowKey="_id"
                loading={loading}
                emptyMessage="No contacts found. Add one to get started!"
                onRowClick={(contact) => {
                  setSelectedContact(contact);
                  setIsDetailsOpen(true);
                }}
                pagination
                pageSize={10}
              />
            </div>
          </motion.div>
        </div>

        {/* Modals */}
        <AddContactModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onContactAdded={fetchContacts}
          token={token}
        />
        <BulkUploadModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
          onContactsAdded={fetchContacts}
          token={token}
        />
        <ContactDetailsView
          contact={selectedContact}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedContact(null);
          }}
          onDelete={handleDeleteContact}
          token={token}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
