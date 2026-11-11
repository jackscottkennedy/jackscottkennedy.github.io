import { Song } from '../types';

interface ITunesCacheItem {
  timestamp: number;
  data: Song[];
}

const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes cache
const memoryCache: Map<string, ITunesCacheItem> = new Map();

// Helper to get high-resolution artwork from iTunes 100x100 URL
function getHighResArtwork(url?: string): string {
  if (!url) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
  return url.replace(/100x100bb\.jpg$/, '600x600bb.jpg').replace(/60x60bb\.jpg$/, '600x600bb.jpg');
}

export async function searchITunes(term: string, isOffline = false, limit = 20): Promise<Song[]> {
  const query = term.trim().toLowerCase();
  if (!query) return [];

  // Check cache first
  const cacheKey = `itunes_${query}_${limit}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION_MS)) {
    return cached.data;
  }

  // Try reading from localStorage cache
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) {
      const parsed: ITunesCacheItem = JSON.parse(local);
      if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
        memoryCache.set(cacheKey, parsed);
        return parsed.data;
      }
    }
  } catch {}

  // If offline mode is enabled, return fallback songs
  if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return getOfflineFallbackSongs(query);
  }

  // Use JSONP to bypass browser CORS on client-side (official Apple iTunes Web API feature)
  return new Promise((resolve) => {
    const callbackName = `itunes_callback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');
    let isResolved = false;

    const timeout = setTimeout(() => {
      if (!isResolved) {
        cleanup();
        resolve(getOfflineFallbackSongs(query));
      }
    }, 5000);

    const cleanup = () => {
      isResolved = true;
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    };

    (window as any)[callbackName] = (json: any) => {
      cleanup();
      try {
        const songs: Song[] = (json.results || []).map((item: any) => ({
          id: `itunes-${item.trackId || Math.random().toString(36).substring(2, 9)}`,
          title: item.trackName || 'Unknown Title',
          artist: item.artistName || 'Unknown Artist',
          album: item.collectionName || 'Single',
          genre: item.primaryGenreName || 'Music',
          duration: Math.round((item.trackTimeMillis || 180000) / 1000),
          artworkUrl: getHighResArtwork(item.artworkUrl100 || item.artworkUrl60),
          audioUrl: item.previewUrl || '',
          isOwned: false,
          price: item.trackPrice ? `$${Math.abs(item.trackPrice).toFixed(2)}` : '$1.29',
          buyUrl: item.trackViewUrl || 'https://music.apple.com',
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear().toString() : '2025',
        }));

        const cacheItem: ITunesCacheItem = { timestamp: Date.now(), data: songs };
        memoryCache.set(cacheKey, cacheItem);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch {}

        resolve(songs);
      } catch {
        resolve(getOfflineFallbackSongs(query));
      }
    };

    script.src = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      resolve(getOfflineFallbackSongs(query));
    };

    document.head.appendChild(script);
  });
}

// Fetch genuinely trending music / top chart hits from iTunes
export async function fetchTrendingSongs(isOffline = false, limit = 16): Promise<Song[]> {
  const query = 'top hits charts 2025';
  return searchITunes(query, isOffline, limit);
}

// Fallback search data when offline or rate limited
function getOfflineFallbackSongs(query: string): Song[] {
  const stockStoreSongs: Song[] = [
    {
      id: 'store-1',
      title: 'Midnight Sun',
      artist: 'Lunar Collective',
      album: 'Solar Eclipse',
      genre: 'Lo-Fi Chill',
      duration: 175,
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      audioUrl: '',
      isOwned: false,
      price: '$1.99',
      buyUrl: 'https://music.apple.com',
      year: '2025',
    },
    {
      id: 'store-2',
      title: 'Neon Drift',
      artist: 'Tokyo Nights',
      album: 'Shibuya Neon',
      genre: 'Electronic',
      duration: 192,
      artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      audioUrl: '',
      isOwned: false,
      price: '$1.99',
      buyUrl: 'https://music.apple.com',
      year: '2025',
    },
    {
      id: 'store-3',
      title: 'Crystal Horizons',
      artist: 'Sundown Aura',
      album: 'Mirage',
      genre: 'Ambient',
      duration: 148,
      artworkUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
      audioUrl: '',
      isOwned: false,
      price: '$1.99',
      buyUrl: 'https://music.apple.com',
      year: '2025',
    },
    {
      id: 'store-4',
      title: 'Velvet Echoes',
      artist: 'Sunday Astronaut',
      album: 'Aura Vol. 2',
      genre: 'Indie Pop',
      duration: 165,
      artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
      audioUrl: '',
      isOwned: false,
      price: '$1.99',
      buyUrl: 'https://music.apple.com',
      year: '2025',
    },
  ];

  if (!query) return stockStoreSongs;
  return stockStoreSongs.filter(s => 
    s.title.toLowerCase().includes(query) ||
    s.artist.toLowerCase().includes(query) ||
    s.genre.toLowerCase().includes(query)
  );
}
