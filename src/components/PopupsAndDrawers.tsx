import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Song, 
  Playlist, 
  RemixSettings, 
  AppSettings 
} from '../types';
import { audioEngine } from '../utils/audioEngine';
import { 
  ChevronDownIcon, 
  ChevronLeftIcon, 
  PlusIcon, 
  BookmarkIcon as BookmarkOutlineIcon, 
  ArrowTopRightOnSquareIcon, 
  ArrowPathIcon, 
  CheckIcon, 
  EllipsisVerticalIcon, 
  MagnifyingGlassIcon, 
  Square3Stack3DIcon, 
  Bars3Icon, 
  FolderIcon, 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  SignalSlashIcon, 
  MusicalNoteIcon, 
  PaintBrushIcon,
  TrashIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';

// ==========================================
// 1. SONG POPUP (from SongPopUp_28eb06aa.jsx)
// ==========================================
interface SongPopUpProps {
  song: Song;
  isPlaying: boolean;
  isBookmarked: boolean;
  isLandscape?: boolean;
  onClose: () => void;
  onPlay: (song: Song) => void;
  onToggleBookmark: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onArtistClick: (artist: string) => void;
  onAlbumClick: (album: string, artist: string) => void;
  onOpenRemix: (song: Song) => void;
}

export const SongPopUp: React.FC<SongPopUpProps> = ({
  song,
  isPlaying,
  isBookmarked,
  isLandscape = false,
  onClose,
  onPlay,
  onToggleBookmark,
  onAddToPlaylist,
  onArtistClick,
  onAlbumClick,
  onOpenRemix,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) onClose();
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px] border-l' : 'max-w-lg mx-auto'
        } bg-[#18181b]/85 border-t border-white/15 rounded-t-[36px] px-8 pt-3 pb-8 flex flex-col items-center gap-5 shadow-2xl backdrop-blur-2xl overflow-y-auto max-h-[88vh] no-scrollbar relative`}
      >
        {/* Swipe down handle */}
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto cursor-grab active:cursor-grabbing mb-1" />

        {/* Drag handle / Close button */}
        <button 
          onClick={onClose} 
          aria-label="Close song details"
          className="p-1 rounded-full text-white/50 hover:text-white transition"
        >
          <ChevronDownIcon className="w-6 h-6" />
        </button>

        {/* Album Cover */}
        <div className="size-60 sm:size-64 rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl relative">
          <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" />
        </div>

        {/* Song Info */}
        <div className="flex flex-col items-center text-center gap-1">
          {song.isRemix && song.remixSettings && (
            <div className="flex flex-wrap justify-center gap-1 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/40 border border-white/20 rounded text-white">
                {song.remixSettings.speed}x Speed
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/40 border border-white/20 rounded text-white">
                {song.remixSettings.lowPassFilter < 20000 ? `${(song.remixSettings.lowPassFilter/1000).toFixed(1)}kHz LP` : 'No LP'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/40 border border-white/20 rounded text-white">
                {song.remixSettings.pitchShift > 0 ? `+${song.remixSettings.pitchShift}` : song.remixSettings.pitchShift}st Pitch
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-black/40 border border-white/20 rounded text-white">
                {song.remixSettings.reverb}% Reverb
              </span>
            </div>
          )}

          <h2 className="text-2xl font-semibold text-white">{song.title}</h2>
          <button 
            onClick={() => { onClose(); onArtistClick(song.artist); }} 
            className="text-sm text-white/60 hover:text-white hover:underline transition"
          >
            {song.artist}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => onPlay(song)}
            className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition shadow-lg"
          >
            {isPlaying ? <PauseIcon className="w-6 h-6 fill-black" /> : <PlayIcon className="w-6 h-6 fill-black ml-0.5" />}
          </button>

          {/* Buy or Price button if unowned */}
          {!song.isOwned && (
            <a
              href={song.buyUrl || 'https://music.apple.com'}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-bold text-sm rounded-full backdrop-blur-xl border border-white/10 flex items-center gap-2 active:scale-95 transition"
            >
              <span>{song.price || '$1.29'}</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}

          {/* Add to Playlist (if owned) OR Bookmark (if unowned) */}
          {song.isOwned ? (
            <button
              onClick={() => onAddToPlaylist(song)}
              className="p-3 bg-DarkGlass hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10 active:scale-95 transition"
              title="Add to playlist"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => onToggleBookmark(song)}
              className={`p-3 bg-DarkGlass hover:bg-white/20 rounded-full backdrop-blur-xl border border-white/10 active:scale-95 transition ${
                isBookmarked ? 'text-white' : 'text-white/60'
              }`}
              title="Bookmark song"
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5 fill-white" />
              ) : (
                <BookmarkOutlineIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Remix button */}
          <button
            onClick={() => { onClose(); onOpenRemix(song); }}
            className="p-3 bg-DarkGlass hover:bg-white/20 text-white rounded-full backdrop-blur-xl border border-white/10 active:scale-95 transition"
            title="Open in remix studio"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata dots footer */}
        <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-white/50 pt-2 border-t border-white/10 w-full">
          <span>{song.isOwned ? 'Owned Song' : 'Store Song'}</span>
          <span>•</span>
          <button 
            onClick={() => { onClose(); onAlbumClick(song.album, song.artist); }}
            className="hover:text-white underline truncate max-w-[130px]"
          >
            {song.album}
          </button>
          <span>•</span>
          <span>{song.genre}</span>
          <span>•</span>
          <span>{formatTime(song.duration)}</span>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 2. ARTIST POPUP (from ArtistPopUp_94ac3008.jsx)
// ==========================================
interface ArtistPopUpProps {
  artistName: string;
  ownedSongs: Song[];
  allSongs: Song[];
  isLandscape?: boolean;
  onClose: () => void;
  onPlaySong: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onPinTopic: (topic: string) => void;
  onSongClick: (song: Song) => void;
}

export const ArtistPopUp: React.FC<ArtistPopUpProps> = ({
  artistName,
  ownedSongs,
  allSongs,
  isLandscape = false,
  onClose,
  onPlaySong,
  onAddToPlaylist,
  onPinTopic,
  onSongClick,
}) => {
  const [tab, setTab] = useState<'collection' | 'store'>('collection');
  const artistOwned = ownedSongs.filter(s => s.artist.toLowerCase() === artistName.toLowerCase());
  const artistStore = allSongs.filter(s => s.artist.toLowerCase() === artistName.toLowerCase() && !s.isOwned);

  const displaySongs = tab === 'collection' ? artistOwned : artistStore;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) onClose();
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px] border-l' : 'max-w-lg mx-auto'
        } bg-[#18181b]/85 border-t border-white/15 rounded-t-[36px] px-6 pt-3 pb-8 flex flex-col items-center gap-4 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto no-scrollbar relative`}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto cursor-grab active:cursor-grabbing mb-1" />

        <button onClick={onClose} aria-label="Close artist" className="p-1 rounded-full text-white/50 hover:text-white transition">
          <ChevronDownIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold text-white">{artistName}</h2>
          <p className="text-xs text-white/50 mt-1">{artistOwned.length} songs in collection</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {artistOwned.length > 0 && (
            <button
              onClick={() => onPlaySong(artistOwned[0])}
              className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition"
            >
              <PlayIcon className="w-5 h-5 fill-black ml-0.5" />
            </button>
          )}
          <button
            onClick={() => onPinTopic(artistName)}
            className="px-4 py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-semibold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95"
          >
            Pin to Discover Page
          </button>
        </div>

        {/* Toggle Segmented Control: Your Collection vs Store */}
        <div className="w-full p-1 bg-DarkGlass rounded-full flex items-center border border-white/10">
          <button
            onClick={() => setTab('collection')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition ${
              tab === 'collection' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Your Collection ({artistOwned.length})
          </button>
          <button
            onClick={() => setTab('store')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition ${
              tab === 'store' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Store ({artistStore.length})
          </button>
        </div>

        {/* Songs List */}
        <div className="w-full flex flex-col gap-2 mt-2">
          {displaySongs.length === 0 ? (
            <p className="text-center text-xs text-white/40 py-6">
              {tab === 'collection' ? 'No songs owned by this artist yet.' : 'No other store tracks found.'}
            </p>
          ) : (
            displaySongs.map(song => (
              <div
                key={song.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSongClick(song)}>
                  <img src={song.artworkUrl} alt="" className="size-10 rounded object-cover cursor-pointer" />
                  <div className="flex flex-col min-w-0 cursor-pointer">
                    <span className="text-sm font-semibold text-white truncate hover:underline">{song.title}</span>
                    <span className="text-xs text-white/60 truncate">{song.album}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{formatTime(song.duration)}</span>
                  {song.isOwned && (
                    <button
                      onClick={() => onAddToPlaylist(song)}
                      className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                      title="Add to playlist"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onPlaySong(song)}
                    className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                  >
                    <PlayIcon className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 3. ALBUM POPUP (from AlbumPopUp_817c7f76.jsx)
// ==========================================
interface AlbumPopUpProps {
  albumName: string;
  artistName: string;
  allSongs: Song[];
  isLandscape?: boolean;
  onClose: () => void;
  onPlaySong: (song: Song) => void;
  onAddToPlaylist: (song: Song) => void;
  onSongClick: (song: Song) => void;
}

export const AlbumPopUp: React.FC<AlbumPopUpProps> = ({
  albumName,
  artistName,
  allSongs,
  isLandscape = false,
  onClose,
  onPlaySong,
  onAddToPlaylist,
  onSongClick,
}) => {
  const [tab, setTab] = useState<'collection' | 'store'>('collection');
  const albumSongs = allSongs.filter(s => s.album.toLowerCase() === albumName.toLowerCase());
  const ownedTracks = albumSongs.filter(s => s.isOwned);
  const storeTracks = albumSongs.filter(s => !s.isOwned);

  const displayTracks = tab === 'collection' ? ownedTracks : storeTracks;
  const coverArt = albumSongs[0]?.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) onClose();
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px] border-l' : 'max-w-lg mx-auto'
        } bg-[#18181b]/85 border-t border-white/15 rounded-t-[36px] px-6 pt-3 pb-8 flex flex-col items-center gap-4 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto no-scrollbar relative`}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto cursor-grab active:cursor-grabbing mb-1" />

        <button onClick={onClose} aria-label="Close album" className="p-1 rounded-full text-white/50 hover:text-white transition">
          <ChevronDownIcon className="w-6 h-6" />
        </button>

        <div className="size-44 sm:size-52 rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl">
          <img src={coverArt} alt={albumName} className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col items-center text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">{albumName}</h2>
          <p className="text-xs text-white/60">{artistName}</p>
        </div>

        {/* Toggle */}
        <div className="w-full p-1 bg-DarkGlass rounded-full flex items-center border border-white/10">
          <button
            onClick={() => setTab('collection')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition ${
              tab === 'collection' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Your Collection ({ownedTracks.length})
          </button>
          <button
            onClick={() => setTab('store')}
            className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-full transition ${
              tab === 'store' ? 'bg-LightGlass text-white shadow' : 'text-white/50 hover:text-white'
            }`}
          >
            Store ({storeTracks.length})
          </button>
        </div>

        {/* Tracklist */}
        <div className="w-full flex flex-col gap-2">
          {displayTracks.length === 0 ? (
            <p className="text-center text-xs text-white/40 py-6">No tracks in this view.</p>
          ) : (
            displayTracks.map((song, i) => (
              <div key={song.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition">
                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSongClick(song)}>
                  <span className="text-xs text-white/40 w-4 text-center">{i + 1}</span>
                  <div className="flex flex-col min-w-0 cursor-pointer">
                    <span className="text-sm font-semibold text-white truncate hover:underline">{song.title}</span>
                    <span className="text-xs text-white/50 truncate">{song.artist}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{formatTime(song.duration)}</span>
                  {song.isOwned && (
                    <button
                      onClick={() => onAddToPlaylist(song)}
                      className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onPlaySong(song)}
                    className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                  >
                    <PlayIcon className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 4. PIN TOPIC POPUP (from PinPopUp_a18ac436.jsx)
// ==========================================
interface PinPopUpProps {
  isLandscape?: boolean;
  onClose: () => void;
  onPin: (topic: string) => void;
}

export const PinPopUp: React.FC<PinPopUpProps> = ({ isLandscape = false, onClose, onPin }) => {
  const [topic, setTopic] = useState('');

  const handlePin = () => {
    if (topic.trim()) {
      onPin(topic.trim());
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) onClose();
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px] border-l' : 'max-w-lg mx-auto'
        } bg-[#18181b]/85 border-t border-white/15 rounded-t-[36px] px-8 pt-3 pb-8 flex flex-col items-center gap-4 shadow-2xl backdrop-blur-2xl`}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto cursor-grab active:cursor-grabbing mb-1" />

        <button onClick={onClose} aria-label="Close pin topic" className="p-1 rounded-full text-white/50 hover:text-white transition">
          <ChevronDownIcon className="w-6 h-6" />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white">Pin Topic</h2>
          <p className="text-xs text-white/50 mt-1">Keep up to date on an artist, genre, or vibe.</p>
        </div>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePin()}
          placeholder="e.g., Lo-Fi Beats, Synthwave, Daft Punk"
          className="w-full p-3.5 bg-DarkGlass rounded-2xl text-white placeholder-white/40 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/50 text-sm"
          autoFocus
        />

        <button
          onClick={handlePin}
          disabled={!topic.trim()}
          className="w-full py-3 bg-white disabled:opacity-40 text-black font-bold text-xs rounded-full transition active:scale-95 shadow-lg"
        >
          Pin to Discover Page
        </button>
      </motion.div>
    </div>
  );
};

// ==========================================
// 5. REMIX CREATOR DRAWER (from RemixCreatorDrawer_aae4b551.jsx)
// ==========================================
interface RemixCreatorDrawerProps {
  song: Song;
  isPlaying: boolean;
  isLandscape?: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onSaveRemix: (originalSong: Song, settings: RemixSettings) => void;
  onLiveSettingsChange: (settings: RemixSettings) => void;
}

export const RemixCreatorDrawer: React.FC<RemixCreatorDrawerProps> = ({
  song,
  isPlaying,
  isLandscape = false,
  onClose,
  onTogglePlay,
  onSaveRemix,
  onLiveSettingsChange,
}) => {
  const [speed, setSpeed] = useState(song.remixSettings?.speed || 1.0);
  const [pitchShift, setPitchShift] = useState(song.remixSettings?.pitchShift || 0);
  const [reverb, setReverb] = useState(song.remixSettings?.reverb || 0);
  const [lowPassFilter, setLowPassFilter] = useState(song.remixSettings?.lowPassFilter || 20000);
  const [restartOnEdit, setRestartOnEdit] = useState(false);

  // Enforce looping while inside the remix editor as requested
  useEffect(() => {
    audioEngine.setLoop(true);
    return () => {
      audioEngine.setLoop(false);
    };
  }, []);

  const updateSetting = (newSettings: Partial<RemixSettings>) => {
    const updated: RemixSettings = {
      speed: newSettings.speed ?? speed,
      pitchShift: newSettings.pitchShift ?? pitchShift,
      reverb: newSettings.reverb ?? reverb,
      lowPassFilter: newSettings.lowPassFilter ?? lowPassFilter,
      restartOnEdit,
    };
    onLiveSettingsChange(updated);
  };

  const handleSave = () => {
    audioEngine.setLoop(false);
    onSaveRemix(song, { speed, pitchShift, reverb, lowPassFilter, restartOnEdit });
    onClose();
  };

  const handleClose = () => {
    audioEngine.setLoop(false);
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : ''
      }`}
      onClick={handleClose}
    >
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px]' : 'sm:max-w-md'
        } bg-[#18181b]/90 border-l border-white/15 h-full flex flex-col justify-between p-6 overflow-y-auto no-scrollbar shadow-2xl backdrop-blur-2xl`}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <button onClick={handleClose} aria-label="Back" className="p-2 rounded-full hover:bg-white/10 transition">
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-bold text-base text-white">Remix Creator</span>
            <span className="text-[10px] text-amber-300 font-medium"></span>
          </div>
          <button
            onClick={handleSave}
            title={song.isOwned ? "Save Remix" : "Can only save remixes for owned songs"}
            className="p-2 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition shadow"
          >
            <CheckIcon className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Center Artwork & Song info */}
        <div className="flex flex-col items-center gap-3 py-3">
          <div className="size-40 sm:size-48 rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl">
            <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-white">{song.title}</h3>
            <p className="text-xs text-white/50">{song.artist}</p>
          </div>

          {/* Action buttons: Play/Pause, Restart toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition shadow-lg"
            >
              {isPlaying ? <PauseIcon className="w-5 h-5 fill-black" /> : <PlayIcon className="w-5 h-5 fill-black ml-0.5" />}
            </button>
            <button
              onClick={() => setRestartOnEdit(!restartOnEdit)}
              className={`p-3 rounded-full border transition backdrop-blur-xl ${
                restartOnEdit ? 'bg-white text-black border-white' : 'bg-DarkGlass text-white border-white/10'
              }`}
              title="Restart song when slider moves"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time FX Sliders */}
        <div className="flex flex-col gap-3 py-1">
          {/* Speed */}
          <div className="flex flex-col gap-1 p-2.5 bg-DarkGlass rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-white/80">Speed</span>
              <span className="px-2 py-0.5 bg-black/40 rounded text-[11px] font-bold text-white">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSpeed(val);
                updateSetting({ speed: val });
              }}
              className="w-full"
            />
          </div>

          {/* Pitch Shift */}
          <div className="flex flex-col gap-1 p-2.5 bg-DarkGlass rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-white/80">Pitch Shift (Semitones)</span>
              <span className="px-2 py-0.5 bg-black/40 rounded text-[11px] font-bold text-white">
                {pitchShift > 0 ? `+${pitchShift}` : pitchShift}st
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchShift}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setPitchShift(val);
                updateSetting({ pitchShift: val });
              }}
              className="w-full"
            />
          </div>

          {/* Reverb */}
          <div className="flex flex-col gap-1 p-2.5 bg-DarkGlass rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-white/80">Reverb Wet/Dry</span>
              <span className="px-2 py-0.5 bg-black/40 rounded text-[11px] font-bold text-white">{reverb}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={reverb}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setReverb(val);
                updateSetting({ reverb: val });
              }}
              className="w-full"
            />
          </div>

          {/* Low Pass Filter */}
          <div className="flex flex-col gap-1 p-2.5 bg-DarkGlass rounded-2xl border border-white/5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-white/80">Low Pass Filter</span>
              <span className="px-2 py-0.5 bg-black/40 rounded text-[11px] font-bold text-white">
                {lowPassFilter >= 20000 ? 'Off (20kHz)' : `${(lowPassFilter / 1000).toFixed(1)}kHz`}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="20000"
              step="250"
              value={lowPassFilter}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setLowPassFilter(val);
                updateSetting({ lowPassFilter: val });
              }}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer save prompt */}
        <div className="pt-2 text-center text-xs text-white/40">
          {song.isOwned ? ' ' : ' '}
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 6. SETTINGS POPUP (from SettingsPopUp_1d725b74.jsx)
// ==========================================
interface SettingsPopUpProps {
  settings: AppSettings;
  playlistsCount: number;
  bookmarksCount: number;
  remixesCount: number;
  isLandscape?: boolean;
  onClose: () => void;
  onOpenSelectBackground: () => void;
  onSelectMusicFolder: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleOffline: () => void;
}

export const SettingsPopUp: React.FC<SettingsPopUpProps> = ({
  settings,
  playlistsCount,
  bookmarksCount,
  remixesCount,
  isLandscape = false,
  onClose,
  onOpenSelectBackground,
  onSelectMusicFolder,
  onExportData,
  onImportData,
  onToggleOffline,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : 'items-center'
      }`}
      onClick={onClose}
    >
      <motion.div 
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) onClose();
        }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px] border-l' : 'max-w-lg mx-auto'
        } bg-[#18181b]/85 border-t border-white/15 rounded-t-[36px] px-8 pt-3 pb-8 flex flex-col gap-5 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto no-scrollbar relative`}
      >
        <div className="w-10 h-1.5 rounded-full bg-white/30 mx-auto cursor-grab active:cursor-grabbing mb-1" />

        <button onClick={onClose} aria-label="Close settings" className="self-center p-1 rounded-full text-white/50 hover:text-white transition">
          <ChevronDownIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-semibold text-white text-center">Settings</h2>

        {/* Hidden File Input for JSON import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportData}
          accept=".json"
          className="hidden"
        />

        {/* Section 1: App Background */}
        <div className="flex flex-col gap-1.5">
          <div>
            <h3 className="text-base font-semibold text-white">App Background</h3>
            <p className="text-xs text-white/50">
              {settings.backgroundMode === 'nowPlaying'
                ? "'Always Use Now Playing Art' currently selected."
                : settings.backgroundMode === 'color'
                ? `Color mode (${settings.backgroundColor}) selected.`
                : 'Static album artwork selected.'}
            </p>
          </div>
          <button
            onClick={onOpenSelectBackground}
            className="w-full py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95"
          >
            Change Background
          </button>
        </div>

        {/* Section 2: Music Source */}
        <div className="flex flex-col gap-1.5">
          <div>
            <h3 className="text-base font-semibold text-white">Music Source</h3>
            <p className="text-xs text-white/50">
              {settings.musicSourceFolderName ? `Folder: ${settings.musicSourceFolderName}` : 'Built-in Music Folder.'}
            </p>
          </div>
          <button
            onClick={onSelectMusicFolder}
            className="w-full py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95 flex items-center justify-center gap-2"
          >
            <FolderIcon className="w-4 h-4" />
            <span>Select Folder</span>
          </button>
        </div>

        {/* Section 3: App Data */}
        <div className="flex flex-col gap-1.5">
          <div>
            <h3 className="text-base font-semibold text-white">App Data</h3>
            <p className="text-xs text-white/50">
              {bookmarksCount} Bookmarks, {playlistsCount} Playlists, {remixesCount} Remixes.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              <span>Import</span>
            </button>
            <button
              onClick={onExportData}
              className="flex-1 py-2.5 bg-DarkGlass hover:bg-white/20 text-white font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Section 4: Offline Mode */}
        <div className="flex flex-col gap-1.5">
          <div>
            <h3 className="text-base font-semibold text-white">Offline Mode</h3>
            <p className="text-xs text-white/50">
              {settings.offlineMode ? 'Active: Disables all online features.' : 'Online features enabled.'}
            </p>
          </div>
          <button
            onClick={onToggleOffline}
            className={`w-full py-2.5 font-bold text-xs rounded-full backdrop-blur-xl border border-white/10 transition active:scale-95 flex items-center justify-center gap-2 ${
              settings.offlineMode ? 'bg-white text-black' : 'bg-DarkGlass hover:bg-white/20 text-white'
            }`}
          >
            <SignalSlashIcon className="w-4 h-4" />
            <span>{settings.offlineMode ? 'Disable Offline Mode' : 'Enable Offline Mode'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 7. SELECT BACKGROUND DRAWER (from SelectAppBackgroundDraw_7a6dfb00.jsx)
// ==========================================
interface SelectBackgroundDrawerProps {
  settings: AppSettings;
  ownedSongs: Song[];
  isLandscape?: boolean;
  onClose: () => void;
  onUpdateBackground: (mode: 'nowPlaying' | 'color' | 'staticAlbum', value?: string) => void;
}

export const SelectBackgroundDrawer: React.FC<SelectBackgroundDrawerProps> = ({
  settings,
  ownedSongs,
  isLandscape = false,
  onClose,
  onUpdateBackground,
}) => {
  const [colorHex, setColorHex] = useState(settings.backgroundColor || '#1e1b4b');
  const [searchFilter, setSearchFilter] = useState('');

  const colors = ['#171717', '#1e1b4b', '#064e3b', '#881337', '#7c2d12', '#312e81', '#1f2937'];

  const filteredArtworks = ownedSongs.filter(s => 
    s.title.toLowerCase().includes(searchFilter.toLowerCase()) || 
    s.album.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : ''
      }`}
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px]' : 'sm:max-w-md'
        } bg-[#18181b]/90 border-l border-white/15 h-full flex flex-col p-6 overflow-y-auto no-scrollbar shadow-2xl backdrop-blur-2xl gap-5`}
      >
        {/* Top Bar */}
        <div className="flex items-center gap-3 pb-2 border-b border-white/10">
          <button onClick={onClose} aria-label="Back" className="p-2 rounded-full hover:bg-white/10 transition">
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          <span className="font-bold text-base text-white">Select Background</span>
        </div>

        {/* Top selections: Now Playing vs Color */}
        <div className="flex gap-4">
          {/* Always Use Now Playing */}
          <div
            onClick={() => onUpdateBackground('nowPlaying')}
            className={`flex-1 p-3 rounded-2xl border cursor-pointer transition relative flex flex-col items-center text-center gap-2 ${
              settings.backgroundMode === 'nowPlaying' ? 'bg-white/20 border-white' : 'bg-DarkGlass border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="size-14 rounded-lg bg-linear-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <MusicalNoteIcon className="w-7 h-7 text-white/80" />
            </div>
            <span className="text-xs font-semibold text-white">Always Use Now Playing Art</span>
            {settings.backgroundMode === 'nowPlaying' && (
              <div className="absolute top-2 right-2 size-5 bg-white rounded-full flex items-center justify-center text-black">
                <CheckIcon className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>

          {/* Select Color */}
          <div
            onClick={() => onUpdateBackground('color', colorHex)}
            className={`flex-1 p-3 rounded-2xl border cursor-pointer transition relative flex flex-col items-center text-center gap-2 ${
              settings.backgroundMode === 'color' ? 'bg-white/20 border-white' : 'bg-DarkGlass border-white/10 hover:bg-white/10'
            }`}
          >
            <div 
              className="size-14 rounded-lg flex items-center justify-center border border-white/20"
              style={{ backgroundColor: colorHex }}
            >
              <PaintBrushIcon className="w-7 h-7 text-white/80" />
            </div>
            <span className="text-xs font-semibold text-white">Select Colour</span>
            {settings.backgroundMode === 'color' && (
              <div className="absolute top-2 right-2 size-5 bg-white rounded-full flex items-center justify-center text-black">
                <CheckIcon className="w-3 h-3 stroke-[3]" />
              </div>
            )}
          </div>
        </div>

        {/* Color Palette Swatches */}
        <div className="flex items-center justify-between p-3 bg-DarkGlass rounded-2xl border border-white/5">
          {colors.map(col => (
            <button
              key={col}
              onClick={() => {
                setColorHex(col);
                onUpdateBackground('color', col);
              }}
              style={{ backgroundColor: col }}
              className={`size-8 rounded-full border-2 transition transform hover:scale-110 ${
                colorHex === col && settings.backgroundMode === 'color' ? 'border-white scale-110 shadow-lg' : 'border-white/20'
              }`}
            />
          ))}
        </div>

        <div className="h-px bg-white/10" />

        {/* Static Album Art selection */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-white">Or Select Static Album Art</span>
          <div className="flex items-center gap-2 px-3 py-2 bg-DarkGlass rounded-xl border border-white/10">
            <MagnifyingGlassIcon className="w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search album art"
              className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {filteredArtworks.map(s => (
              <button
                key={s.id}
                onClick={() => onUpdateBackground('staticAlbum', s.artworkUrl)}
                className={`aspect-square rounded-xl overflow-hidden border-2 relative transition hover:scale-105 active:scale-95 ${
                  settings.backgroundMode === 'staticAlbum' && settings.staticAlbumArtworkUrl === s.artworkUrl
                    ? 'border-white shadow-xl'
                    : 'border-white/10'
                }`}
              >
                <img src={s.artworkUrl} alt={s.title} className="w-full h-full object-cover" />
                {settings.backgroundMode === 'staticAlbum' && settings.staticAlbumArtworkUrl === s.artworkUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <CheckIcon className="w-6 h-6 text-white stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 8. PLAYLIST & BOOKMARK DRAWER (from BookmarkPlaylistListView_072c4bd2.jsx & BookmarkandPlaylistStack_96e06bfc.jsx)
// ==========================================
interface PlaylistDrawerProps {
  title: string;
  songs: Song[];
  playlist?: Playlist;
  isBookmarks?: boolean;
  isLandscape?: boolean;
  onClose: () => void;
  onPlaySong: (song: Song) => void;
  onPlayAll: () => void;
  onAddToOtherPlaylist: (song: Song) => void;
  onRemoveBookmark?: (songId: string) => void;
  onRenamePlaylist?: (newName: string) => void;
  onDeletePlaylist?: () => void;
  onSongClick: (song: Song) => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  title,
  songs,
  playlist,
  isBookmarks = false,
  isLandscape = false,
  onClose,
  onPlaySong,
  onPlayAll,
  onAddToOtherPlaylist,
  onRenamePlaylist,
  onDeletePlaylist,
  onSongClick,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'stack'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const totalSeconds = songs.reduce((acc, s) => acc + s.duration, 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);
  const durationSummary = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  return (
    <div 
      className={`fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs ${
        isLandscape ? 'items-end' : ''
      }`}
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${
          isLandscape ? 'sm:w-[450px] lg:w-[480px]' : 'sm:max-w-lg'
        } bg-[#18181b]/90 border-l border-white/15 h-full flex flex-col p-6 overflow-y-auto no-scrollbar shadow-2xl backdrop-blur-2xl gap-5`}
      >
        {/* Top Bar */}
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <button onClick={onClose} aria-label="Back" className="p-2 rounded-full hover:bg-white/10 transition">
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </button>
          
          {isEditingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (onRenamePlaylist && editedTitle.trim()) onRenamePlaylist(editedTitle.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (onRenamePlaylist && editedTitle.trim()) onRenamePlaylist(editedTitle.trim());
                }
              }}
              className="bg-DarkGlass px-3 py-1 rounded text-center font-bold text-white focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="font-bold text-base text-white">{editedTitle}</span>
          )}

          {/* Ellipse Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Playlist options"
              className="p-2 rounded-full hover:bg-white/10 transition text-white"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-10 w-44 bg-neutral-800 rounded-xl border border-white/10 shadow-2xl py-1 z-20">
                {!isBookmarks && !playlist?.isSystem && (
                  <button
                    onClick={() => { setShowMenu(false); setIsEditingTitle(true); }}
                    className="w-full px-4 py-2 text-left text-xs text-white hover:bg-white/10 flex items-center gap-2"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                    <span>Rename Playlist</span>
                  </button>
                )}
                {!isBookmarks && !playlist?.isSystem && onDeletePlaylist && (
                  <button
                    onClick={() => { setShowMenu(false); onDeletePlaylist(); }}
                    className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-white/10 flex items-center gap-2"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Delete Playlist</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stack of covers header */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex justify-center items-center h-40 sm:h-48 w-full">
            {songs.slice(0, 5).map((s, idx) => {
              const rot = (idx - 2) * 5;
              const scale = 1 - Math.abs(idx - 2) * 0.08;
              const z = 10 - Math.abs(idx - 2);
              return (
                <div
                  key={s.id}
                  style={{
                    transform: `rotate(${rot}deg) scale(${scale})`,
                    zIndex: z,
                  }}
                  className="size-32 sm:size-40 rounded-xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl absolute transition-transform"
                >
                  <img src={s.artworkUrl} alt="" className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>

          {/* Details & Action Buttons */}
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <span className="text-xs text-white/50">{songs.length} songs • {durationSummary}</span>
              <div className="flex gap-1 mt-1">
                {(playlist?.tags || ['lofi', 'pop']).map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-DarkGlass rounded text-[10px] text-white/70">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onPlayAll}
                className="p-3 bg-white text-black rounded-full hover:scale-105 active:scale-95 transition shadow-lg"
                title="Play playlist"
              >
                <PlayIcon className="w-5 h-5 fill-black ml-0.5" />
              </button>
              {/* Switch View Mode: List vs Stack */}
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'stack' : 'list')}
                className="p-3 bg-DarkGlass hover:bg-white/20 rounded-full border border-white/10 text-white transition active:scale-95"
                title={`Switch to ${viewMode === 'list' ? 'Stack' : 'List'} View`}
              >
                {viewMode === 'list' ? <Square3Stack3DIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search inside playlist */}
        <div className="flex items-center gap-2 px-3 py-2 bg-DarkGlass rounded-2xl border border-white/10">
          <MagnifyingGlassIcon className="w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search playlist"
            className="bg-transparent text-sm text-white placeholder-white/40 focus:outline-none flex-1"
          />
        </div>

        {/* View Mode: Stack View vs List View */}
        {viewMode === 'stack' ? (
          // Stack View
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative size-60 sm:size-68 flex items-center justify-center">
              {filtered.slice(0, 3).map((song, i) => (
                <div
                  key={song.id}
                  style={{
                    transform: `translateY(${i * 12}px) scale(${1 - i * 0.08})`,
                    zIndex: 10 - i,
                  }}
                  className="size-56 sm:size-60 rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl absolute bg-neutral-800 transition-all cursor-pointer"
                  onClick={() => onSongClick(song)}
                >
                  <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white truncate">{song.title}</p>
                      <p className="text-xs text-white/60 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPlaySong(song); }}
                      className="p-2 bg-white text-black rounded-full"
                    >
                      <PlayIcon className="w-4 h-4 fill-black ml-0.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40 mt-4">Swipe or tap a song in stack</p>
          </div>
        ) : (
          // List View
          <div className="flex flex-col gap-2">
            {filtered.length === 0 ? (
              <p className="text-center text-xs text-white/40 py-8">No songs found in this playlist.</p>
            ) : (
              filtered.map(song => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onSongClick(song)}>
                    <img src={song.artworkUrl} alt="" className="size-11 rounded object-cover cursor-pointer" />
                    <div className="flex flex-col min-w-0 cursor-pointer">
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
                    {/* Add to another playlist button */}
                    <button
                      onClick={() => onAddToOtherPlaylist(song)}
                      className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                      title="Add to another playlist"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                    {/* Play button */}
                    <button
                      onClick={() => onPlaySong(song)}
                      className="p-1.5 bg-DarkGlass rounded-full hover:bg-white/20 text-white"
                      title="Play song"
                    >
                      <PlayIcon className="w-3.5 h-3.5 fill-white ml-0.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
