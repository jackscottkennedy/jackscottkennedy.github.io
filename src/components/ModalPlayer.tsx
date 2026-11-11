import React, { useState, useRef, useEffect } from 'react';
import { Song, ModalPlayerViewMode } from '../types';
import { 
  ChevronDownIcon, 
  BackwardIcon, 
  ForwardIcon, 
  ArrowsRightLeftIcon, 
  ArrowPathIcon, 
  SpeakerWaveIcon, 
  AdjustmentsHorizontalIcon, 
  PlusIcon, 
  BookmarkIcon as BookmarkOutlineIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';

interface ModalPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  artViewMode: 1 | 2; // Mode 1 = less dimmed background, Mode 2 = shows disc/album/video carousel
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleArtView: () => void;
  onClose: () => void;
  onOpenRemix: (song: Song) => void;
  onOpenAddToPlaylist: (song: Song) => void;
  onToggleBookmark: (song: Song) => void;
  isBookmarked: boolean;
  onSongClick: (song: Song) => void;
  onArtistClick: (artist: string) => void;
  onAlbumClick: (album: string, artist: string) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const ModalPlayer: React.FC<ModalPlayerProps> = ({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  isShuffle,
  isRepeat,
  artViewMode,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onToggleArtView,
  onClose,
  onOpenRemix,
  onOpenAddToPlaylist,
  onToggleBookmark,
  isBookmarked,
  onSongClick,
  onArtistClick,
  onAlbumClick,
  volume,
  onVolumeChange,
}) => {
  const [viewIndex, setViewIndex] = useState<ModalPlayerViewMode>('disc');
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);

  // Video element sync
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  if (!currentSong) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const displayCurrentTime = isScrubbing ? scrubTime : currentTime;
  const progressPercent = duration > 0 ? (displayCurrentTime / duration) * 100 : 0;

  const handleProgressBarInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = pos * duration;
    setScrubTime(targetTime);
    onSeek(targetTime);
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col justify-between overflow-hidden text-white select-none transition-all duration-300"
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important"
      }}
    >
      {/* Background with blur and dimming */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={currentSong.artworkUrl}
          alt=""
          className={`w-full h-full object-cover transition-all duration-700 ${
            artViewMode === 1 ? 'blur-md scale-105 opacity-80' : 'blur-xl scale-110 opacity-40'
          }`}
        />
        {/* Darkening gradient from Figma tokens */}
        <div 
          className={`absolute inset-0 transition-opacity duration-500 ${
            artViewMode === 1 
              ? 'bg-linear-to-b from-black/20 via-black/40 to-black/80' 
              : 'bg-black/60 bg-linear-to-b from-black/40 via-black/60 to-black/90'
          }`} 
        />
      </div>

      {/* Top Drag / Close Bar */}
      <div className="relative z-10 w-full pt-4 pb-2 px-6 flex justify-between items-center">
        <button
          onClick={onClose}
          aria-label="Close modal player"
          className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition"
        >
          <ChevronDownIcon className="w-6 h-6 text-white/80" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Now Playing</span>
          <button 
            onClick={() => onAlbumClick(currentSong.album, currentSong.artist)}
            className="text-xs text-white/70 hover:underline max-w-[200px] truncate"
          >
            {currentSong.album}
          </button>
        </div>

        {/* View toggle if in Mode 2 */}
        {artViewMode === 2 ? (
          <div className="flex items-center gap-1.5 p-1 bg-DarkGlass backdrop-blur-xl rounded-full">
            <button
              onClick={() => setViewIndex('disc')}
              aria-label="Disc view"
              className={`p-1.5 rounded-full transition ${viewIndex === 'disc' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <MusicalNoteIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewIndex('album')}
              aria-label="Album art view"
              className={`p-1.5 rounded-full transition ${viewIndex === 'album' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <PhotoIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewIndex('video')}
              aria-label="Video view"
              className={`p-1.5 rounded-full transition ${viewIndex === 'video' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <VideoCameraIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Media Center Stage */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center overflow-hidden px-4">
        {artViewMode === 1 ? (
          // Mode 1: Dimmed less background, clean focus on music
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative group">
              <div 
                className="w-48 h-48 sm:w-64 sm:h-64 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 transition-transform duration-500 hover:scale-105 cursor-pointer"
                onClick={onToggleArtView}
              >
                <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover" />
              </div>
            </div>
            <p className="text-xs text-white/40 tracking-wider"></p>
          </div>
        ) : (
          // Mode 2: Disc / Album / Video Swipable Carousel
          <div className="w-full flex flex-col items-center justify-center">
            {viewIndex === 'disc' && (
              // Mode 2 Disc View: 60% of bottom half spins smoothly
              <div className="relative flex flex-col items-center justify-center overflow-hidden w-full h-[360px] sm:h-[420px]">
                <div 
                  className={`size-[480px] sm:size-[560px] absolute -top-[160px] sm:-top-[190px] rounded-full border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-center animate-spin-disc ${
                    isPlaying ? 'spin-running' : 'spin-paused'
                  }`}
                  style={{
                    background: 'radial-gradient(circle, #222 0%, #111 60%, #050505 100%)',
                    boxShadow: '0 0 60px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,255,255,0.1)'
                  }}
                >
                  {/* Vinyl Grooves */}
                  <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-16 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-24 rounded-full border border-white/5 pointer-events-none" />
                  <div className="absolute inset-32 rounded-full border border-white/5 pointer-events-none" />
                  
                  {/* Center Album Art Label */}
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-2 border-white/20 relative shadow-inner">
                    <img src={currentSong.artworkUrl} alt="" className="w-full h-full object-cover" />
                    {/* Center spindle hole */}
                    <div className="absolute inset-0 m-auto size-10 rounded-full bg-black border-2 border-white/20 shadow-inner flex items-center justify-center">
                      <div className="size-3 rounded-full bg-neutral-900 border border-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewIndex === 'album' && (
              // Mode 2 Album Art View
              <div className="flex flex-col items-center justify-center py-4">
                <div className="size-64 sm:size-80 rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl relative">
                  <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {viewIndex === 'video' && (
              // Mode 2 Video View
              <div className="flex flex-col items-center justify-center py-4 w-full max-w-sm">
                <div className="w-full aspect-video rounded-2xl overflow-hidden outline outline-1 outline-white/20 shadow-2xl bg-black relative flex items-center justify-center">
                  {currentSong.videoUrl ? (
                    <video
                      ref={videoRef}
                      src={currentSong.videoUrl}
                      className="w-full h-full object-cover"
                      playsInline
                      loop
                      muted
                      autoPlay={isPlaying}
                    />
                  ) : (
                    // Animated waveform visualizer for songs without mp4
                    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <div className="flex items-center gap-1.5 h-16">
                        {[40, 70, 95, 60, 85, 30, 90, 50, 75, 45, 65, 80].map((h, i) => (
                          <div
                            key={i}
                            className={`w-1.5 rounded-full bg-linear-to-t from-indigo-500 to-white transition-all duration-300 ${
                              isPlaying ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{
                              height: isPlaying ? `${Math.max(15, (h * (Math.sin(currentTime * 5 + i) + 1.2)) / 2)}%` : `${h * 0.3}%`,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-white/60"></span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ellipses indicators */}
            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={() => setViewIndex('disc')} 
                className={`size-2 rounded-full transition-all ${viewIndex === 'disc' ? 'bg-white w-4' : 'bg-white/40'}`} 
              />
              <button 
                onClick={() => setViewIndex('album')} 
                className={`size-2 rounded-full transition-all ${viewIndex === 'album' ? 'bg-white w-4' : 'bg-white/40'}`} 
              />
              <button 
                onClick={() => setViewIndex('video')} 
                className={`size-2 rounded-full transition-all ${viewIndex === 'video' ? 'bg-white w-4' : 'bg-white/40'}`} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Player Controls & Info Section */}
      <div className="relative z-10 w-full px-8 pb-6 flex flex-col gap-6">
        {/* Song Info (Clickable song title, artist, remix tags, price) */}
        <div className="flex justify-between items-end">
          <div className="flex flex-col items-start gap-1 max-w-[80%]">
            <button
              onClick={() => onSongClick(currentSong)}
              className="text-left font-semibold text-2xl sm:text-3xl text-white hover:underline truncate w-full"
            >
              {currentSong.title}
            </button>
            <button
              onClick={() => onArtistClick(currentSong.artist)}
              className="text-left text-base sm:text-lg text-white/60 hover:text-white hover:underline truncate w-full"
            >
              {currentSong.artist}
            </button>
            {currentSong.isRemix && (
              <span className="mt-1 px-2 py-0.5 text-[10px] font-semibold bg-black/40 border border-white/20 rounded text-white/90">
                Remix
              </span>
            )}
          </div>

          {/* Unowned Price Badge */}
          {!currentSong.isOwned && (
            <div className="px-3 py-1 bg-white text-black rounded-full font-bold text-xs shadow-lg">
              {currentSong.price || '$1.29'}
            </div>
          )}
        </div>

        {/* Progress Bar (Scrubbable) */}
        <div className="flex flex-col gap-1.5">
          <div
            ref={progressBarRef}
            onClick={handleProgressBarInteraction}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchStart={() => setIsScrubbing(true)}
            onTouchEnd={() => setIsScrubbing(false)}
            onTouchMove={handleProgressBarInteraction}
            className="w-full h-2 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer relative overflow-hidden transition"
          >
            <div
              className="h-full bg-white rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-white/50 font-semibold px-0.5">
            <span>{formatTime(displayCurrentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Media Controls: Shuffle, Prev, Play/Pause, Next, Repeat */}
        {/* Buttons in modalplayer do not have backgrounds as specified */}
        <div className="flex justify-between items-center px-4">
          <button
            onClick={onToggleShuffle}
            aria-label="Toggle shuffle"
            className={`p-2 transition active:scale-95 ${isShuffle ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
          >
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={onPrev}
            aria-label="Previous track"
            className="p-2 text-white/80 hover:text-white transition active:scale-95"
          >
            <BackwardIcon className="w-8 h-8" />
          </button>

          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="p-3 text-white transition transform active:scale-90 hover:scale-105"
          >
            {isPlaying ? (
              <PauseIcon className="w-12 h-12 fill-white" />
            ) : (
              <PlayIcon className="w-12 h-12 fill-white" />
            )}
          </button>

          <button
            onClick={onNext}
            aria-label="Next track"
            className="p-2 text-white/80 hover:text-white transition active:scale-95"
          >
            <ForwardIcon className="w-8 h-8" />
          </button>

          <button
            onClick={onToggleRepeat}
            aria-label="Toggle repeat"
            className={`p-2 transition active:scale-95 ${isRepeat ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
          >
            <ArrowPathIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Volume popover slider */}
        {showVolumeSlider && (
          <div className="p-3 bg-DarkGlass backdrop-blur-xl rounded-2xl flex items-center gap-3 border border-white/10 animate-fadeIn">
            <SpeakerWaveIcon className="w-5 h-5 text-white/70" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-white/60 w-8 text-right">{Math.round(volume * 100)}%</span>
          </div>
        )}

        {/* Bottom 5 Buttons */}
        {/* 1. Adjust volume, 2. Create remix, 3. Close modal player, 4. Add to playlist/Bookmark, 5. ArtView toggle */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10 text-white/70">
          {/* 1. Volume */}
          <button
            onClick={() => setShowVolumeSlider(!showVolumeSlider)}
            aria-label="Adjust volume"
            className="p-2 hover:text-white transition active:scale-95"
          >
            <SpeakerWaveIcon className="w-5 h-5" />
          </button>

          {/* 2. Create Remix */}
          <button
            onClick={() => onOpenRemix(currentSong)}
            aria-label="Create remix"
            className="p-2 hover:text-white transition active:scale-95"
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>

          {/* 3. Close Modal */}
          <button
            onClick={onClose}
            aria-label="Close player"
            className="p-2 hover:text-white transition active:scale-95"
          >
            <ChevronDownIcon className="w-5 h-5" />
          </button>

          {/* 4. Add to playlist / Bookmark button depending on owned status */}
          {currentSong.isOwned ? (
            <button
              onClick={() => onOpenAddToPlaylist(currentSong)}
              aria-label="Add to playlist"
              className="p-2 hover:text-white transition active:scale-95"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => onToggleBookmark(currentSong)}
              aria-label={isBookmarked ? 'Bookmarked' : 'Bookmark to buy'}
              className={`p-2 transition active:scale-95 ${isBookmarked ? 'text-white' : 'hover:text-white'}`}
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5 fill-white" />
              ) : (
                <BookmarkOutlineIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* 5. ArtView toggle (Mode 1 / Mode 2) */}
          <button
            onClick={onToggleArtView}
            aria-label="Toggle album art mode"
            className={`p-2 transition active:scale-95 ${artViewMode === 2 ? 'text-white' : 'text-white/60 hover:text-white'}`}
          >
            <MusicalNoteIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
