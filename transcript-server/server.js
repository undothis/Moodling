/**
 * Transcript Server for Mood Leaf
 *
 * Simple local server that fetches YouTube transcripts.
 * Run this on your machine, and the app will call it.
 *
 * Usage:
 *   cd transcript-server
 *   npm install
 *   npm start
 *
 * The server runs on http://localhost:3333
 */

const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
const PORT = 3333;

// Enable CORS for the app to call this server
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcript server is running',
    endpoints: {
      transcript: 'GET /transcript?v=VIDEO_ID',
      batch: 'POST /batch-transcripts { videoIds: [...] }'
    }
  });
});

// Fetch single transcript
app.get('/transcript', async (req, res) => {
  const videoId = req.query.v || req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing video ID. Use ?v=VIDEO_ID' });
  }

  console.log(`[Transcript] Fetching transcript for: ${videoId}`);

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcriptItems || transcriptItems.length === 0) {
      return res.status(404).json({
        error: 'No transcript available',
        videoId
      });
    }

    // Combine all text segments
    const fullTranscript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`[Transcript] Success: ${fullTranscript.length} chars, ${transcriptItems.length} segments`);

    res.json({
      videoId,
      transcript: fullTranscript,
      segments: transcriptItems,
      charCount: fullTranscript.length,
      segmentCount: transcriptItems.length
    });

  } catch (error) {
    console.error(`[Transcript] Error for ${videoId}:`, error.message);
    res.status(500).json({
      error: error.message,
      videoId
    });
  }
});

// Batch fetch multiple transcripts
app.post('/batch-transcripts', async (req, res) => {
  const { videoIds } = req.body;

  if (!videoIds || !Array.isArray(videoIds)) {
    return res.status(400).json({ error: 'Missing videoIds array in body' });
  }

  console.log(`[Transcript] Batch fetching ${videoIds.length} videos`);

  const results = [];

  for (const videoId of videoIds) {
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (transcriptItems && transcriptItems.length > 0) {
        const fullTranscript = transcriptItems
          .map(item => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        results.push({
          videoId,
          success: true,
          transcript: fullTranscript,
          charCount: fullTranscript.length
        });
        console.log(`  ✓ ${videoId}: ${fullTranscript.length} chars`);
      } else {
        results.push({
          videoId,
          success: false,
          error: 'No transcript available'
        });
        console.log(`  ✗ ${videoId}: No transcript`);
      }
    } catch (error) {
      results.push({
        videoId,
        success: false,
        error: error.message
      });
      console.log(`  ✗ ${videoId}: ${error.message}`);
    }

    // Small delay between requests to be nice to YouTube
    await new Promise(r => setTimeout(r, 500));
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`[Transcript] Batch complete: ${successCount}/${videoIds.length} succeeded`);

  res.json({
    total: videoIds.length,
    successful: successCount,
    failed: videoIds.length - successCount,
    results
  });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║     Mood Leaf Transcript Server                ║
║     Running on http://localhost:${PORT}          ║
╠════════════════════════════════════════════════╣
║  Endpoints:                                    ║
║    GET  /transcript?v=VIDEO_ID                 ║
║    POST /batch-transcripts                     ║
╚════════════════════════════════════════════════╝
  `);
});
