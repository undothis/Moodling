'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchRecommendedMovies,
  getAIMovieRecommendations,
  uploadMovie,
  searchSubtitles,
  downloadSubtitle,
  RecommendedMovie,
  SubtitleSearchResult,
} from '@/lib/api';
import {
  Film,
  Upload,
  Loader2,
  Star,
  Sparkles,
  Wand2,
  MessageSquare,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  FileVideo,
  FileText,
  Info,
  Search,
  Download,
  Subtitles,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

const CATEGORY_LABELS: Record<string, string> = {
  grief_loss: 'Grief & Loss',
  therapy_mental_health: 'Therapy & Mental Health',
  addiction_recovery: 'Addiction & Recovery',
  relationships_love: 'Relationships & Love',
  trauma_healing: 'Trauma & Healing',
  parenting_family: 'Family Dynamics',
  life_transitions: 'Life Transitions',
  vulnerability_shame: 'Vulnerability & Identity',
  neurodivergence: 'Neurodivergence',
  human_stories: 'Human Connection',
};

function MovieCard({
  movie,
  showReason,
}: {
  movie: RecommendedMovie;
  showReason?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100 hover:border-purple-200 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-purple-500" />
          <h3 className="font-medium text-gray-900">{movie.title}</h3>
        </div>
        <span className="text-xs text-gray-500">{movie.year}</span>
      </div>
      <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full mb-2">
        {CATEGORY_LABELS[movie.category] || movie.category}
      </span>
      <p className="text-sm text-gray-600 mb-2">{movie.description}</p>
      {showReason && movie.reason ? (
        <p className="text-sm text-purple-700 mt-2">
          <span className="font-medium">Why this movie: </span>
          {movie.reason}
        </p>
      ) : (
        <p className="text-xs text-gray-500 italic">{movie.why_train}</p>
      )}
    </div>
  );
}

export default function MoviesPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showAIRecommender, setShowAIRecommender] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Upload form state
  const [movieFile, setMovieFile] = useState<File | null>(null);
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [movieCategory, setMovieCategory] = useState('general');
  const [useWhisper, setUseWhisper] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // AI Recommender state
  const [aiDescription, setAiDescription] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedMovie[]>([]);
  const [aiTrainingTips, setAiTrainingTips] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Subtitle search state
  const [showSubtitleSearch, setShowSubtitleSearch] = useState(false);
  const [subtitleTitle, setSubtitleTitle] = useState('');
  const [subtitleYear, setSubtitleYear] = useState('');
  const [subtitleLang, setSubtitleLang] = useState('eng');
  const [subtitleResults, setSubtitleResults] = useState<SubtitleSearchResult[]>([]);
  const [isSearchingSubtitles, setIsSearchingSubtitles] = useState(false);
  const [isDownloadingSubtitle, setIsDownloadingSubtitle] = useState(false);
  const [subtitleMessage, setSubtitleMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const { data: movies, isLoading } = useQuery({
    queryKey: ['recommended-movies'],
    queryFn: fetchRecommendedMovies,
  });

  const { mutate: doUpload, isPending: isUploading } = useMutation({
    mutationFn: async () => {
      if (!movieFile || !movieTitle) throw new Error('Missing required fields');
      return uploadMovie(movieFile, movieTitle, movieCategory, subtitleFile || undefined, useWhisper);
    },
    onSuccess: (data) => {
      setUploadStatus(data.message);
      if (data.success) {
        setMovieFile(null);
        setSubtitleFile(null);
        setMovieTitle('');
      }
    },
    onError: (err) => {
      setUploadStatus(`Error: ${err}`);
    },
  });

  // Group movies by category
  const groupedMovies = useMemo(() => {
    if (!movies) return {};
    return movies.reduce((acc, m) => {
      const cat = m.category || 'general';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(m);
      return acc;
    }, {} as Record<string, RecommendedMovie[]>);
  }, [movies]);

  const categories = useMemo(() => Object.keys(groupedMovies).sort(), [groupedMovies]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleGetAIRecommendations = async () => {
    if (!aiDescription.trim()) return;
    setIsLoadingAI(true);
    try {
      const response = await getAIMovieRecommendations(aiDescription);
      if (response.success && response.recommendations) {
        setAiRecommendations(response.recommendations);
        setAiTrainingTips(response.training_tips || '');
      } else {
        alert(response.error || 'Failed to get recommendations');
      }
    } catch (error) {
      alert('Failed to get AI recommendations. Make sure your Claude API key is configured.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSearchSubtitles = async () => {
    if (!subtitleTitle.trim()) return;
    setIsSearchingSubtitles(true);
    setSubtitleResults([]);
    setSubtitleMessage(null);
    try {
      const year = subtitleYear ? parseInt(subtitleYear) : undefined;
      const response = await searchSubtitles(subtitleTitle, year, subtitleLang);
      if (response.success && response.results) {
        setSubtitleResults(response.results);
        if (response.results.length === 0) {
          setSubtitleMessage({
            type: 'error',
            text: `No subtitles found for "${subtitleTitle}". Try OpenSubtitles.org manually.`
          });
        }
      } else {
        setSubtitleMessage({type: 'error', text: response.error || 'Search failed'});
      }
    } catch (error) {
      setSubtitleMessage({type: 'error', text: 'Failed to search subtitles. Make sure subliminal is installed.'});
    } finally {
      setIsSearchingSubtitles(false);
    }
  };

  const handleDownloadSubtitle = async () => {
    if (!subtitleTitle.trim()) return;
    setIsDownloadingSubtitle(true);
    setSubtitleMessage(null);
    try {
      const year = subtitleYear ? parseInt(subtitleYear) : undefined;
      const response = await downloadSubtitle(subtitleTitle, year, subtitleLang);
      if (response.success) {
        setSubtitleMessage({
          type: 'success',
          text: `Downloaded: ${response.filename} from ${response.provider}`
        });
        // Auto-fill the movie title in the upload form
        setMovieTitle(subtitleTitle);
      } else {
        setSubtitleMessage({type: 'error', text: response.error || 'Download failed'});
      }
    } catch (error) {
      setSubtitleMessage({type: 'error', text: 'Failed to download subtitle'});
    } finally {
      setIsDownloadingSubtitle(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Movies</h1>
        <p className="text-gray-500 mt-1">
          Upload movies or get recommendations for rich emotional training data
        </p>
      </div>

      {/* Movie Upload Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload Movie</h2>
              <p className="text-sm text-gray-600">
                Process your own movie files for training data
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <FileVideo className="w-4 h-4" />
            {showUpload ? 'Hide' : 'Upload Movie'}
          </button>
        </div>

        {showUpload && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">How movie transcription works:</p>
                  <ul className="list-disc ml-4 mt-1 text-blue-700">
                    <li><strong>Subtitle file (.srt, .vtt)</strong> - Fastest and most accurate</li>
                    <li><strong>Whisper AI</strong> - Extracts speech from audio (slower but works for any video)</li>
                    <li><strong>Both</strong> - Use subtitles for text, Whisper for voice analysis</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movie File *
                </label>
                <input
                  type="file"
                  accept="video/*,.mp4,.mkv,.avi,.mov"
                  onChange={(e) => setMovieFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {movieFile && (
                  <p className="text-xs text-gray-500 mt-1">{movieFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle File (Optional)
                </label>
                <input
                  type="file"
                  accept=".srt,.vtt"
                  onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {subtitleFile && (
                  <p className="text-xs text-gray-500 mt-1">{subtitleFile.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movie Title *
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="e.g., Good Will Hunting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={movieCategory}
                  onChange={(e) => setMovieCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={useWhisper}
                  onChange={(e) => setUseWhisper(e.target.checked)}
                  className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                Use Whisper transcription {!subtitleFile && '(required without subtitles)'}
              </label>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => doUpload()}
                disabled={!movieFile || !movieTitle || isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Process
                  </>
                )}
              </button>

              {uploadStatus && (
                <p className={clsx(
                  "text-sm",
                  uploadStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
                )}>
                  {uploadStatus}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subtitle Search Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Subtitles className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Find Subtitles</h2>
              <p className="text-sm text-gray-600">
                Automatically search and download subtitle files
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSubtitleSearch(!showSubtitleSearch)}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {showSubtitleSearch ? 'Hide' : 'Find Subtitles'}
          </button>
        </div>

        {showSubtitleSearch && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Automatic subtitle search</p>
                  <p className="text-green-700 mt-1">
                    Searches OpenSubtitles, Addic7ed, and other providers. Downloaded subtitles are saved
                    and can be used when uploading your movie.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movie Title *
                </label>
                <input
                  type="text"
                  value={subtitleTitle}
                  onChange={(e) => setSubtitleTitle(e.target.value)}
                  placeholder="e.g., Good Will Hunting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year (Optional)
                </label>
                <input
                  type="text"
                  value={subtitleYear}
                  onChange={(e) => setSubtitleYear(e.target.value)}
                  placeholder="1997"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={subtitleLang}
                  onChange={(e) => setSubtitleLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="eng">English</option>
                  <option value="spa">Spanish</option>
                  <option value="fra">French</option>
                  <option value="deu">German</option>
                  <option value="ita">Italian</option>
                  <option value="por">Portuguese</option>
                  <option value="jpn">Japanese</option>
                  <option value="kor">Korean</option>
                  <option value="zho">Chinese</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSearchSubtitles}
                disabled={!subtitleTitle.trim() || isSearchingSubtitles}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearchingSubtitles ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadSubtitle}
                disabled={!subtitleTitle.trim() || isDownloadingSubtitle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDownloadingSubtitle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Best Match
                  </>
                )}
              </button>
            </div>

            {subtitleMessage && (
              <div className={clsx(
                "flex items-center gap-2 p-3 rounded-lg",
                subtitleMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {subtitleMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm">{subtitleMessage.text}</span>
              </div>
            )}

            {subtitleResults.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Found {subtitleResults.length} subtitles:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subtitleResults.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {sub.release_name || subtitleTitle}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          via {sub.provider}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded">
                        {sub.language}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Movie Recommender */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Movie Recommender</h2>
              <p className="text-sm text-gray-600">
                Describe your AI and get personalized movie recommendations
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAIRecommender(!showAIRecommender)}
            className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {showAIRecommender ? 'Hide' : 'Get Recommendations'}
          </button>
        </div>

        {showAIRecommender && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you want your AI to do:
              </label>
              <textarea
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Example: I want to build an AI that helps people process grief and loss, providing comfort during their darkest moments while helping them find meaning."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none"
              />
            </div>

            <button
              onClick={handleGetAIRecommendations}
              disabled={!aiDescription.trim() || isLoadingAI}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Find Best Movies
                </>
              )}
            </button>

            {aiRecommendations.length > 0 && (
              <div className="mt-6 space-y-4">
                {aiTrainingTips && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Training Tip</p>
                        <p className="text-sm text-gray-600 mt-1">{aiTrainingTips}</p>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm font-medium text-gray-700">
                  Recommended movies for your AI ({aiRecommendations.length}):
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiRecommendations.map((movie) => (
                    <MovieCard key={movie.title} movie={movie} showReason />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommended Movies List */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Recommended Movies
            </h2>
            <p className="text-sm text-gray-500">
              {movies?.length || 0} movies curated for emotional training data
            </p>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat} ({groupedMovies[cat]?.length})
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {(categoryFilter === 'all' ? categories : [categoryFilter]).map(cat => (
              <div key={cat} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {CATEGORY_LABELS[cat] || cat}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {groupedMovies[cat]?.length} movies
                    </span>
                  </div>
                  {expandedCategories.has(cat) ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {(expandedCategories.has(cat) || categoryFilter !== 'all') && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedMovies[cat]?.map((movie) => (
                      <MovieCard key={movie.title} movie={movie} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legal Note */}
      <div className="mt-6 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Important Note</p>
            <p className="mt-1">
              You must own or have legal rights to any movie files you upload. This tool is for processing
              content you have legitimate access to for personal/research use. Subtitle files can often be
              found on sites like OpenSubtitles.org.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
