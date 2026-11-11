import { AppSettings, Bookmark, Playlist, RemixSettings, Song } from '../types';

// ================= LEVEL 1: DEFAULT SETTINGS EMBEDDED IN CODE =================
export const LEVEL_1_DEFAULT_SETTINGS: AppSettings = {
  backgroundMode: 'nowPlaying',
  backgroundColor: '#171717',
  staticAlbumArtworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
  musicSourceFolderName: 'Built-in Music Folder',
  offlineMode: false,
  volume: 0.85,
};

// ================= LEVEL 2: URL PARAMETERS PARSER (?<setting>=) =================
export function getLevel2UrlSettings(): Partial<AppSettings> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const settings: Partial<AppSettings> = {};

  if (params.has('offline') || params.has('offlineMode')) {
    const val = params.get('offline') || params.get('offlineMode');
    settings.offlineMode = val === 'true' || val === '1';
  }

  if (params.has('bgMode') || params.has('backgroundMode')) {
    const val = params.get('bgMode') || params.get('backgroundMode');
    if (val === 'nowPlaying' || val === 'color' || val === 'staticAlbum') {
      settings.backgroundMode = val;
    }
  }

  if (params.has('bgColor') || params.has('backgroundColor')) {
    settings.backgroundColor = params.get('bgColor') || params.get('backgroundColor') || '#171717';
  }

  if (params.has('staticArt') || params.has('staticAlbumArtworkUrl')) {
    settings.staticAlbumArtworkUrl = params.get('staticArt') || params.get('staticAlbumArtworkUrl') || '';
  }

  if (params.has('volume')) {
    const v = parseFloat(params.get('volume') || '0.85');
    if (!isNaN(v)) settings.volume = Math.max(0, Math.min(1, v));
  }

  if (params.has('folder') || params.has('musicSourceFolderName')) {
    settings.musicSourceFolderName = params.get('folder') || params.get('musicSourceFolderName') || 'Music Folder';
  }

  return settings;
}

// ================= LEVEL 3 OVERRIDES: RESOLVE HIERARCHY =================
// Level 1: Default in code -> Level 2: URL params -> Level 3: settings.json
export function resolveSettings(level3Settings?: Partial<AppSettings> | null): AppSettings {
  const level2 = getLevel2UrlSettings();
  const level3 = level3Settings || {};

  return {
    ...LEVEL_1_DEFAULT_SETTINGS,
    ...level2,
    ...level3,
  };
}

// ================= BUILT-IN STARTER SONGS =================
// Structured like the imported music folder (with audio and video .mp4 representation)
export const STARTER_SONGS: Song[] = [
  {
    id: 'starter-1',
    title: 'Mountains',
    artist: 'Moon Group',
    album: 'Ascent',
    genre: 'Lo-Fi Chill',
    duration: 83, // 1:23 as in Figma
    artworkUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'music/atlasaudio-80s-pop-617534.mp3', // Will use synth tone engine for rich offline playback
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-2',
    title: 'Roundabout',
    artist: 'Sunday Astronaut',
    album: 'Orbit Chronicles',
    genre: 'Electronic Pop',
    duration: 144, // 2:24
    artworkUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'music/jonasblakewood-elevation-619120.mp3',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-3',
    title: 'Starboy',
    artist: 'Sunday Astronaut',
    album: 'Starlight',
    genre: 'Synthwave',
    duration: 215, // 3:35
    artworkUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'music/miromaxmusic-synthwave-no-copyright-630654.mp3',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-4',
    title: 'Purple Mountains',
    artist: 'Moon Group',
    album: 'Twilight Ridge',
    genre: 'Ambient',
    duration: 165,
    artworkUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'music/sub_clair-calm-612494.mp3',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-5',
    title: 'Fog Road',
    artist: 'Velvet Drift',
    album: 'Atmospheres',
    genre: 'Downtempo',
    duration: 198,
    artworkUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    audioUrl: 'music/sub_clair-travel-614575.mp3',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-6',
    title: 'Baby I\'m Back',
    artist: 'Retro Neon',
    album: 'Midnight Drive',
    genre: 'Synthpop',
    duration: 182,
    artworkUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    audioUrl: '',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-7',
    title: 'Night Forest',
    artist: 'Quiet Pulse',
    album: 'Deep Woods',
    genre: 'Lo-Fi',
    duration: 135,
    artworkUrl: 'https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80',
    audioUrl: '',
    isOwned: true,
    year: '2025',
  },
  {
    id: 'starter-8-video',
    title: 'Sunset Desert (Visual Mix)',
    artist: 'Mirage',
    album: 'Dune Horizons',
    genre: 'Cinematic',
    duration: 210,
    artworkUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    audioUrl: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    isOwned: true,
    year: '2025',
  },
];

// Starter initial playlists
export const STARTER_PLAYLISTS: Playlist[] = [
  {
    id: 'fav-1',
    name: 'Lo-Fi Playlist',
    description: 'Relaxing study beats and mellow frequencies',
    songIds: ['starter-1', 'starter-4', 'starter-7'],
    isFavorite: true,
    isSystem: false,
    tags: ['lofi', 'pop', 'chill'],
    coverArtworks: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
    ],
  },
  {
    id: 'play-1',
    name: 'Synthwave Odyssey',
    description: 'Neon retro futuristic soundscapes',
    songIds: ['starter-2', 'starter-3', 'starter-6'],
    isFavorite: false,
    isSystem: false,
    tags: ['retro', 'synthwave', 'nightdrive'],
    coverArtworks: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
    ],
  },
  {
    id: 'sys-all-imported',
    name: 'Imported Songs Folder',
    description: 'All local and starter imported library songs',
    songIds: ['starter-1', 'starter-2', 'starter-3', 'starter-4', 'starter-5', 'starter-6', 'starter-7', 'starter-8-video'],
    isFavorite: false,
    isSystem: true,
    tags: ['all', 'owned', 'local'],
    coverArtworks: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=300&q=80',
    ],
  },
  {
    id: 'sys-remixes',
    name: 'Remixes Folder',
    description: 'All custom created audio remix variations',
    songIds: ['starter-remix-1'],
    isFavorite: false,
    isSystem: true,
    tags: ['remixes', 'studio', 'fx'],
    coverArtworks: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80',
    ],
  },
];

// Starter Remix instance
export const STARTER_REMIXES: Song[] = [
  {
    id: 'starter-remix-1',
    originalSongId: 'starter-1',
    title: 'Mountains (Lo-Fi Slowed & Reverb)',
    artist: 'Moon Group',
    album: 'Ascent',
    genre: 'Lo-Fi Chill',
    duration: 104, // slower duration
    artworkUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
    audioUrl: '',
    isOwned: true,
    isRemix: true,
    remixSettings: {
      speed: 0.8,
      pitchShift: -3,
      reverb: 65,
      lowPassFilter: 4500,
    },
  },
];

// Starter Bookmarks (unowned songs to buy with external links)
export const STARTER_BOOKMARKS: Bookmark[] = [
  {
    id: 'bm-1',
    songId: 'itunes-101',
    dateAdded: '2026-11-01',
    song: {
      id: 'itunes-101',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      genre: 'Pop',
      duration: 200,
      artworkUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/4b/81/dc/4b81dcfa-d128-e4b2-28df-ff5752945d94/mzaf_7820716766782500851.plus.aac.p.m4a',
      isOwned: false,
      price: '$1.29',
      buyUrl: 'https://music.apple.com',
    },
  },
  {
    id: 'bm-2',
    songId: 'itunes-102',
    dateAdded: '2026-11-05',
    song: {
      id: 'itunes-102',
      title: 'Midnight City',
      artist: 'M83',
      album: 'Hurry Up, We\'re Dreaming',
      genre: 'Electronic',
      duration: 243,
      artworkUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/bf/25/c7/bf25c7e8-4ee0-675e-ea77-c34047a052ff/mzaf_11303975549048358485.plus.aac.p.m4a',
      isOwned: false,
      price: '$1.29',
      buyUrl: 'https://music.apple.com',
    },
  },
];

// ================= STORAGE UTILITIES =================
const STORAGE_KEYS = {
  PLAYLISTS: 'aura_playlists_data',
  BOOKMARKS: 'aura_bookmarks_data',
  REMIXES: 'aura_remixes_data',
  SETTINGS: 'aura_settings_data',
  OWNED_SONGS: 'aura_owned_songs',
  PINNED_TOPICS: 'aura_pinned_topics',
};

export function loadSavedPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STARTER_PLAYLISTS;
}

export function savePlaylists(playlists: Playlist[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
  } catch {}
}

export function loadSavedBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STARTER_BOOKMARKS;
}

export function saveBookmarks(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch {}
}

export function loadSavedRemixes(): Song[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REMIXES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STARTER_REMIXES;
}

export function saveRemixes(remixes: Song[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REMIXES, JSON.stringify(remixes));
  } catch {}
}

export function loadSavedSettings(): Partial<AppSettings> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {}
}

export function loadSavedOwnedSongs(): Song[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OWNED_SONGS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return STARTER_SONGS;
}

export function saveOwnedSongs(songs: Song[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.OWNED_SONGS, JSON.stringify(songs));
  } catch {}
}

// ================= EXPORT & IMPORT APP DATA JSON =================
export function exportAppJson(filename: 'playlists.json' | 'bookmarks.json' | 'remixes.json' | 'settings.json' | 'aura-full-backup.json', data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ================= FILE SYSTEM ACCESS API & MOBILE FALLBACK =================
// Parses local music folder structure:
// music-folder/
// ├── 2025/
// │   ├── 3243239843/
// │   │   ├── song.mp3 or song.mp4
// │   │   ├── metadata.json
// │   └── albumcover.png
export async function pickMusicFolderWithFSA(): Promise<{ folderName: string; songs: Song[] }> {
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const folderName = dirHandle.name || 'Local Music Folder';
      const songs: Song[] = [];

      for await (const [yearName, yearEntry] of dirHandle.entries()) {
        if (yearEntry.kind === 'directory') {
          let albumCoverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
          
          // Check for albumcover.png in the year directory
          for await (const [itemName, itemEntry] of yearEntry.entries()) {
            if (itemEntry.kind === 'file' && itemName.toLowerCase().includes('albumcover')) {
              const file = await itemEntry.getFile();
              albumCoverUrl = URL.createObjectURL(file);
            }
          }

          // Scan subfolders (song folders)
          for await (const [songId, songEntry] of yearEntry.entries()) {
            if (songEntry.kind === 'directory') {
              let audioFile: File | null = null;
              let metaFile: File | null = null;

              for await (const [filename, fileEntry] of songEntry.entries()) {
                if (fileEntry.kind === 'file') {
                  const lower = filename.toLowerCase();
                  if (lower.endsWith('.mp3') || lower.endsWith('.mp4') || lower.endsWith('.m4a') || lower.endsWith('.wav')) {
                    audioFile = await fileEntry.getFile();
                  } else if (lower === 'metadata.json') {
                    metaFile = await fileEntry.getFile();
                  }
                }
              }

              if (audioFile) {
                let metadata: Partial<Song> = {};
                if (metaFile) {
                  try {
                    const text = await metaFile.text();
                    metadata = JSON.parse(text);
                  } catch {}
                }

                const isVideo = audioFile.name.toLowerCase().endsWith('.mp4');
                const audioBlobUrl = URL.createObjectURL(audioFile);
                
                songs.push({
                  id: metadata.id || `local-${songId}`,
                  title: metadata.title || audioFile.name.replace(/\.[^/.]+$/, ''),
                  artist: metadata.artist || 'Unknown Artist',
                  album: metadata.album || yearName,
                  genre: metadata.genre || 'Various',
                  duration: metadata.duration || 180,
                  artworkUrl: metadata.artworkUrl || albumCoverUrl,
                  audioUrl: audioBlobUrl,
                  videoUrl: isVideo ? audioBlobUrl : undefined,
                  isOwned: true,
                  year: yearName,
                });
              }
            }
          }
        }
      }

      if (songs.length > 0) {
        return { folderName, songs };
      }
    } catch (e: any) {
      if (e.name === 'AbortError') throw e;
    }
  }

  throw new Error('Fallback input needed');
}

// Mobile fallback parser from HTML <input type="file" webkitdirectory directory multiple>
export async function parseFileListToSongs(files: FileList): Promise<{ folderName: string; songs: Song[] }> {
  const songs: Song[] = [];
  const albumCoversByDir: Record<string, string> = {};
  const metaByDir: Record<string, any> = {};
  const audioFiles: { file: File; path: string }[] = [];

  let topFolder = 'Imported Music';

  // Pass 1: Gather album art and metadata
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = file.webkitRelativePath || file.name;
    const parts = path.split('/');
    if (parts.length > 1) topFolder = parts[0];

    const dir = parts.slice(0, -1).join('/');
    const fileName = parts[parts.length - 1].toLowerCase();

    if (fileName.includes('albumcover') || fileName.endsWith('.png') || fileName.endsWith('.jpg')) {
      albumCoversByDir[dir] = URL.createObjectURL(file);
    } else if (fileName === 'metadata.json') {
      try {
        const text = await file.text();
        metaByDir[dir] = JSON.parse(text);
      } catch {}
    } else if (fileName.endsWith('.mp3') || fileName.endsWith('.mp4') || fileName.endsWith('.wav') || fileName.endsWith('.m4a')) {
      audioFiles.push({ file, path });
    }
  }

  // Pass 2: Assemble songs
  for (const { file, path } of audioFiles) {
    const parts = path.split('/');
    const dir = parts.slice(0, -1).join('/');
    const parentDir = parts.slice(0, -2).join('/');
    const meta = metaByDir[dir] || {};
    const artwork = albumCoversByDir[dir] || albumCoversByDir[parentDir] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
    const isVideo = file.name.toLowerCase().endsWith('.mp4');
    const blobUrl = URL.createObjectURL(file);

    songs.push({
      id: meta.id || `file-${Math.random().toString(36).substring(2, 9)}`,
      title: meta.title || file.name.replace(/\.[^/.]+$/, ''),
      artist: meta.artist || 'Local Artist',
      album: meta.album || (parts.length > 2 ? parts[parts.length - 2] : 'Local Collection'),
      genre: meta.genre || 'Audio',
      duration: meta.duration || 180,
      artworkUrl: meta.artworkUrl || artwork,
      audioUrl: blobUrl,
      videoUrl: isVideo ? blobUrl : undefined,
      isOwned: true,
      year: meta.year || '2025',
    });
  }

  return { folderName: topFolder, songs };
}
