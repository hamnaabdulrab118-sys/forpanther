export interface Letter {
  id: string;
  label: string;
  title: string;
  greeting: string;
  content: string;
  signOff: string;
  date: string;
  envelopeColor: 'gold' | 'rose' | 'sky' | 'sage' | 'lavender';
  hasPhoto: boolean;
  photoUrl: string;
  photoCaption: string;
  hasAudio: boolean;
  audioTitle: string;
  hasVideo: boolean;
  videoUrl: string;
  videoTitle: string;
  stickers: string[];
  isPublished: boolean;
  createdAt: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  date: string;
  location: string;
}

export interface SiteData {
  letters: Letter[];
  gallery: GalleryPhoto[];
  fromCity: string;
  toCity: string;
  distanceKm: number;
  distanceMiles: number;
  isPublished: boolean;
}

export type OwnerTab = 'home' | 'letters' | 'gallery' | 'moon' | 'settings';
