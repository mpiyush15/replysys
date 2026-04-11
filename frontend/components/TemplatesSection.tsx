'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSync, MdAdd, MdDelete, MdCheckCircle, MdPending, MdClose } from 'react-icons/md';

interface Template {
  _id: string;
  name: string;
  status: string;
  category: string;
  bodyText: string;
  variables?: any[];
}

export function TemplatesSection({ token }: { token: string | null }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    bodyText: '',
    headerText: '',
    footerText: '',
    phoneNumberId: ''
  });

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
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

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
      console.error('Failed to sync templates:', error);
      alert(error.response?.data?.message || 'Failed to sync templates');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates([...templates, response.data.data]);
      setShowCreateForm(false);
      setFormData({ name: '', category: 'UTILITY', bodyText: '', headerText: '', footerText: '', phoneNumberId: '' });
      alert('✅ Template created successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/templates/${templateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTemplates(templates.filter((t) => t._id !== templateId));
      alert('✅ Template deleted');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete template');
    }
  };

  useEffect(() => {
    if (token) fetchTemplates();
  }, [token, fetchTemplates]);

  const getStatusIcon = (status: string) => {
    if (status === 'APPROVED') return <MdCheckCircle className="text-green-500 text-lg" />;
    if (status === 'PENDING') return <MdPending className="text-yellow-500 text-lg" />;
    return <MdClose className="text-red-500 text-lg" />;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Message Templates</h2>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 font-medium transition"
        >
          <MdSync className={syncing ? 'animate-spin' : ''} />
          Sync Templates
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="inline-block w-6 h-6 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-600 text-sm mb-3">No templates yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
          >
            <MdAdd /> Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {templates.map((template) => (
              <motion.div
                key={template._id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-50 p-3 rounded border border-slate-200 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(template.status)}
                    <h3 className="font-medium text-slate-900 text-sm">{template.name}</h3>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      {template.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{template.bodyText}</p>
                </div>
                <button
                  onClick={() => handleDeleteTemplate(template._id)}
                  className="ml-2 p-1.5 hover:bg-red-100 text-red-600 rounded transition"
                >
                  <MdDelete className="text-lg" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Order Confirmation"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option>UTILITY</option>
                <option>MARKETING</option>
                <option>AUTHENTICATION</option>
                <option>SERVICE_UPDATE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Message Body</label>
              <textarea
                value={formData.bodyText}
                onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                placeholder="Template text (use {{1}}, {{2}} for variables)"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium transition"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-3 py-1.5 bg-slate-300 text-slate-900 rounded text-xs hover:bg-slate-400 font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
