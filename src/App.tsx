import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Song, 
  Playlist, 
  Bookmark, 
  AppSettings, 
  ActiveTab, 
  PinnedTopic, 
  RemixSettings 
} from './types';
import { audioEngine } from './utils/audioEngine';
import { 
  resolveSettings, 
  loadSavedSettings, 
  saveSettings,
  loadSavedPlaylists, 
  savePlaylists,
  loadSavedBookmarks, 
  saveBookmarks,
  loadSavedRemixes, 
  saveRemixes,
  loadSavedOwnedSongs, 
  saveOwnedSongs,
  exportAppJson,
  pickMusicFolderWithFSA,
  parseFileListToSongs
} from './utils/storageAndSettings';

import { ModalPlayer } from './components/ModalPlayer';
import { 
  SongPopUp, 
  ArtistPopUp, 
  AlbumPopUp, 
  PinPopUp, 
  RemixCreatorDrawer, 
  SettingsPopUp, 
  SelectBackgroundDrawer, 
  PlaylistDrawer 
} from './components/PopupsAndDrawers';
import { DiscoverPage, CollectionPage, SearchPage } from './components/MainPages';

import { 
  SparklesIcon, 
  RectangleStackIcon, 
  MagnifyingGlassIcon, 
  PlusIcon, 
  BookmarkIcon as BookmarkOutlineIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';

export default function App() {
  // 1. Settings state (Level 1 + Level 2 + Level 3)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const level3 = loadSavedSettings();
    return resolveSettings(level3);
  });

  // 2. Core Collections
  const [ownedSongs, setOwnedSongs] = useState<Song[]>(() => loadSavedOwnedSongs());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadSavedPlaylists());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadSavedBookmarks());
  const [remixes, setRemixes] = useState<Song[]>(() => loadSavedRemixes());
  
  // Pinned topics on Discover with rich music search terms
  const [pinnedTopics, setPinnedTopics] = useState<PinnedTopic[]>([
    { id: 'pin-1', title: 'Lo-Fi Chill', query: 'lo-fi hip hop chill beats' },
    { id: 'pin-2', title: 'Synthwave & Retro', query: 'synthwave 80s neon electronic' },
    { id: 'pin-3', title: 'Moon Group', query: 'Moon Group chill' },
  ]);

  // 3. Playback State
  const [currentSong, setCurrentSong] = useState<Song | null>(() => ownedSongs[0] || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [artViewMode, setArtViewMode] = useState<1 | 2>(1);

  // 4. UI Viewport & Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [isModalPlayerOpen, setIsModalPlayerOpen] = useState(false);
  const [isLandscapeSplit, setIsLandscapeSplit] = useState(false);

  // 5. Active Popups & Drawers
  const [selectedSongDetail, setSelectedSongDetail] = useState<Song | null>(null);
  const [selectedArtistDetail, setSelectedArtistDetail] = useState<string | null>(null);
  const [selectedAlbumDetail, setSelectedAlbumDetail] = useState<{ album: string; artist: string } | null>(null);
  const [isPinPopupOpen, setIsPinPopupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSelectBgOpen, setIsSelectBgOpen] = useState(false);
  const [remixDrawerSong, setRemixDrawerSong] = useState<Song | null>(null);
  const [activePlaylistDrawer, setActivePlaylistDrawer] = useState<Playlist | null>(null);
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [selectPlaylistForSong, setSelectPlaylistForSong] = useState<Song | null>(null);

  // 6. Notifications
  const [notification, setNotification] = useState<string | null>(null);
  const notifyTimerRef = useRef<number | null>(null);

  const showNotification = (msg: string) => {
    if (notifyTimerRef.current) clearTimeout(notifyTimerRef.current);
    setNotification(msg);
    notifyTimerRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3200);
  };

  // 7. PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      showNotification('Aura Music installed successfully!');
      setDeferredPrompt(null);
    }
  };

  // Responsive landscape detection (Desktop or tablet in landscape: width >= 1024)
  useEffect(() => {
    const checkLandscape = () => {
      const isLand = window.innerWidth >= 1024;
      setIsLandscapeSplit(isLand);
    };
    checkLandscape();
    window.addEventListener('resize', checkLandscape);
    return () => window.removeEventListener('resize', checkLandscape);
  }, []);

  // Sync audio engine callbacks
  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (t, d) => {
        setCurrentTime(t);
        setDuration(d);
      },
      onPlayState: (playing) => {
        setIsPlaying(playing);
      },
      onEnded: () => {
        handleNextSong();
      },
    });
    audioEngine.setVolume(settings.volume);
  }, [settings.volume]);

  // Update volume
  const handleVolumeChange = (vol: number) => {
    const updated = { ...settings, volume: vol };
    setSettings(updated);
    saveSettings(updated);
    audioEngine.setVolume(vol);
  };

  // Play a song
  const handlePlaySong = async (song: Song, remix?: RemixSettings) => {
    setCurrentSong(song);
    await audioEngine.playSong(song, remix);
  };

  const handleTogglePlay = async () => {
    if (!currentSong && ownedSongs.length > 0) {
      await handlePlaySong(ownedSongs[0]);
      return;
    }
    await audioEngine.togglePlay();
  };

  const handleSeek = (seconds: number) => {
    audioEngine.seek(seconds);
    setCurrentTime(seconds);
  };

  // Previous and Next song
  const handlePrevSong = () => {
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    const currentList = ownedSongs;
    const currentIndex = currentList.findIndex(s => s.id === currentSong?.id);
    const prevIdx = (currentIndex - 1 + currentList.length) % currentList.length;
    handlePlaySong(currentList[prevIdx]);
  };

  const handleNextSong = () => {
    const currentList = ownedSongs;
    if (isRepeat) {
      audioEngine.seek(0);
      if (!isPlaying) audioEngine.togglePlay();
      return;
    }
    if (isShuffle) {
      const randomIdx = Math.floor(Math.random() * currentList.length);
      handlePlaySong(currentList[randomIdx]);
      return;
    }
    const currentIndex = currentList.findIndex(s => s.id === currentSong?.id);
    const nextIdx = (currentIndex + 1) % currentList.length;
    handlePlaySong(currentList[nextIdx]);
  };

  // Shuffle toggle
  const handleToggleShuffle = () => {
    const next = !isShuffle;
    setIsShuffle(next);
    showNotification(next ? 'Shuffle enabled' : 'Shuffle disabled');
  };

  // Repeat toggle
  const handleToggleRepeat = () => {
    const next = !isRepeat;
    setIsRepeat(next);
    showNotification(next ? 'Repeat enabled' : 'Repeat disabled');
  };

  // Bookmark actions
  const bookmarkedIds = new Set(bookmarks.map(b => b.songId));

  const handleToggleBookmark = (song: Song) => {
    if (bookmarkedIds.has(song.id)) {
      const filtered = bookmarks.filter(b => b.songId !== song.id);
      setBookmarks(filtered);
      saveBookmarks(filtered);
      showNotification(`"${song.title}" removed from bookmarks`);
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}`,
        songId: song.id,
        song,
        dateAdded: new Date().toISOString().split('T')[0],
      };
      const updated = [newBm, ...bookmarks];
      setBookmarks(updated);
      saveBookmarks(updated);
      showNotification(`"${song.title}" added to bookmarks`);
    }
  };

  // Playlist actions
  const handleAddToPlaylist = (song: Song, playlistId: string) => {
    const updated = playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songIds.includes(song.id)) return p;
        return { ...p, songIds: [...p.songIds, song.id] };
      }
      return p;
    });
    setPlaylists(updated);
    savePlaylists(updated);
    const target = playlists.find(p => p.id === playlistId);
    showNotification(`"${song.title}" added to ${target?.name || 'playlist'}`);
    setSelectPlaylistForSong(null);
  };

  // Remix saving
  const handleSaveRemix = (original: Song, fx: RemixSettings) => {
    const newRemixId = `remix-${Date.now()}`;
    const newRemixSong: Song = {
      ...original,
      id: newRemixId,
      originalSongId: original.id,
      title: `${original.title} (Remix)`,
      isRemix: true,
      remixSettings: fx,
      isOwned: true,
    };

    const updatedRemixes = [newRemixSong, ...remixes];
    setRemixes(updatedRemixes);
    saveRemixes(updatedRemixes);

    // Also update "Remixes Folder" playlist
    const updatedPlaylists = playlists.map(p => {
      if (p.name.includes('Remix')) {
        return { ...p, songIds: [newRemixId, ...p.songIds] };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);
    savePlaylists(updatedPlaylists);

    showNotification(`Remix saved to Remixes playlist!`);
  };

  // Folder import
  const fileInputFolderRef = useRef<HTMLInputElement>(null);

  const handleSelectFolder = async () => {
    try {
      const result = await pickMusicFolderWithFSA();
      const updatedSongs = [...result.songs, ...ownedSongs];
      const uniqueSongs = Array.from(new Map(updatedSongs.map(s => [`${s.title}-${s.artist}`, s])).values());
      setOwnedSongs(uniqueSongs);
      saveOwnedSongs(uniqueSongs);

      const newSettings = { ...settings, musicSourceFolderName: result.folderName };
      setSettings(newSettings);
      saveSettings(newSettings);

      const updatedPlaylists = playlists.map(p => {
        if (p.id === 'sys-all-imported') {
          return { ...p, songIds: uniqueSongs.map(s => s.id) };
        }
        return p;
      });
      setPlaylists(updatedPlaylists);
      savePlaylists(updatedPlaylists);

      showNotification(`Imported ${result.songs.length} songs from "${result.folderName}"`);
    } catch {
      fileInputFolderRef.current?.click();
    }
  };

  const handleMobileFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const result = await parseFileListToSongs(e.target.files);
    const updatedSongs = [...result.songs, ...ownedSongs];
    const uniqueSongs = Array.from(new Map(updatedSongs.map(s => [`${s.title}-${s.artist}`, s])).values());
    setOwnedSongs(uniqueSongs);
    saveOwnedSongs(uniqueSongs);

    const newSettings = { ...settings, musicSourceFolderName: result.folderName };
    setSettings(newSettings);
    saveSettings(newSettings);

    const updatedPlaylists = playlists.map(p => {
      if (p.id === 'sys-all-imported') {
        return { ...p, songIds: uniqueSongs.map(s => s.id) };
      }
      return p;
    });
    setPlaylists(updatedPlaylists);
    savePlaylists(updatedPlaylists);

    showNotification(`Imported ${result.songs.length} songs from "${result.folderName}"`);
  };

  // JSON Import & Export
  const handleExportData = () => {
    exportAppJson('aura-full-backup.json', {
      playlists,
      bookmarks,
      remixes,
      settings,
    });
    showNotification('App data exported as JSON!');
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (parsed.playlists) {
        setPlaylists(parsed.playlists);
        savePlaylists(parsed.playlists);
      }
      if (parsed.bookmarks) {
        setBookmarks(parsed.bookmarks);
        saveBookmarks(parsed.bookmarks);
      }
      if (parsed.remixes) {
        setRemixes(parsed.remixes);
        saveRemixes(parsed.remixes);
      }
      if (parsed.settings) {
        const merged = resolveSettings(parsed.settings);
        setSettings(merged);
        saveSettings(merged);
      }

      showNotification('App data successfully imported!');
    } catch {
      showNotification('Failed to parse JSON file.');
    }
  };

  // Background artwork source (always displays rich album art by default)
  const activeBackgroundArtwork = 
    settings.backgroundMode === 'color' 
      ? '' 
      : settings.backgroundMode === 'staticAlbum' 
      ? (settings.staticAlbumArtworkUrl || currentSong?.artworkUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=85') 
      : (currentSong?.artworkUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=85');

  // Swipe gesture on mini player (left = next, right = prev)
  const touchStartX = useRef<number | null>(null);

  const handleMiniTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleMiniTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff < -50) {
      handleNextSong();
    } else if (diff > 50) {
      handlePrevSong();
    }
    touchStartX.current = null;
  };

  return (
    <div 
      className="relative w-full min-h-screen text-white overflow-hidden flex flex-col"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important"
      }}
    >
      {/* Hidden Mobile Directory Input */}
      <input
        type="file"
        ref={fileInputFolderRef}
        onChange={handleMobileFolderSelect}
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Global Background Album Art: Blurred, vibrant, slightly dimmed at top, dimmed heaviest at bottom */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {settings.backgroundMode === 'color' ? (
          <div 
            className="w-full h-full transition-colors duration-700"
            style={{ backgroundColor: settings.backgroundColor }}
          />
        ) : (
          <img
            src={activeBackgroundArtwork}
            alt=""
            className="w-full h-full object-cover blur-2xl scale-110 opacity-85 transition-all duration-700"
          />
        )}
        {/* Darkener Overlay: lightly dimmed at top, heaviest dimming at the bottom as requested */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
      </div>

      {/* Notification Banner: Smooth slide from top without bounce */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-4 inset-x-0 mx-auto w-fit z-50 pointer-events-none"
          >
            <div className="h-8 px-4 bg-DarkGlass/90 rounded-full outline outline-1 outline-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <span className="text-white text-xs font-semibold">{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Install Banner */}
      {deferredPrompt && (
        <div className="fixed top-14 inset-x-4 max-w-sm mx-auto z-40 p-2.5 bg-DarkGlass backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-between shadow-2xl">
          <span className="text-xs text-white/90">Install Aura Music PWA</span>
          <button
            onClick={handleInstallPWA}
            className="px-3 py-1 bg-white text-black rounded-full font-bold text-xs flex items-center gap-1 shadow"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        </div>
      )}

      {/* Main Layout Container:
          On desktop / landscape: Split view (left = page with bottom navbar, right = modal player).
          On mobile: Page + MiniPlayer + Bottom Navbar.
      */}
      {isLandscapeSplit ? (
        // DESKTOP & TABLET LANDSCAPE SPLIT VIEW
        <div className="relative z-10 w-full h-screen flex flex-row overflow-hidden">
          {/* Left Column: Navigation + Active Page + Bottom Navbar */}
          <div className="flex-1 h-full flex flex-col border-r border-white/10 relative overflow-hidden bg-black/20 backdrop-blur-xs">
            {/* Top Header */}
           

            {/* Page Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4">
              {activeTab === 'discover' && (
                <DiscoverPage
                  allSongs={ownedSongs}
                  bookmarkedIds={bookmarkedIds}
                  currentlyPlayingSong={currentSong}
                  isPlaying={isPlaying}
                  pinnedTopics={pinnedTopics}
                  isOffline={settings.offlineMode}
                  onPlaySong={handlePlaySong}
                  onToggleBookmark={handleToggleBookmark}
                  onSongClick={setSelectedSongDetail}
                  onArtistClick={setSelectedArtistDetail}
                  onOpenBookmarks={() => setIsBookmarksDrawerOpen(true)}
                  onOpenPinTopic={() => setIsPinPopupOpen(true)}
                />
              )}
              {activeTab === 'collection' && (
                <CollectionPage
                  playlists={playlists}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onOpenPlaylist={setActivePlaylistDrawer}
                  onPlayPlaylist={(p) => {
                    const first = ownedSongs.find(s => p.songIds.includes(s.id));
                    if (first) handlePlaySong(first);
                  }}
                  onReorderPlaylists={(reordered) => {
                    setPlaylists(reordered);
                    savePlaylists(reordered);
                  }}
                  onSongClick={setSelectedSongDetail}
                  allSongs={ownedSongs}
                  remixes={remixes}
                />
              )}
              {activeTab === 'search' && (
                <SearchPage
                  ownedSongs={ownedSongs}
                  isOffline={settings.offlineMode}
                  onPlaySong={handlePlaySong}
                  onAddToPlaylist={(song) => setSelectPlaylistForSong(song)}
                  onToggleBookmark={handleToggleBookmark}
                  bookmarkedIds={bookmarkedIds}
                  onSongClick={setSelectedSongDetail}
                />
              )}
            </div>

            {/* Bottom Navigation Bar kept at bottom in landscape, width fills screen/container */}
            <div className="w-full p-3 border-t border-white/10 bg-DarkGlass/90 backdrop-blur-2xl flex items-center justify-center">
              <nav className="w-full max-w-md h-12 bg-black/40 rounded-full p-1 border border-white/10 flex items-center justify-between">
                <button
                  onClick={() => setActiveTab('discover')}
                  aria-label="Discover tab"
                  className={`flex-1 h-full rounded-full flex items-center justify-center gap-2 transition active:scale-95 ${
                    activeTab === 'discover' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Discover</span>
                </button>

                <button
                  onClick={() => setActiveTab('collection')}
                  aria-label="Collection tab"
                  className={`flex-1 h-full rounded-full flex items-center justify-center gap-2 transition active:scale-95 ${
                    activeTab === 'collection' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <RectangleStackIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Collection</span>
                </button>

                <button
                  onClick={() => setActiveTab('search')}
                  aria-label="Search tab"
                  className={`flex-1 h-full rounded-full flex items-center justify-center gap-2 transition active:scale-95 ${
                    activeTab === 'search' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
                  }`}
                >
                  <MagnifyingGlassIcon className="w-4 h-4" />
                  <span className="text-xs font-semibold">Search</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Right Column: Always Visible Modal Player */}
          <div className="w-[450px] lg:w-[480px] h-full flex flex-col relative bg-neutral-900/60 backdrop-blur-xl flex-shrink-0">
            <ModalPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              isShuffle={isShuffle}
              isRepeat={isRepeat}
              artViewMode={artViewMode}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onPrev={handlePrevSong}
              onNext={handleNextSong}
              onToggleShuffle={handleToggleShuffle}
              onToggleRepeat={handleToggleRepeat}
              onToggleArtView={() => setArtViewMode(artViewMode === 1 ? 2 : 1)}
              onClose={() => {}}
              onOpenRemix={(song) => setRemixDrawerSong(song)}
              onOpenAddToPlaylist={(song) => setSelectPlaylistForSong(song)}
              onToggleBookmark={handleToggleBookmark}
              isBookmarked={currentSong ? bookmarkedIds.has(currentSong.id) : false}
              onSongClick={setSelectedSongDetail}
              onArtistClick={setSelectedArtistDetail}
              onAlbumClick={(album, artist) => setSelectedAlbumDetail({ album, artist })}
              volume={settings.volume}
              onVolumeChange={handleVolumeChange}
            />
          </div>
        </div>
      ) : (
        // MOBILE / PORTRAIT VIEW
        <div className="relative z-10 w-full flex-1 flex flex-col overflow-y-auto no-scrollbar">
          {/* Main Active Page */}
          <main className="flex-1 w-full max-w-md mx-auto">
            {activeTab === 'discover' && (
              <DiscoverPage
                allSongs={ownedSongs}
                bookmarkedIds={bookmarkedIds}
                currentlyPlayingSong={currentSong}
                isPlaying={isPlaying}
                pinnedTopics={pinnedTopics}
                isOffline={settings.offlineMode}
                onPlaySong={handlePlaySong}
                onToggleBookmark={handleToggleBookmark}
                onSongClick={setSelectedSongDetail}
                onArtistClick={setSelectedArtistDetail}
                onOpenBookmarks={() => setIsBookmarksDrawerOpen(true)}
                onOpenPinTopic={() => setIsPinPopupOpen(true)}
              />
            )}
            {activeTab === 'collection' && (
              <CollectionPage
                playlists={playlists}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenPlaylist={setActivePlaylistDrawer}
                onPlayPlaylist={(p) => {
                  const first = ownedSongs.find(s => p.songIds.includes(s.id));
                  if (first) handlePlaySong(first);
                }}
                onReorderPlaylists={(reordered) => {
                  setPlaylists(reordered);
                  savePlaylists(reordered);
                }}
                onSongClick={setSelectedSongDetail}
                allSongs={ownedSongs}
                remixes={remixes}
              />
            )}
            {activeTab === 'search' && (
              <SearchPage
                ownedSongs={ownedSongs}
                isOffline={settings.offlineMode}
                onPlaySong={handlePlaySong}
                onAddToPlaylist={(song) => setSelectPlaylistForSong(song)}
                onToggleBookmark={handleToggleBookmark}
                bookmarkedIds={bookmarkedIds}
                onSongClick={setSelectedSongDetail}
              />
            )}
          </main>

          {/* Sticky Mini Player (Above Navbar on mobile) */}
          {currentSong && !isModalPlayerOpen && (
            <div 
              className="fixed bottom-20 inset-x-3 max-w-md mx-auto z-30 transition-transform active:scale-[0.99]"
              onTouchStart={handleMiniTouchStart}
              onTouchEnd={handleMiniTouchEnd}
            >
              <div 
                onClick={() => setIsModalPlayerOpen(true)}
                className="w-full h-16 bg-neutral-900/85 hover:bg-neutral-800/90 border border-white/10 rounded-2xl backdrop-blur-2xl flex items-center justify-between px-3 shadow-2xl cursor-pointer relative overflow-hidden"
              >
                {/* Progress bar at the bottom of mini player */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                  <div 
                    className="h-full bg-white/70"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>

                {/* Left: Spinning Disc with Vinyl center hole */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative size-12 flex-shrink-0">
                    <div 
                      className={`size-12 rounded-full overflow-hidden border border-white/20 shadow animate-spin-disc ${
                        isPlaying ? 'spin-running' : 'spin-paused'
                      }`}
                    >
                      <img src={currentSong.artworkUrl} alt="" className="w-full h-full object-cover" />
                      {/* Center spindle hole */}
                      <div className="absolute inset-0 m-auto size-2.5 rounded-full bg-black border border-white/30" />
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate">{currentSong.title}</span>
                    <span className="text-xs text-white/50 truncate">{currentSong.artist}</span>
                  </div>
                </div>

                {/* Right: Plus/Bookmark & Play/Pause */}
                <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {currentSong.isOwned ? (
                    <button
                      onClick={() => setSelectPlaylistForSong(currentSong)}
                      aria-label="Add to playlist"
                      className="p-2 text-white/80 hover:text-white rounded-full transition active:scale-90"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleBookmark(currentSong)}
                      aria-label="Bookmark"
                      className="p-2 text-white/80 hover:text-white rounded-full transition active:scale-90"
                    >
                      {bookmarkedIds.has(currentSong.id) ? (
                        <BookmarkSolidIcon className="w-5 h-5 fill-white" />
                      ) : (
                        <BookmarkOutlineIcon className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleTogglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    className="p-2 text-white rounded-full transition active:scale-90"
                  >
                    {isPlaying ? <PauseIcon className="w-6 h-6 fill-white" /> : <PlayIcon className="w-6 h-6 fill-white ml-0.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Navigation Bar on Mobile */}
          <nav 
            className="fixed bottom-3 inset-x-6 max-w-xs mx-auto h-14 bg-DarkGlass/90 backdrop-blur-2xl rounded-full p-1 border border-white/10 flex items-center justify-between z-30 shadow-2xl"
          >
            <button
              onClick={() => setActiveTab('discover')}
              aria-label="Discover tab"
              className={`flex-1 h-full rounded-full flex items-center justify-center transition active:scale-95 ${
                activeTab === 'discover' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
              }`}
            >
              <SparklesIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('collection')}
              aria-label="Collection tab"
              className={`flex-1 h-full rounded-full flex items-center justify-center transition active:scale-95 ${
                activeTab === 'collection' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
              }`}
            >
              <RectangleStackIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('search')}
              aria-label="Search tab"
              className={`flex-1 h-full rounded-full flex items-center justify-center transition active:scale-95 ${
                activeTab === 'search' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
              }`}
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </nav>
        </div>
      )}

      {/* Slidable Mobile Fullscreen Modal Player with motion animation */}
      <AnimatePresence>
        {!isLandscapeSplit && isModalPlayerOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-end"
          >
            <ModalPlayer
              currentSong={currentSong}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              isShuffle={isShuffle}
              isRepeat={isRepeat}
              artViewMode={artViewMode}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              onPrev={handlePrevSong}
              onNext={handleNextSong}
              onToggleShuffle={handleToggleShuffle}
              onToggleRepeat={handleToggleRepeat}
              onToggleArtView={() => setArtViewMode(artViewMode === 1 ? 2 : 1)}
              onClose={() => setIsModalPlayerOpen(false)}
              onOpenRemix={(song) => setRemixDrawerSong(song)}
              onOpenAddToPlaylist={(song) => setSelectPlaylistForSong(song)}
              onToggleBookmark={handleToggleBookmark}
              isBookmarked={currentSong ? bookmarkedIds.has(currentSong.id) : false}
              onSongClick={setSelectedSongDetail}
              onArtistClick={setSelectedArtistDetail}
              onAlbumClick={(album, artist) => setSelectedAlbumDetail({ album, artist })}
              volume={settings.volume}
              onVolumeChange={handleVolumeChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Menu to Select Playlist to Add Song to */}
      <AnimatePresence>
        {selectPlaylistForSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-neutral-900/90 border border-white/15 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="text-lg font-bold text-white text-center">Add to Playlist</h3>
              <p className="text-xs text-white/50 text-center truncate">"{selectPlaylistForSong.title}"</p>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto no-scrollbar">
                {playlists.filter(p => !p.isSystem).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToPlaylist(selectPlaylistForSong, p.id)}
                    className="w-full p-3 rounded-xl bg-DarkGlass hover:bg-white/20 text-left font-semibold text-sm text-white transition flex justify-between items-center"
                  >
                    <span>{p.name}</span>
                    <PlusIcon className="w-4 h-4 text-white/60" />
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelectPlaylistForSong(null)}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-xs font-semibold text-white transition"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Popups & Drawers with AnimatePresence & Landscape right positioning */}
      <AnimatePresence>
        {selectedSongDetail && (
          <SongPopUp
            key="popup-song"
            song={selectedSongDetail}
            isPlaying={isPlaying && currentSong?.id === selectedSongDetail.id}
            isBookmarked={bookmarkedIds.has(selectedSongDetail.id)}
            isLandscape={isLandscapeSplit}
            onClose={() => setSelectedSongDetail(null)}
            onPlay={(s) => handlePlaySong(s)}
            onToggleBookmark={handleToggleBookmark}
            onAddToPlaylist={(s) => setSelectPlaylistForSong(s)}
            onArtistClick={setSelectedArtistDetail}
            onAlbumClick={(album, artist) => setSelectedAlbumDetail({ album, artist })}
            onOpenRemix={(s) => setRemixDrawerSong(s)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedArtistDetail && (
          <ArtistPopUp
            key="popup-artist"
            artistName={selectedArtistDetail}
            ownedSongs={ownedSongs}
            allSongs={[...ownedSongs, ...remixes]}
            isLandscape={isLandscapeSplit}
            onClose={() => setSelectedArtistDetail(null)}
            onPlaySong={handlePlaySong}
            onAddToPlaylist={(s) => setSelectPlaylistForSong(s)}
            onPinTopic={(t) => {
              const newTopic: PinnedTopic = {
                id: `pin-${Date.now()}`,
                title: t,
                query: t,
              };
              setPinnedTopics([newTopic, ...pinnedTopics]);
              showNotification(`Pinned "${t}" to Discover!`);
              setSelectedArtistDetail(null);
            }}
            onSongClick={setSelectedSongDetail}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAlbumDetail && (
          <AlbumPopUp
            key="popup-album"
            albumName={selectedAlbumDetail.album}
            artistName={selectedAlbumDetail.artist}
            allSongs={[...ownedSongs, ...remixes]}
            isLandscape={isLandscapeSplit}
            onClose={() => setSelectedAlbumDetail(null)}
            onPlaySong={handlePlaySong}
            onAddToPlaylist={(s) => setSelectPlaylistForSong(s)}
            onSongClick={setSelectedSongDetail}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPinPopupOpen && (
          <PinPopUp
            key="popup-pin"
            isLandscape={isLandscapeSplit}
            onClose={() => setIsPinPopupOpen(false)}
            onPin={(topic) => {
              const newTopic: PinnedTopic = {
                id: `pin-${Date.now()}`,
                title: topic,
                query: topic,
              };
              setPinnedTopics([newTopic, ...pinnedTopics]);
              showNotification(`Pinned "${topic}" to Discover!`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {remixDrawerSong && (
          <RemixCreatorDrawer
            key="drawer-remix"
            song={remixDrawerSong}
            isPlaying={isPlaying && currentSong?.id === remixDrawerSong.id}
            isLandscape={isLandscapeSplit}
            onClose={() => setRemixDrawerSong(null)}
            onTogglePlay={handleTogglePlay}
            onSaveRemix={handleSaveRemix}
            onLiveSettingsChange={(fx) => {
              audioEngine.applyRemixSettings(fx);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPopUp
            key="popup-settings"
            settings={settings}
            playlistsCount={playlists.length}
            bookmarksCount={bookmarks.length}
            remixesCount={remixes.length}
            isLandscape={isLandscapeSplit}
            onClose={() => setIsSettingsOpen(false)}
            onOpenSelectBackground={() => {
              setIsSettingsOpen(false);
              setIsSelectBgOpen(true);
            }}
            onSelectMusicFolder={handleSelectFolder}
            onExportData={handleExportData}
            onImportData={handleImportJsonFile}
            onToggleOffline={() => {
              const next = !settings.offlineMode;
              const updated = { ...settings, offlineMode: next };
              setSettings(updated);
              saveSettings(updated);
              showNotification(next ? 'Offline Mode enabled' : 'Offline Mode disabled');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSelectBgOpen && (
          <SelectBackgroundDrawer
            key="drawer-selectbg"
            settings={settings}
            ownedSongs={ownedSongs}
            isLandscape={isLandscapeSplit}
            onClose={() => setIsSelectBgOpen(false)}
            onUpdateBackground={(mode, val) => {
              let updated: AppSettings = { ...settings, backgroundMode: mode };
              if (mode === 'color' && val) updated.backgroundColor = val;
              if (mode === 'staticAlbum' && val) updated.staticAlbumArtworkUrl = val;
              setSettings(updated);
              saveSettings(updated);
              showNotification('Background updated');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activePlaylistDrawer && (
          <PlaylistDrawer
            key="drawer-playlist"
            title={activePlaylistDrawer.name}
            songs={ownedSongs.filter(s => activePlaylistDrawer.songIds.includes(s.id))}
            playlist={activePlaylistDrawer}
            isLandscape={isLandscapeSplit}
            onClose={() => setActivePlaylistDrawer(null)}
            onPlaySong={handlePlaySong}
            onPlayAll={() => {
              const first = ownedSongs.find(s => activePlaylistDrawer.songIds.includes(s.id));
              if (first) handlePlaySong(first);
            }}
            onAddToOtherPlaylist={(song) => setSelectPlaylistForSong(song)}
            onRenamePlaylist={(newName) => {
              const updated = playlists.map(p => p.id === activePlaylistDrawer.id ? { ...p, name: newName } : p);
              setPlaylists(updated);
              savePlaylists(updated);
              setActivePlaylistDrawer({ ...activePlaylistDrawer, name: newName });
              showNotification(`Renamed to "${newName}"`);
            }}
            onDeletePlaylist={() => {
              const filtered = playlists.filter(p => p.id !== activePlaylistDrawer.id);
              setPlaylists(filtered);
              savePlaylists(filtered);
              setActivePlaylistDrawer(null);
              showNotification(`Deleted playlist`);
            }}
            onSongClick={setSelectedSongDetail}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBookmarksDrawerOpen && (
          <PlaylistDrawer
            key="drawer-bookmarks"
            title="Bookmarked Songs"
            songs={bookmarks.map(b => b.song)}
            isBookmarks={true}
            isLandscape={isLandscapeSplit}
            onClose={() => setIsBookmarksDrawerOpen(false)}
            onPlaySong={handlePlaySong}
            onPlayAll={() => {
              if (bookmarks.length > 0) handlePlaySong(bookmarks[0].song);
            }}
            onAddToOtherPlaylist={(song) => setSelectPlaylistForSong(song)}
            onSongClick={setSelectedSongDetail}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
