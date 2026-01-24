/**
 * Transcript Server for Mood Leaf
 *
 * Local server that fetches YouTube transcripts using yt-dlp.
 *
 * SETUP:
 *   1. Install yt-dlp: brew install yt-dlp
 *   2. cd transcript-server
 *   3. npm install
 *   4. npm start
 *
 * The server runs on http://localhost:3333
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

const app = express();
const PORT = 3333;

// Enable CORS for the app to call this server
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Transcript server is running (yt-dlp)',
    endpoints: {
      transcript: 'GET /transcript?v=VIDEO_ID',
      batch: 'POST /batch-transcripts { videoIds: [...] }',
      claudeExtract: 'POST /claude-extract (Claude API proxy)'
    }
  });
});

/**
 * Fetch transcript using yt-dlp
 */
async function fetchTranscriptWithYtDlp(videoId) {
  const tempDir = os.tmpdir();
  const outputBase = path.join(tempDir, `transcript_${videoId}`);

  try {
    // Use yt-dlp to download subtitles
    const cmd = `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format vtt -o "${outputBase}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;

    console.log(`[yt-dlp] Running: yt-dlp for ${videoId}`);

    const { stdout, stderr } = await execAsync(cmd, { timeout: 60000 });

    // Find the subtitle file (could be .en.vtt or .en-orig.vtt etc)
    const files = await fs.readdir(tempDir);
    const subtitleFile = files.find(f => f.startsWith(`transcript_${videoId}`) && f.endsWith('.vtt'));

    if (!subtitleFile) {
      // Check if yt-dlp said no subtitles available
      if (stdout.includes('no subtitles') || stdout.includes('There are no subtitles')) {
        return { error: 'No subtitles available for this video' };
      }
      return { error: 'Could not find subtitle file' };
    }

    const subtitlePath = path.join(tempDir, subtitleFile);
    const vttContent = await fs.readFile(subtitlePath, 'utf-8');

    // Parse VTT to plain text
    const transcript = parseVTT(vttContent);

    // Clean up temp file
    await fs.unlink(subtitlePath).catch(() => {});

    return { transcript };

  } catch (error) {
    if (error.message.includes('command not found') || error.message.includes('not recognized')) {
      return { error: 'yt-dlp not installed. Run: brew install yt-dlp' };
    }
    if (error.message.includes('timeout')) {
      return { error: 'Request timed out' };
    }
    console.error(`[yt-dlp] Error:`, error.message);
    return { error: error.message };
  }
}

/**
 * Parse VTT subtitle file to plain text
 */
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const textLines = [];
  let lastText = '';

  for (const line of lines) {
    // Skip WEBVTT header, timestamps, and empty lines
    if (line.startsWith('WEBVTT') ||
        line.includes('-->') ||
        line.trim() === '' ||
        /^\d+$/.test(line.trim()) ||
        line.startsWith('Kind:') ||
        line.startsWith('Language:')) {
      continue;
    }

    // Remove VTT formatting tags
    let text = line
      .replace(/<[^>]+>/g, '')  // Remove HTML-like tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    // Skip duplicates (VTT often has overlapping segments)
    if (text && text !== lastText) {
      textLines.push(text);
      lastText = text;
    }
  }

  return textLines.join(' ').replace(/\s+/g, ' ').trim();
}

// Fetch single transcript
app.get('/transcript', async (req, res) => {
  const videoId = req.query.v || req.query.videoId;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing video ID. Use ?v=VIDEO_ID' });
  }

  console.log(`[Transcript] Fetching transcript for: ${videoId}`);

  const result = await fetchTranscriptWithYtDlp(videoId);

  if (result.error) {
    console.log(`[Transcript] Error: ${result.error}`);
    return res.status(404).json({ error: result.error, videoId });
  }

  console.log(`[Transcript] Success: ${result.transcript.length} chars`);

  res.json({
    videoId,
    transcript: result.transcript,
    charCount: result.transcript.length
  });
});

/**
 * Proxy Claude API calls (React Native can't call external APIs reliably)
 */
app.post('/claude-extract', async (req, res) => {
  const { transcript, videoTitle, videoId, channelName, categories, apiKey } = req.body;

  if (!transcript || !apiKey) {
    return res.status(400).json({ error: 'Missing transcript or apiKey' });
  }

  console.log(`[Claude] Extracting insights for: ${videoTitle}`);

  try {
    const prompt = buildExtractionPrompt(transcript, videoTitle, channelName, categories);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Claude] ✓ Got response for: ${videoTitle}`);

    res.json(data);
  } catch (error) {
    console.error(`[Claude] Error:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Build extraction prompt (same logic as in youtubeProcessorService)
 */
function buildExtractionPrompt(transcript, videoTitle, channelName, categories) {
  const categoryDescriptions = categories.map(c => `- ${c.name}: ${c.description}`).join('\n');

  return `You are an expert at extracting therapeutic and coaching insights from interview transcripts.

Analyze this transcript from "${videoTitle}" by ${channelName} and extract valuable insights.

CATEGORIES TO EXTRACT:
${categoryDescriptions}

TRANSCRIPT:
${transcript.substring(0, 15000)}

Extract 3-8 high-quality insights. For each insight, provide:
1. A clear, actionable title
2. The full insight text (2-4 sentences)
3. Which category it belongs to
4. A quality score (0-100)
5. A safety score (0-100) - lower if potentially harmful advice
6. Confidence level (0-1)

Return ONLY valid JSON in this format:
{
  "insights": [
    {
      "title": "Brief title",
      "insight": "The full insight text...",
      "category": "category_name",
      "qualityScore": 85,
      "safetyScore": 95,
      "confidence": 0.9
    }
  ]
}`;
}

// Batch fetch multiple transcripts
app.post('/batch-transcripts', async (req, res) => {
  const { videoIds } = req.body;

  if (!videoIds || !Array.isArray(videoIds)) {
    return res.status(400).json({ error: 'Missing videoIds array in body' });
  }

  console.log(`[Transcript] Batch fetching ${videoIds.length} videos`);

  const results = [];

  for (const videoId of videoIds) {
    const result = await fetchTranscriptWithYtDlp(videoId);

    if (result.error) {
      results.push({ videoId, success: false, error: result.error });
      console.log(`  ✗ ${videoId}: ${result.error}`);
    } else {
      results.push({
        videoId,
        success: true,
        transcript: result.transcript,
        charCount: result.transcript.length
      });
      console.log(`  ✓ ${videoId}: ${result.transcript.length} chars`);
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 1000));
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
╔════════════════════════════════════════════════════════╗
║     Mood Leaf Transcript Server (yt-dlp)               ║
║     Running on http://localhost:${PORT}                  ║
╠════════════════════════════════════════════════════════╣
║  REQUIRES: yt-dlp (brew install yt-dlp)                ║
╠════════════════════════════════════════════════════════╣
║  Endpoints:                                            ║
║    GET  /transcript?v=VIDEO_ID                         ║
║    POST /batch-transcripts                             ║
║    POST /claude-extract (Claude API proxy)             ║
╚════════════════════════════════════════════════════════╝
  `);

  // Check if yt-dlp is installed
  exec('yt-dlp --version', (error, stdout) => {
    if (error) {
      console.log('⚠️  WARNING: yt-dlp not found!');
      console.log('   Install with: brew install yt-dlp');
      console.log('');
    } else {
      console.log(`✓ yt-dlp version: ${stdout.trim()}`);
      console.log('');
    }
  });
});
