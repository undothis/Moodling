'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLogs } from '@/lib/api';
import { Terminal, ChevronUp, ChevronDown, RefreshCw, X } from 'lucide-react';
import clsx from 'clsx';

export default function LogsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [lineCount, setLineCount] = useState(50);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', lineCount],
    queryFn: () => fetchLogs(lineCount),
    refetchInterval: isOpen ? 3000 : false,
    enabled: isOpen,
  });

  const levelColors: Record<string, string> = {
    ERROR: 'text-red-400',
    WARNING: 'text-yellow-400',
    INFO: 'text-blue-400',
    DEBUG: 'text-gray-400',
  };

  return (
    <div className="fixed bottom-0 left-64 right-0 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -top-10 right-4 flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-t-lg hover:bg-gray-700"
      >
        <Terminal className="w-4 h-4" />
        Logs
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Logs Panel */}
      {isOpen && (
        <div className="bg-gray-900 border-t border-gray-700 h-64 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <span className="text-white text-sm font-medium">System Logs</span>
              <select
                value={lineCount}
                onChange={(e) => setLineCount(Number(e.target.value))}
                className="px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded"
              >
                <option value={20}>20 lines</option>
                <option value={50}>50 lines</option>
                <option value={100}>100 lines</option>
                <option value={200}>200 lines</option>
              </select>
              <button
                onClick={() => refetch()}
                className="p-1 text-gray-400 hover:text-white"
              >
                <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Log Content */}
          <div className="flex-1 overflow-auto p-2 font-mono text-xs">
            {isLoading && !data ? (
              <div className="text-gray-500">Loading logs...</div>
            ) : data?.entries && data.entries.length > 0 ? (
              <div className="space-y-0.5">
                {data.entries.map((entry, i) => (
                  <div key={i} className="flex gap-2 hover:bg-gray-800 px-1">
                    <span className="text-gray-500 shrink-0">
                      {entry.timestamp}
                    </span>
                    <span className={clsx('shrink-0 w-16', levelColors[entry.level] || 'text-gray-400')}>
                      [{entry.level}]
                    </span>
                    <span className="text-gray-300 break-all">
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No logs available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
