import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  LEVEL_1_DEFAULT_SETTINGS, 
  resolveSettings, 
  STARTER_SONGS, 
  STARTER_PLAYLISTS 
} from './storageAndSettings';
import { AppSettings, RemixSettings } from '../types';

test('Level 1 default settings embedded in code are complete', () => {
  assert.equal(LEVEL_1_DEFAULT_SETTINGS.backgroundMode, 'nowPlaying');
  assert.equal(LEVEL_1_DEFAULT_SETTINGS.offlineMode, false);
  assert.equal(LEVEL_1_DEFAULT_SETTINGS.volume, 0.85);
});

test('Level 3 settings override Level 1 defaults correctly', () => {
  const level3Imported: Partial<AppSettings> = {
    backgroundMode: 'color',
    backgroundColor: '#3b82f6',
    offlineMode: true,
    volume: 0.5,
  };

  const resolved = resolveSettings(level3Imported);
  assert.equal(resolved.backgroundMode, 'color');
  assert.equal(resolved.backgroundColor, '#3b82f6');
  assert.equal(resolved.offlineMode, true);
  assert.equal(resolved.volume, 0.5);
  // Untouched fields should retain Level 1 defaults
  assert.equal(resolved.musicSourceFolderName, LEVEL_1_DEFAULT_SETTINGS.musicSourceFolderName);
});

test('Starter songs have required metadata and duration', () => {
  assert.ok(STARTER_SONGS.length >= 5, 'Must have at least 5 starter songs');
  STARTER_SONGS.forEach(song => {
    assert.ok(song.id, 'Song must have an ID');
    assert.ok(song.title, 'Song must have a title');
    assert.ok(song.artist, 'Song must have an artist');
    assert.ok(song.album, 'Song must have an album');
    assert.ok(song.duration > 0, 'Song must have a positive duration');
    assert.equal(song.isOwned, true, 'Starter songs must be owned');
  });

  // Verify .mp4 video song detection
  const videoSong = STARTER_SONGS.find(s => s.videoUrl);
  assert.ok(videoSong, 'Must have at least one song with videoUrl for .mp4 testing');
});

test('Starter playlists contain valid references', () => {
  assert.ok(STARTER_PLAYLISTS.length >= 3, 'Must have at least 3 initial playlists');
  const allSongIds = new Set(STARTER_SONGS.map(s => s.id));
  
  const allImportedPlaylist = STARTER_PLAYLISTS.find(p => p.id === 'sys-all-imported');
  assert.ok(allImportedPlaylist, 'Must have All Imported Songs playlist');
  assert.equal(allImportedPlaylist.isSystem, true);
});

test('Remix settings clamping and parameters validation', () => {
  const fx: RemixSettings = {
    speed: 1.5,
    pitchShift: -4,
    reverb: 80,
    lowPassFilter: 4500,
  };

  assert.ok(fx.speed >= 0.5 && fx.speed <= 2.0);
  assert.ok(fx.pitchShift >= -12 && fx.pitchShift <= 12);
  assert.ok(fx.reverb >= 0 && fx.reverb <= 100);
  assert.ok(fx.lowPassFilter >= 500 && fx.lowPassFilter <= 20000);
});
