# Transcript Server for Mood Leaf

Local server that fetches YouTube transcripts using **yt-dlp** (the gold standard for YouTube extraction).

## Prerequisites

**Install yt-dlp** (required):
```bash
brew install yt-dlp
```

## Quick Start

```bash
cd transcript-server
npm install
npm start
```

Server runs on `http://localhost:3333`

## Why This Exists

YouTube blocks direct transcript requests from mobile apps. This server runs on your computer using yt-dlp, which reliably extracts subtitles from YouTube videos.

## Usage

1. **Install yt-dlp** (one time):
   ```bash
   brew install yt-dlp
   ```

2. **Start the server** (keep this terminal open):
   ```bash
   cd transcript-server
   npm install   # only first time
   npm start
   ```

3. **Use the app normally** - The interview processor will automatically use this server.

## API Endpoints

### GET /transcript?v=VIDEO_ID
Fetch transcript for a single video.

```bash
curl "http://localhost:3333/transcript?v=dQw4w9WgXcQ"
```

Response:
```json
{
  "videoId": "dQw4w9WgXcQ",
  "transcript": "Full transcript text...",
  "charCount": 1234
}
```

### POST /batch-transcripts
Fetch multiple transcripts at once.

```bash
curl -X POST http://localhost:3333/batch-transcripts \
  -H "Content-Type: application/json" \
  -d '{"videoIds": ["video1", "video2"]}'
```

### POST /claude-extract
Proxy Claude API calls for insight extraction (React Native can't call external APIs directly).

```bash
curl -X POST http://localhost:3333/claude-extract \
  -H "Content-Type: application/json" \
  -d '{"transcript": "...", "videoTitle": "...", "videoId": "...", "channelName": "...", "categories": [...], "apiKey": "sk-..."}'
```

## Troubleshooting

**"yt-dlp not found"?**
```bash
brew install yt-dlp
```

**Server won't start?**
```bash
cd transcript-server
rm -rf node_modules
npm install
npm start
```

**App says "Cannot connect to transcript server"?**
- Make sure the server terminal is still open
- Check it shows "Running on http://localhost:3333"
- If on real iOS device (not simulator), edit `youtubeProcessorService.ts` to use your computer's IP

**No transcript for a video?**
- Some videos genuinely don't have captions
- yt-dlp will show the reason in the server terminal

## Updating yt-dlp

YouTube changes often. Keep yt-dlp updated:
```bash
brew upgrade yt-dlp
```
