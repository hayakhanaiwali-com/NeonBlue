export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string; // e.g., "3:45"
  coverArt?: string; // URL or color
  bpm: number;
}

export interface RadioState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  history: Song[];
  queue: Song[];
}

export interface CountryNode {
  id: string;
  x: number;
  y: number;
  name: string;
  active: boolean;
}
