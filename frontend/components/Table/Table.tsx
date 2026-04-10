'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MdArrowUpward, MdArrowDownward, MdSearch, MdChevronLeft, MdChevronRight } from 'react-icons/md';

export interface TableColumn {
  key: string;
  label: string;
  width?: string; // e.g., "w-1/4", "w-32"
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  rowKey: string;
  onRowClick?: (row: any) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: any[]) => void;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  actions?: (row: any) => React.ReactNode;
}

export function Table({
  columns,
  data,
  rowKey,
  onRowClick,
  selectable = false,
  onSelectionChange,
  searchable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data found',
  actions,
}: TableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter((row) => {
      return columns.some((col) => {
        if (!col.searchable) return false;
        const value = row[col.key];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginate
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleSelectRow = (rowId: string) => {
    let newSelected = [...selectedRows];
    if (newSelected.includes(rowId)) {
      newSelected = newSelected.filter((id) => id !== rowId);
    } else {
      newSelected.push(rowId);
    }
    setSelectedRows(newSelected);
    if (onSelectionChange) {
      onSelectionChange(data.filter((row) => newSelected.includes(row[rowKey])));
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
      if (onSelectionChange) onSelectionChange([]);
    } else {
      const allRowIds = paginatedData.map((row) => row[rowKey]);
      setSelectedRows(allRowIds);
      if (onSelectionChange) {
        onSelectionChange(paginatedData);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-slate-200">
          <MdSearch className="text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 outline-none text-sm bg-transparent text-slate-900"
          />
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-700 ${
                    col.width || ''
                  } ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <span>
                        {sortOrder === 'asc' ? (
                          <MdArrowUpward className="text-slate-400 text-sm" />
                        ) : (
                          <MdArrowDownward className="text-slate-400 text-sm" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">Actions</th>}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-3 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-slate-500 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <motion.tr
                  key={row[rowKey] || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row[rowKey])}
                        onChange={() => handleSelectRow(row[rowKey])}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={`${row[rowKey]}-${col.key}`}
                      className={`px-4 py-3 text-sm text-slate-900 ${col.width || ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {actions(row)}
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-4">
          <p className="text-sm text-slate-600">
            Page {currentPage} of {totalPages} • {sortedData.length} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdChevronLeft />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
