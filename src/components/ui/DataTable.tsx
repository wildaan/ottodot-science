'use client';

import * as React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';

export interface Column<T> {
  id?: string;
  header: string;
  accessorKey: keyof T | string;
  sortable?: boolean;
  sortValueAccessor?: (row: T) => any;
  renderCell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T | string;
  searchPlaceholder?: string;
  filterKey?: keyof T | string;
  filterPlaceholder?: string;
  filterOptions?: { label: string; value: string }[];
  defaultSortKey?: keyof T | string;
  defaultSortDirection?: 'asc' | 'desc';
  pageSize?: number;
  showPagination?: boolean;
  mobileCardRender?: (row: T) => React.ReactNode;
  emptyState?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Cari...',
  filterKey,
  filterPlaceholder = 'Semua Status',
  filterOptions,
  defaultSortKey,
  defaultSortDirection = 'asc',
  pageSize = 5,
  showPagination = true,
  mobileCardRender,
  emptyState,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterValue, setFilterValue] = React.useState('');
  const [sortKey, setSortKey] = React.useState<keyof T | string | undefined>(defaultSortKey);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(defaultSortDirection);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  // Reset to first page on search or filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterValue]);

  // Search & Filter & Sort Logic
  const processedData = React.useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery && searchKey) {
      result = result.filter((item) => {
        const value = item[searchKey as string];
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter
    if (filterValue && filterKey) {
      result = result.filter((item) => {
        const value = item[filterKey as string];
        return String(value) === filterValue;
      });
    }

    // Sort
    if (sortKey) {
      const column = columns.find((col) => col.accessorKey === sortKey);
      result.sort((a, b) => {
        let valA = column?.sortValueAccessor ? column.sortValueAccessor(a) : a[sortKey as string];
        let valB = column?.sortValueAccessor ? column.sortValueAccessor(b) : b[sortKey as string];

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchKey, filterValue, filterKey, sortKey, sortDirection, columns]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(processedData.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = React.useMemo(() => {
    if (!showPagination) return processedData;
    const startIdx = (safeCurrentPage - 1) * rowsPerPage;
    return processedData.slice(startIdx, startIdx + rowsPerPage);
  }, [processedData, safeCurrentPage, rowsPerPage, showPagination]);

  const startEntry = processedData.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;
  const endEntry = Math.min(safeCurrentPage * rowsPerPage, processedData.length);

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const renderDefaultMobileCard = (row: T, index: number) => {
    return (
      <div
        key={index}
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
      >
        {columns.map((col, colIdx) => {
          const val = col.renderCell ? col.renderCell(row) : row[col.accessorKey as string];
          return (
            <div key={col.id || `${String(col.accessorKey)}-${colIdx}`} className="flex justify-between items-start gap-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {col.header}
              </span>
              <span className="text-sm font-medium text-slate-700 text-right">{val}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search and Filter */}
      {(searchKey || filterKey) && (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            {searchKey && (
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border-slate-200 rounded-xl bg-white shadow-2xs w-full focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20"
                />
              </div>
            )}
          </div>
          {filterKey && filterOptions && (
            <div className="w-full sm:w-48">
              <Select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full border-slate-200 rounded-xl bg-white shadow-2xs focus:border-teal-500 focus:ring-1"
                options={[
                  { label: filterPlaceholder, value: '' },
                  ...filterOptions,
                ]}
              />
            </div>
          )}
        </div>
      )}

      {/* Table & Mobile Card View */}
      {processedData.length === 0 ? (
        emptyState || (
          <div className="py-12 text-center text-slate-400 text-sm">Tidak ada data ditemukan.</div>
        )
      ) : (
        <>
          {/* Mobile view (stacked cards) */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {paginatedData.map((row, idx) =>
              mobileCardRender ? mobileCardRender(row) : renderDefaultMobileCard(row, idx)
            )}
          </div>

          {/* Desktop view (table) */}
          <div className="hidden sm:block overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75">
                    {columns.map((col, colIdx) => {
                      const isSorted = sortKey === col.accessorKey;
                      const colKey = col.id || `${String(col.accessorKey)}-${colIdx}`;
                      return (
                        <th
                          key={colKey}
                          onClick={() => col.sortable && handleSort(col.accessorKey)}
                          className={`p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider select-none ${
                            col.sortable ? 'cursor-pointer hover:bg-slate-100/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span>{col.header}</span>
                            {col.sortable && (
                              <span className="text-slate-400">
                                {isSorted ? (
                                  sortDirection === 'asc' ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )
                                ) : (
                                  <div className="flex flex-col opacity-30 hover:opacity-100">
                                    <ChevronUp className="w-3 h-3 -mb-1" />
                                    <ChevronDown className="w-3 h-3" />
                                  </div>
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      {columns.map((col, colIdx) => {
                        const colKey = col.id || `${String(col.accessorKey)}-${colIdx}`;
                        return (
                          <td key={colKey} className="p-4 text-slate-700">
                            {col.renderCell ? col.renderCell(row) : row[col.accessorKey as string]}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          {showPagination && processedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Menampilkan <strong className="text-slate-700 font-semibold">{startEntry}</strong> - <strong className="text-slate-700 font-semibold">{endEntry}</strong> dari <strong className="text-slate-700 font-semibold">{processedData.length}</strong> data
                </span>
                <div className="hidden sm:flex items-center gap-1 ml-3 border-l border-slate-200 pl-3">
                  <span className="text-slate-400">Baris per halaman:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-teal-500 cursor-pointer shadow-2xs"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(Number(page))}
                          className={`h-8 w-8 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                            safeCurrentPage === page
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
