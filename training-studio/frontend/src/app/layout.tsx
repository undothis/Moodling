'use client';

import './globals.css';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Youtube,
  Play,
  CheckSquare,
  BarChart3,
  Download,
  Leaf,
  Key,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { getApiKeyStatus, setApiKey } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/channels', label: 'Channels', icon: Youtube },
  { href: '/process', label: 'Process', icon: Play },
  { href: '/review', label: 'Review', icon: CheckSquare },
  { href: '/stats', label: 'Statistics', icon: BarChart3 },
  { href: '/export', label: 'Export', icon: Download },
];

function ApiKeyConfig() {
  const queryClient = useQueryClient();
  const [showInput, setShowInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const { data: keyStatus } = useQuery({
    queryKey: ['api-key-status'],
    queryFn: getApiKeyStatus,
  });

  const { mutate: saveKey, isPending } = useMutation({
    mutationFn: setApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-key-status'] });
      setShowInput(false);
      setApiKeyInput('');
    },
  });

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      saveKey(apiKeyInput.trim());
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-4 h-4 text-gray-400" />
        <span className="text-xs font-medium text-gray-600">Claude API Key</span>
      </div>

      {showInput ? (
        <div className="space-y-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-leaf-500"
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={isPending || !apiKeyInput.trim()}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-leaf-500 text-white text-xs rounded hover:bg-leaf-600 disabled:opacity-50"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => setShowInput(false)}
              className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className={clsx(
            'w-full px-2 py-1 text-xs rounded border transition-colors',
            keyStatus?.configured
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-yellow-300 bg-yellow-50 text-yellow-700'
          )}
        >
          {keyStatus?.configured ? `Configured ${keyStatus.masked_key}` : 'Click to configure'}
        </button>
      )}
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-leaf-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">Training Studio</h1>
            <p className="text-xs text-gray-500">MoodLeaf AI Training</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-leaf-50 text-leaf-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* API Key Config */}
      <ApiKeyConfig />

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">
          Backend: localhost:8000
        </p>
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
