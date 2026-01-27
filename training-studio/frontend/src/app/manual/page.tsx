'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Book, ChevronDown, ChevronRight, FileText, ArrowUp } from 'lucide-react';
import clsx from 'clsx';

// Manual content - would be better to fetch from backend, but inline for simplicity
const MANUAL_CONTENT = `
# MoodLeaf AI Training System - Comprehensive Manual

## Overview

The MoodLeaf AI Training System is designed to create a specialized, human-like AI companion by training on curated human experience data.

### Do I Need Llama Installed?

**No, not for the current workflow.**

| Task | Requires Llama? | What It Uses |
|------|-----------------|--------------|
| Import insights manually | No | Local storage |
| Harvest from YouTube channels | No | **Claude API** |
| Review and approve insights | No | Local storage |
| Export training data | No | Local JSON |
| **Fine-tune local model** | **Yes** | Llama 3.2 + LoRA |

## Quick Start: Transcript Server

**Before processing YouTube channels, set up the transcript server:**

### 1. Install yt-dlp (one time)
\`\`\`bash
brew install yt-dlp
\`\`\`

### 2. Start the server
\`\`\`bash
cd transcript-server
npm install   # only first time
npm start
\`\`\`

## API Keys & Token Setup

### Required: Anthropic API Key (Claude)

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Go to **API Keys** in the sidebar
4. Click **Create Key**
5. Copy the key (starts with \`sk-ant-\`)

### Optional: Hugging Face Token (Speaker Diarization)

Only needed if you want "who said what" labeling in transcripts.

1. Go to https://huggingface.co/pyannote/speaker-diarization-3.1
2. Click **"Agree and access repository"**
3. Go to https://huggingface.co/settings/tokens
4. Create a **Read** token

## System Architecture

The MoodLeaf Training Studio consists of:

- **Backend (FastAPI)**: Python API server at port 8000
- **Frontend (Next.js)**: React UI at port 3000
- **Transcript Server**: Node.js server at port 3333 for YouTube downloads
- **SQLite Database**: Local storage for all training data

## Data Collection Pipeline

### Processing a YouTube Video

1. **Add Channel**: Go to Channels page, paste YouTube channel URL
2. **Browse Videos**: Expand channel to see available videos
3. **Process Video**: Click "Process" to extract transcript and insights
4. **Review Insights**: Go to Review page to approve/reject insights

### Batch Processing

Use the Batch Videos page to queue multiple videos for processing:
- Select videos from different channels
- Set processing priority
- Monitor progress on Dashboard

## Brain Studio & Visualization

### Brain View

Shows two side-by-side brains:
- **Current State**: Your actual training data distribution
- **Goal State**: Your target configuration

### Goals Tab

Manage your training goals:
- **Add Goal**: Set target percentages for categories
- **Edit Goal**: Modify target %, priority, recommended sources
- **Delete Goal**: Remove goals you no longer need

### Training Gaps

Shows what categories need more content:
- Priority indicators (red/yellow/gray)
- Smart suggestions for how many videos to process
- Quick links to Batch Process page

## Review Page

Where you approve, reject, or edit insights:

- **Approve**: Mark insight as training-ready
- **Reject**: Remove from training data
- **Edit**: Modify the insight text
- **Aliveness Score**: 1-10 rating for how authentic/human the insight sounds

## Export Page

Export your approved insights for fine-tuning:

- **JSON Format**: For custom training pipelines
- **JSONL Format**: For Llama fine-tuning
- **CSV Format**: For analysis in spreadsheets

## Statistics Page

View analytics about your training data:

- Total insights by category
- Channel contributions
- Approval rates
- Aliveness score distributions

## Dashboard

The main homepage showing:

- **Processing Jobs**: Active video processing with component status
- **System Diagnostics**: Live monitoring of all pipeline components
- **Recent Activity**: Latest processed videos and insights

### Component Status

When processing, you'll see status for each component:
- yt_dlp: Video download
- ffmpeg: Audio extraction
- whisper: Speech-to-text
- diarization: Speaker labeling
- prosody: Emotion detection
- facial: Facial analysis
- claude: Insight extraction

## Troubleshooting

### Common Issues

**"No transcript available"**
- Ensure transcript server is running
- Check yt-dlp is installed and updated

**"API key not configured"**
- Add ANTHROPIC_API_KEY to backend/.env

**"Diarization failed"**
- HuggingFace token may be missing
- Check pyannote model access is approved

### Updating Components

\`\`\`bash
# Update yt-dlp
brew upgrade yt-dlp

# Update backend dependencies
cd backend && pip install -r requirements.txt

# Update frontend
cd frontend && npm install
\`\`\`
`;

interface Section {
  title: string;
  level: number;
  content: string;
  subsections: Section[];
}

function parseManual(content: string): Section[] {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let currentContent: string[] = [];
  let stack: { section: Section; level: number }[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);
    const h4Match = line.match(/^#### (.+)$/);

    if (h1Match || h2Match || h3Match || h4Match) {
      // Save content to previous section
      if (stack.length > 0) {
        stack[stack.length - 1].section.content = currentContent.join('\n').trim();
      }
      currentContent = [];

      const match = h1Match || h2Match || h3Match || h4Match;
      const level = h1Match ? 1 : h2Match ? 2 : h3Match ? 3 : 4;
      const newSection: Section = {
        title: match![1],
        level,
        content: '',
        subsections: [],
      };

      // Pop stack until we find a parent with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        sections.push(newSection);
      } else {
        stack[stack.length - 1].section.subsections.push(newSection);
      }

      stack.push({ section: newSection, level });
    } else {
      currentContent.push(line);
    }
  }

  // Save remaining content
  if (stack.length > 0) {
    stack[stack.length - 1].section.content = currentContent.join('\n').trim();
  }

  return sections;
}

function highlightText(text: string, query: string): JSX.Element {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SectionCard({ section, query, depth = 0 }: { section: Section; query: string; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2 || query.length > 0);
  const hasMatch = query && (
    section.title.toLowerCase().includes(query.toLowerCase()) ||
    section.content.toLowerCase().includes(query.toLowerCase()) ||
    section.subsections.some(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.content.toLowerCase().includes(query.toLowerCase())
    )
  );

  useEffect(() => {
    if (hasMatch) setIsExpanded(true);
  }, [hasMatch, query]);

  if (query && !hasMatch) return null;

  return (
    <div className={clsx("border-l-2", depth === 0 ? "border-leaf-500" : "border-gray-200", depth > 0 && "ml-4")}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50",
          hasMatch && "bg-yellow-50"
        )}
      >
        {section.subsections.length > 0 || section.content ? (
          isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <div className="w-4" />
        )}
        <span className={clsx(
          depth === 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700",
          depth >= 2 && "text-sm"
        )}>
          {highlightText(section.title, query)}
        </span>
      </button>

      {isExpanded && (
        <div className="pl-6">
          {section.content && (
            <div className="prose prose-sm max-w-none py-2 px-3 text-gray-600">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {highlightText(section.content, query)}
              </pre>
            </div>
          )}
          {section.subsections.map((sub, i) => (
            <SectionCard key={i} section={sub} query={query} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManualPage() {
  const [query, setQuery] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const sections = useMemo(() => parseManual(MANUAL_CONTENT), []);

  const matchCount = useMemo(() => {
    if (!query.trim()) return 0;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = MANUAL_CONTENT.match(regex);
    return matches ? matches.length : 0;
  }, [query]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-leaf-500 rounded-xl flex items-center justify-center">
          <Book className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Manual</h1>
          <p className="text-sm text-gray-500">Search and browse the MoodLeaf documentation</p>
        </div>
      </div>

      {/* Search */}
      <div className="sticky top-0 z-10 bg-gray-50 py-3 -mx-6 px-6 mb-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manual... (e.g., 'transcript', 'API key', 'brain')"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-500 focus:border-transparent"
          />
          {query && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-gray-500">{matchCount} matches</span>
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      {!query && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Quick Start', search: 'Quick Start' },
            { label: 'API Keys', search: 'API Key' },
            { label: 'Brain Studio', search: 'Brain Studio' },
            { label: 'Troubleshooting', search: 'Troubleshooting' },
          ].map((item) => (
            <button
              key={item.search}
              onClick={() => setQuery(item.search)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {sections.map((section, i) => (
          <SectionCard key={i} section={section} query={query} />
        ))}
      </div>

      {/* No Results */}
      {query && matchCount === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No results found for "{query}"</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or browse sections above</p>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-leaf-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-leaf-600"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
