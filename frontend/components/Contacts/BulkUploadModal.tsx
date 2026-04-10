'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MdCheckCircle, MdUpload } from 'react-icons/md';
import axios from 'axios';
import { Modal } from '@/components/Modal/Modal';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactsAdded: () => void;
  token: string | null;
}

export function BulkUploadModal({ isOpen, onClose, onContactsAdded, token }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'}/api/client/contacts/bulk`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSuccessCount(response.data.count || 0);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setSuccessCount(0);
        onContactsAdded();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to upload contacts. Check if backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Upload Contacts"
      subtitle="Import multiple contacts from CSV file"
      size="md"
      footer={
        !success && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-900 rounded-lg hover:bg-slate-50 transition font-medium text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 font-medium text-sm"
            >
              {loading ? 'Uploading...' : 'Upload Contacts'}
            </button>
          </div>
        )
      }
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12"
        >
          <MdCheckCircle className="text-5xl text-green-600 mb-4" />
          <p className="text-lg font-semibold text-slate-900">{successCount} Contacts Uploaded!</p>
          <p className="text-sm text-slate-600 mt-2">Redirecting...</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CSV Format Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-900 mb-2">📋 CSV Format:</p>
            <pre className="text-xs text-blue-800 bg-white p-2 rounded overflow-x-auto">
{`name,phoneNumber,email,tags,notes
John,+1234567890,john@mail.com,"vip",Great
Jane,+9876543210,,lead,New`}
            </pre>
          </div>

          {/* File Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select CSV File *</label>
            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-input"
              />
              <label
                htmlFor="csv-input"
                className="flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
              >
                <MdUpload className="text-xl text-slate-600" />
                <span className="text-sm text-slate-600">
                  {file ? `📄 ${file.name}` : 'Click to upload or drag file'}
                </span>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Info */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
            <p>✓ Column headers: name*, phoneNumber* (required)</p>
            <p>✓ Optional: email, tags, notes</p>
            <p>✓ Tags: comma-separated inside quotes</p>
          </div>
        </form>
      )}
    </Modal>
  );
}
