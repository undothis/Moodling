'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { exportData, fetchStatistics } from '@/lib/api';
import {
  Download,
  FileJson,
  FileText,
  Database,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Brain,
  Heart,
} from 'lucide-react';
import clsx from 'clsx';

type ExportFormat = 'alpaca' | 'chatml' | 'sharegpt' | 'conversations' | 'jsonl' | 'raw';

function FormatCard({
  format,
  title,
  description,
  icon: Icon,
  selected,
  onSelect,
}: {
  format: ExportFormat;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        'p-6 rounded-xl border-2 text-left transition-all',
        selected
          ? 'border-leaf-500 bg-leaf-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      )}
    >
      <Icon
        className={clsx(
          'w-8 h-8 mb-3',
          selected ? 'text-leaf-500' : 'text-gray-400'
        )}
      />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </button>
  );
}

export default function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('alpaca');
  const [status, setStatus] = useState<string>('approved');
  const [exportedData, setExportedData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: fetchStatistics,
  });

  const { mutate: doExport, isPending } = useMutation({
    mutationFn: () => exportData(format, status),
    onSuccess: (data) => {
      setExportedData(data);
    },
  });

  const handleCopy = () => {
    if (exportedData) {
      navigator.clipboard.writeText(JSON.stringify(exportedData.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (exportedData) {
      const blob = new Blob([JSON.stringify(exportedData.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-data-${format}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Export Training Data</h1>
        <p className="text-gray-500 mt-1">
          Export approved insights for Llama fine-tuning
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Available for Export</h3>
            <p className="text-sm text-gray-500 mt-1">
              Based on your current insight data
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-500">Approved:</span>
              <span className="font-semibold text-green-600 ml-2">
                {stats?.approved_insights || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Pending:</span>
              <span className="font-semibold text-yellow-600 ml-2">
                {stats?.pending_insights || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total:</span>
              <span className="font-semibold text-gray-900 ml-2">
                {stats?.total_insights || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Export Format</h3>

        {/* Recommended Formats */}
        <p className="text-sm text-gray-500 mb-3">Recommended for Training:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <FormatCard
            format="chatml"
            title="ChatML Format"
            description="Best for Llama 3+, OpenAI. Multi-turn with system prompt and emotional context."
            icon={MessageSquare}
            selected={format === 'chatml'}
            onSelect={() => setFormat('chatml')}
          />
          <FormatCard
            format="sharegpt"
            title="ShareGPT Format"
            description="Best for Unsloth. Community standard format with human/gpt roles."
            icon={Brain}
            selected={format === 'sharegpt'}
            onSelect={() => setFormat('sharegpt')}
          />
          <FormatCard
            format="conversations"
            title="Rich Conversations"
            description="Full multi-turn with emotional context, therapeutic techniques, and metadata."
            icon={Heart}
            selected={format === 'conversations'}
            onSelect={() => setFormat('conversations')}
          />
        </div>

        {/* Legacy Formats */}
        <p className="text-sm text-gray-500 mb-3">Other Formats:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormatCard
            format="alpaca"
            title="Alpaca Format"
            description="Classic instruction/input/output format. Simple but single-turn only."
            icon={FileText}
            selected={format === 'alpaca'}
            onSelect={() => setFormat('alpaca')}
          />
          <FormatCard
            format="jsonl"
            title="JSONL"
            description="JSON Lines with basic message arrays. Lightweight format."
            icon={FileJson}
            selected={format === 'jsonl'}
            onSelect={() => setFormat('jsonl')}
          />
          <FormatCard
            format="raw"
            title="Raw Data"
            description="Complete insight data with all scores, emotional context, and metadata."
            icon={Database}
            selected={format === 'raw'}
            onSelect={() => setFormat('raw')}
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-4">Include Insights</h3>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
        >
          <option value="approved">Approved Only (Recommended)</option>
          <option value="pending">Pending (For Review)</option>
          <option value="">All Insights</option>
        </select>
      </div>

      {/* Export Button */}
      <div className="mb-8">
        <button
          onClick={() => doExport()}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-3 bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Data
            </>
          )}
        </button>
      </div>

      {/* Export Result */}
      {exportedData && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-gray-900">
                Exported {exportedData.count} examples
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-leaf-500 text-white rounded-lg hover:bg-leaf-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          <div className="p-4 max-h-96 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(exportedData.data.slice(0, 3), null, 2)}
              {exportedData.data.length > 3 && (
                <span className="text-gray-400">
                  {'\n\n'}... and {exportedData.data.length - 3} more examples
                </span>
              )}
            </pre>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Training Guide</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Start */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Quick Start (Easiest)</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Export in <strong>ShareGPT</strong> format</li>
              <li>Use <strong>Unsloth</strong> with free Colab notebook</li>
              <li>Train Llama 3.2 3B (fits on 12GB GPU)</li>
              <li>Export to GGUF for mobile deployment</li>
            </ol>
          </div>

          {/* Recommended Stack */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Recommended For MoodLeaf</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Export in <strong>ChatML</strong> format</li>
              <li>Fine-tune Llama 3.1 8B with QLoRA</li>
              <li>Deploy on-device (iOS/Android) or cloud</li>
              <li>Use emotional context for empathetic responses</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2">Format Comparison</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>ChatML</strong> → Llama 3+, includes system prompt, emotional context</p>
            <p><strong>ShareGPT</strong> → Unsloth, community datasets, human/gpt roles</p>
            <p><strong>Conversations</strong> → Maximum data richness, therapeutic techniques tagged</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a
            href="https://github.com/unslothai/unsloth"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-leaf-600 hover:text-leaf-700"
          >
            Unsloth (2x Faster)
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://docs.unsloth.ai/get-started/fine-tuning-llms-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-leaf-600 hover:text-leaf-700"
          >
            Unsloth Tutorial
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://huggingface.co/docs/transformers/main/en/peft"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-leaf-600 hover:text-leaf-700"
          >
            HuggingFace PEFT
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
