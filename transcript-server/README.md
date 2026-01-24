# Transcript Server for Mood Leaf

Local server that fetches YouTube transcripts reliably, bypassing YouTube's anti-scraping measures.

## Quick Start

```bash
cd transcript-server
npm install
npm start
```

Server runs on `http://localhost:3333`

## Why This Exists

YouTube blocks direct transcript requests from mobile apps (React Native). This server runs on your computer where those restrictions don't apply.

## Usage

1. **Start the server** (keep this terminal open):
   ```bash
   cd transcript-server
   npm install   # only first time
   npm start
   ```

2. **Use the app normally** - The interview processor will automatically use this server.

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
  "segments": [...],
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

## Troubleshooting

**Server won't start?**
```bash
# Make sure you're in the right directory
cd transcript-server

# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

**App says "Local server not running"?**
- Make sure the server terminal is still open
- Check it says "Running on http://localhost:3333"
- Try opening http://localhost:3333 in your browser

**No transcript for a video?**
- Some videos genuinely don't have captions
- Try a different video to test
