# Training Studio Frontend

Next.js web interface for MoodLeaf AI training data management.

## Overview

This frontend provides:
- Dashboard with processing statistics
- Channel management (add/remove YouTube channels)
- Video browsing and processing
- Insight review and approval workflow
- Statistics visualization
- Training data export

## Prerequisites

- Node.js 18+
- Backend running on port 8000

## Setup

```bash
# Navigate to frontend directory
cd training-studio/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

### Dashboard (`/`)
Overview with key statistics, active processing jobs, and pending insights.

### Channels (`/channels`)
- Add YouTube channels for harvesting
- View channel statistics
- Browse recommended channels

### Process (`/process`)
- Paste video URLs for quick processing
- Browse and process videos from added channels
- Monitor active processing jobs

### Review (`/review`)
- Review pending insights
- Approve/reject insights
- Filter by status and category

### Statistics (`/stats`)
- Visualize category distribution
- Quality score breakdown
- Approval rate metrics

### Export (`/export`)
- Export training data in Alpaca format
- Export as JSONL for ChatML
- Download raw data

## Technology

- **Next.js 14** - React framework
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Recharts** - Charts and visualizations
- **Lucide React** - Icons

## API Proxy

The Next.js config proxies `/api/*` requests to `http://localhost:8000/*` (the backend).
