import React, { useState, useEffect } from 'react';
import { 
  Song, 
  Playlist, 
  PinnedTopic 
} from '../types';
import { searchITunes, fetchTrendingSongs } from '../utils/itunesApi';
import { 
  BookmarkIcon as BookmarkOutlineIcon, 
  BookmarkSquareIcon, 
  Cog6ToothIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowTopRightOnSquareIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';

// ==========================================
// 1. DISCOVER TAB PAGE
// ==========================================
interface DiscoverPageProps {
  allSongs: Song[];
  bookmarkedIds: Set<string>;
  currentlyPlayingSong: Song | null;
  isPlaying: boolean;
  pinnedTopics: PinnedTopic[];
  isOffline: boolean;
  onPlaySong: (song: Song) => void;
  onToggleBookmark: (song: Song) => void;
  onSongClick: (song: Song) => void;
  onArtistClick: (artist: string) => void;
  onOpenBookmarks: () => void;
  onOpenPinTopic: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  allSongs,
  bookmarkedIds,
  currentlyPlayingSong,
  isPlaying,
  pinnedTopics,
  isOffline,
  onPlaySong,
  onToggleBookmark,
  onSongClick,
  onArtistClick,
  onOpenBookmarks,
  onOpenPinTopic,
}) => {
  // Topic query results cache
  const [topicSongs, setTopicSongs] = useState<Record<string, Song[]>>({});
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);

  useEffect(() => {
    // Load genuine iTunes Trending chart songs
    fetchTrendingSongs(isOffline, 14).then(results => {
      setTrendingSongs(results.length > 0 ? results : allSongs.slice(0, 8));
    });

    // Load each pinned topic based on its specific category/query
    pinnedTopics.forEach(topic => {
      const query = topic.query || topic.title;
      searchITunes(query, isOffline, 12).then(results => {
        setTopicSongs(prev => ({ ...prev, [topic.id]: results }));
      });
    });
  }, [pinnedTopics, isOffline, allSongs]);

  return (
    <div className="w-full flex flex-col gap-6 pb-28 pt-2">
      {/* Top Bar (buttons have no background as per prompt) */}
      <div className="flex justify-between items-center px-4">
        <div className="w-12" />
        <h1 className="text-xl font-bold tracking-wide text-white">Discover</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenBookmarks}
            aria-label="Bookmarks"
            className="p-2 text-white/80 hover:text-white transition active:scale-95"
            title="Open bookmarks"
          >
            <BookmarkOutlineIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenPinTopic}
            aria-label="Pin topic"
            className="p-2 text-white/80 hover:text-white transition active:scale-95"
            title="Pin custom topic"
          >
            <BookmarkSquareIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Trending Section */}
      <div className="flex flex-col gap-3 px-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Trending</h2>
          <span className="text-xs text-white/40"></span>
        </div>
        <HorizontalStackCarousel
          songs={trendingSongs}
          bookmarkedIds={bookmarkedIds}
          currentlyPlayingSong={currentlyPlayingSong}
          isPlaying={isPlaying}
          onPlaySong={onPlaySong}
          onToggleBookmark={onToggleBookmark}
          onSongClick={onSongClick}
          onArtistClick={onArtistClick}
        />
      </div>

      {/* Pinned Topics Carousels */}
      {pinnedTopics.map(topic => {
        const songs = topicSongs[topic.id] || [];
        return (
          <div key={topic.id} className="flex flex-col gap-3 px-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">{topic.title}</h2>
              <span className="text-xs text-white/40">Topic</span>
            </div>
            <HorizontalStackCarousel
              songs={songs.length > 0 ? songs : allSongs.slice(0, 6)}
              bookmarkedIds={bookmarkedIds}
              currentlyPlayingSong={currentlyPlayingSong}
              isPlaying={isPlaying}
              onPlaySong={onPlaySong}
              onToggleBookmark={onToggleBookmark}
              onSongClick={onSongClick}
              onArtistClick={onArtistClick}
            />
          </div>
        );
      })}
    </div>
  );
};

// Horizontal Carousel with stacked cards:
interface CarouselProps {
  songs: Song[];
  bookmarkedIds: Set<string>;
  currentlyPlayingSong: Song | null;
  isPlaying: boolean;
  onPlaySong: (song: Song) => void;
  onToggleBookmark: (song: Song) => void;
  onSongClick: (song: Song) => void;
  onArtistClick: (artist: string) => void;
}

const HorizontalStackCarousel: React.FC<CarouselProps> = ({
  songs,
  bookmarkedIds,
  currentlyPlayingSong,
  isPlaying,
  onPlaySong,
  onToggleBookmark,
  onSongClick,
  onArtistClick,
}) => {
  return (
    <div className="flex overflow-x-auto gap-4 py-2 px-1 no-scrollbar scroll-smooth">
      {songs.map((song) => {
        const isCurrent = currentlyPlayingSong?.id === song.id;
        const isPlayingThis = isCurrent && isPlaying;
        const isBookmarked = bookmarkedIds.has(song.id);

        return (
          <div
            key={song.id}
            className="flex-shrink-0 w-44 sm:w-48 flex flex-col gap-2 group transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Artwork Card */}
            <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-neutral-800">
              <img
                src={song.artworkUrl}
                alt={song.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Top Action Pills: Price & Bookmark */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                <a
                  href={song.buyUrl || 'https://music.apple.com'}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 bg-DarkGlass hover:bg-white/30 text-white font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-1 shadow transition"
                >
                  <span>{song.price || '$1.29'}</span>
                  <ArrowTopRightOnSquareIcon className="w-2.5 h-2.5 opacity-60" />
                </a>

                <button
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(song); }}
                  className={`p-1.5 bg-DarkGlass hover:bg-white/30 rounded-full backdrop-blur-xl border border-white/10 shadow transition ${
                    isBookmarked ? 'text-white' : 'text-white/60'
                  }`}
                  title="Bookmark for purchase"
                >
                  {isBookmarked ? (
                    <BookmarkSolidIcon className="w-3.5 h-3.5 fill-white" />
                  ) : (
                    <BookmarkOutlineIcon className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Inline 30-second Preview Audio Button */}
              <button
                onClick={(e) => { e.stopPropagation(); onPlaySong(song); }}
                className="absolute bottom-2 right-2 p-2.5 bg-DarkGlass hover:bg-white text-white hover:text-black rounded-full backdrop-blur-xl border border-white/10 shadow-lg active:scale-90 transition z-10"
                title="Play 30s preview"
              >
                {isPlayingThis ? (
                  <PauseIcon className="w-4 h-4 fill-current" />
                ) : (
                  <PlayIcon className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Song title and artist (clickable) */}
            <div className="flex flex-col">
              <button
                onClick={() => onSongClick(song)}
                className="text-left font-semibold text-sm text-white hover:underline truncate"
              >
                {song.title}
              </button>
              <button
                onClick={() => onArtistClick(song.artist)}
                className="text-left text-xs text-white/50 hover:text-white hover:underline truncate"
              >
                {song.artist}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 2. COLLECTION TAB PAGE
// ==========================================
interface CollectionPageProps {
  playlists: Playlist[];
  onOpenSettings: () => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onReorderPlaylists: (reordered: Playlist[]) => void;
  onSongClick: (song: Song) => void;
  allSongs: Song[];
  remixes: Song[];
}

export const CollectionPage: React.FC<CollectionPageProps> = ({
  playlists,
  onOpenSettings,
  onOpenPlaylist,
  onPlayPlaylist,
  onReorderPlaylists,
  allSongs,
  remixes,
}) => {
  const favorites = playlists.filter(p => p.isFavorite && !p.isSystem);
  const userPlaylists = playlists.filter(p => !p.isFavorite && !p.isSystem);
  const systemPlaylists = playlists.filter(p => p.isSystem);

  // Drag and drop reordering
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const reordered = [...playlists];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setDraggedIdx(targetIdx);
    onReorderPlaylists(reordered);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-28 pt-2">
      {/* Top Bar (buttons have no background as per prompt) */}
      <div className="flex justify-between items-center px-4">
        <div className="w-12" />
        <h1 className="text-xl font-bold tracking-wide text-white">Collection</h1>
        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-2 text-white/80 hover:text-white transition active:scale-95"
          title="Open settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Favourites Section */}
      {favorites.length > 0 && (
        <div className="flex flex-col gap-3 px-4">
          <h2 className="text-xl font-bold text-white">Favourites</h2>
          <div className="flex flex-col gap-2.5">
            {favorites.map((p) => (
              <PlaylistRowCard
                key={p.id}
                playlist={p}
                onOpen={() => onOpenPlaylist(p)}
                onPlay={() => onPlayPlaylist(p)}
                allSongs={allSongs}
              />
            ))}
          </div>
        </div>
      )}

      {/* User Playlists Section */}
      <div className="flex flex-col gap-3 px-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Playlists</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {userPlaylists.length === 0 ? (
            <p className="text-xs text-white/40 py-2">No custom playlists created yet.</p>
          ) : (
            userPlaylists.map((p, idx) => (
              <div
                key={p.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                className="cursor-grab active:cursor-grabbing"
              >
                <PlaylistRowCard
                  playlist={p}
                  onOpen={() => onOpenPlaylist(p)}
                  onPlay={() => onPlayPlaylist(p)}
                  allSongs={allSongs}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Section: Imported Songs Folder & Remixes Folder */}
      <div className="flex flex-col gap-3 px-4">
        <h2 className="text-xl font-bold text-white">All</h2>
        <div className="flex flex-col gap-2.5">
          {systemPlaylists.map((p) => (
            <PlaylistRowCard
              key={p.id}
              playlist={p}
              onOpen={() => onOpenPlaylist(p)}
              onPlay={() => onPlayPlaylist(p)}
              allSongs={p.name.includes('Remix') ? remixes : allSongs}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// Playlist Row Card matching Figma collection playlist styling
interface PlaylistRowCardProps {
  playlist: Playlist;
  onOpen: () => void;
  onPlay: () => void;
  allSongs: Song[];
}

const PlaylistRowCard: React.FC<PlaylistRowCardProps> = ({
  playlist,
  onOpen,
  onPlay,
  allSongs,
}) => {
  const songsInPlaylist = allSongs.filter(s => playlist.songIds.includes(s.id));
  const coverArts = songsInPlaylist.slice(0, 4).map(s => s.artworkUrl);

  const totalSecs = songsInPlaylist.reduce((acc, s) => acc + s.duration, 0);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const durStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  return (
    <div
      onClick={onOpen}
      className="w-full p-2.5 rounded-2xl bg-DarkGlass hover:bg-white/10 border border-white/5 backdrop-blur-xl flex justify-between items-center cursor-pointer transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* AlbumStack representation from Figma */}
        <div className="relative size-16 flex-shrink-0 flex items-center justify-center">
          {coverArts.length > 0 ? (
            coverArts.map((art, idx) => (
              <div
                key={idx}
                style={{
                  transform: `rotate(${(idx - 1) * 6}deg)`,
                  zIndex: idx + 1,
                }}
                className="size-12 sm:size-14 rounded overflow-hidden outline outline-[0.5px] outline-white/20 shadow absolute"
              >
                <img src={art} alt="" className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="size-14 rounded bg-neutral-800 border border-white/10 flex items-center justify-center">
              <MusicalNoteIcon className="w-6 h-6 text-white/40" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col min-w-0 flex-1 pl-2">
          <span className="font-semibold text-sm sm:text-base text-white truncate">{playlist.name}</span>
          <span className="text-xs text-white/50 truncate">
            {songsInPlaylist.length} songs • {durStr}
          </span>
          <div className="flex gap-1 mt-1">
            {(playlist.tags || ['lofi', 'pop']).slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.2 bg-black/40 rounded text-[9px] text-white/70">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Play Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPlay(); }}
        className="p-2.5 bg-DarkGlass hover:bg-white text-white hover:text-black rounded-full border border-white/10 backdrop-blur-xl transition active:scale-90"
        title="Play this playlist"
      >
        <PlayIcon className="w-4 h-4 fill-current ml-0.5" />
      </button>
    </div>
  );
};

// ==========================================
// 3. SEARCH TAB PAGE
// ==========================================
interface SearchPageProps {
  ownedSongs: Song[];
  isOffline: boolean;
  onPlaySong: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onToggleBookmark: (song: Song) => void;
  bookmarkedIds: Set<string>;
  onSongClick: (song: Song) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  ownedSongs,
  isOffline,
  onPlaySong,
  onAddToPlaylist,
  onToggleBookmark,
  bookmarkedIds,
  onSongClick,
}) => {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'collection' | 'store'>('collection');
  const [storeResults, setStoreResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search store debounced
  useEffect(() => {
    if (scope !== 'store' || !query.trim()) {
      setStoreResults([]);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      searchITunes(query, isOffline, 25).then(res => {
        setStoreResults(res);
        setIsSearching(false);
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, scope, isOffline]);

  const collectionResults = ownedSongs.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase()) ||
    s.artist.toLowerCase().includes(query.toLowerCase()) ||
    s.album.toLowerCase().includes(query.toLowerCase()) ||
    s.genre.toLowerCase().includes(query.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const results = scope === 'collection' ? collectionResults : storeResults;

  return (
    <div className="w-full flex flex-col gap-4 pb-28 pt-2 px-4">
      {/* Top Bar */}
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-wide text-white">Search</h1>
      </div>

      {/* Search Input Bar */}
      <div className="w-full flex items-center gap-2 px-3 py-3 bg-DarkGlass rounded-2xl border border-white/10 backdrop-blur-xl">
        <MagnifyingGlassIcon className="w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={scope === 'collection' ? 'Search your owned library' : 'Search songs to buy on iTunes'}
          className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-1"
        />
      </div>

      {/* Scope Segmented Control (width fills parent) */}
      <div className="w-full p-1 bg-DarkGlass rounded-full flex items-center border border-white/10 backdrop-blur-xl">
        <button
          onClick={() => setScope('collection')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-full transition ${
            scope === 'collection' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
          }`}
        >
          Your Collection ({collectionResults.length})
        </button>
        <button
          onClick={() => setScope('store')}
          className={`flex-1 py-2 text-center text-xs font-semibold rounded-full transition ${
            scope === 'store' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
          }`}
        >
          Store ({storeResults.length})
        </button>
      </div>

      {/* Results List */}
      <div className="flex flex-col gap-2 mt-2">
        {isSearching ? (
          <p className="text-center text-xs text-white/50 py-8 animate-pulse">Searching iTunes Store...</p>
        ) : results.length === 0 ? (
          <p className="text-center text-xs text-white/40 py-8">
            {query.trim() ? 'No matches found.' : 'Type a title, artist, or genre to search.'}
          </p>
        ) : (
          results.map(song => (
            <div
              key={song.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
            >
              <div 
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => onSongClick(song)}
              >
                <img src={song.artworkUrl} alt="" className="size-12 rounded object-cover shadow" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-white truncate hover:underline">{song.title}</span>
                  <span className="text-xs text-white/60 truncate">{song.artist}</span>
                  {song.isRemix && (
                    <span className="w-fit px-1.5 py-0.2 bg-black/40 border border-white/20 rounded text-[9px] text-white/80">
                      Remix
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{formatTime(song.duration)}</span>
                
                {song.isOwned ? (
                  <button
                    onClick={() => onAddToPlaylist(song)}
                    className="p-2 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                    title="Add to playlist"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleBookmark(song)}
                    className={`p-2 bg-DarkGlass rounded-full hover:bg-white/20 transition ${
                      bookmarkedIds.has(song.id) ? 'text-white' : 'text-white/60'
                    }`}
                    title="Bookmark song"
                  >
                    {bookmarkedIds.has(song.id) ? (
                      <BookmarkSolidIcon className="w-3.5 h-3.5 fill-white" />
                    ) : (
                      <BookmarkOutlineIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                <button
                  onClick={() => onPlaySong(song)}
                  className="p-2 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                  title="Play"
                >
                  <PlayIcon className="w-3.5 h-3.5 fill-white ml-0.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
