'use client';

export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MdSync, MdAdd, MdDelete, MdCheckCircle, MdPending, MdClose, MdSearch } from 'react-icons/md';

interface Template {
  _id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  bodyText: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const user = useAuthStore((state) => state.user);
  const [isClient, setIsClient] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en_US',
    bodyText: '',
    headerText: '',
    footerText: '',
    phoneNumberId: ''
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPhoneNumbers = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/oauth/whatsapp/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.data?.phoneNumbers) {
        setPhoneNumbers(response.data.data.phoneNumbers);
        if (response.data.data.phoneNumbers.length > 0) {
          setFormData((prev) => ({
            ...prev,
            phoneNumberId: response.data.data.phoneNumbers[0].id
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch phone numbers:', error);
    }
  }, [token]);

  useEffect(() => {
    if (isClient && token) {
      fetchTemplates();
      fetchPhoneNumbers();
    }
  }, [isClient, token, fetchTemplates, fetchPhoneNumbers]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates/sync`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates(response.data.data || []);
      alert(`✅ Synced ${response.data.data?.length || 0} template(s) from Meta`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phoneNumberId) {
      alert('Please select a phone number');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates([...templates, response.data.data]);
      setShowForm(false);
      setFormData({
        name: '',
        category: 'UTILITY',
        language: 'en_US',
        bodyText: '',
        headerText: '',
        footerText: '',
        phoneNumberId: phoneNumbers[0]?.id || ''
      });
      alert('✅ Template created (pending Meta approval)');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates(templates.filter((t) => t._id !== id));
      alert('✅ Deleted');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <MdCheckCircle className="text-green-500" />;
    if (status === 'PENDING') return <MdPending className="text-yellow-500" />;
    return <MdClose className="text-red-500" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (!isClient) return null;

  return (
    <ProtectedRoute requiredRole="client">
      <DashboardLayout onSettingsClick={() => {}}>
        <div className="w-full h-full p-6 overflow-hidden flex flex-col bg-slate-50">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-slate-900">Message Templates</h1>
              <div className="flex gap-2">
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  <MdSync className={syncing ? 'animate-spin' : ''} />
                  Sync from Meta
                </button>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  <MdAdd /> Create
                </button>
              </div>
            </div>

            <div className="relative">
              <MdSearch className="absolute left-3 top-3 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg border border-blue-200 p-6 mb-6">
              <h2 className="text-lg font-bold mb-4">Create Template</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Template name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
                <select
                  value={formData.phoneNumberId}
                  onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select phone...</option>
                  {phoneNumbers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayPhoneNumber}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option>UTILITY</option>
                  <option>MARKETING</option>
                  <option>AUTHENTICATION</option>
                  <option>SERVICE_UPDATE</option>
                </select>
                <input
                  type="text"
                  placeholder="Language"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Body text (use {{1}}, {{2}} for variables)"
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  className="col-span-2 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                  required
                />
                <div className="col-span-2 flex gap-2">
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit to Meta
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-slate-300 rounded-lg hover:bg-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-600">No templates</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Language</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((template) => (
                    <tr key={template._id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium">{template.name}</td>
                      <td className="px-6 py-3 text-sm">{template.category}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(template.status)}
                          <span>{template.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">{template.language}</td>
                      <td className="px-6 py-3 text-sm">{formatDate(template.createdAt)}</td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDelete(template._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
