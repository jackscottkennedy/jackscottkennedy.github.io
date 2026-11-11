export interface RemixSettings {
  speed: number; // 0.5 to 2.0 (default 1.0)
  pitchShift: number; // -12 to 12 semitones (default 0)
  reverb: number; // 0 to 100% (default 0)
  lowPassFilter: number; // 500 to 20000 Hz (default 20000 = off)
  restartOnEdit?: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number; // duration in seconds
  artworkUrl: string;
  audioUrl: string;
  videoUrl?: string; // .mp4 auto-detected as having music video
  isOwned: boolean; // owned songs can be added to playlists, unowned can be bought/bookmarked
  price?: string;
  buyUrl?: string;
  isRemix?: boolean;
  remixSettings?: RemixSettings;
  originalSongId?: string;
  year?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  isFavorite?: boolean;
  isSystem?: boolean; // e.g. "Imported Songs Folder" or "Remixes Folder"
  tags?: string[];
  coverArtworks?: string[];
}

export interface Bookmark {
  id: string;
  songId: string;
  song: Song;
  dateAdded: string;
}

export interface AppSettings {
  backgroundMode: 'nowPlaying' | 'color' | 'staticAlbum';
  backgroundColor: string;
  staticAlbumArtworkUrl: string;
  musicSourceFolderName: string;
  offlineMode: boolean;
  volume: number;
}

export interface NotificationItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

export type ActiveTab = 'discover' | 'collection' | 'search';

export type ModalPlayerViewMode = 'disc' | 'album' | 'video';

export interface PinnedTopic {
  id: string;
  title: string;
  query: string;
}
