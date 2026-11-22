export interface HeroChapter {
  id: string;
  title: string;
  copy: string;
  start: number;
  image: string;
  srcset?: string;
  mobile?: string;
  position: string;
  tint: string;
}

export const notesFilm = {
  src: '/videos/sergio-notes-between.mp4?edit=front',
  src4k: '/videos/sergio-notes-between-4k.mp4?edit=front',
  poster: '/videos/sergio-notes-between-poster.webp?edit=front',
  label: 'Sergio Bellotti performing Happy People 7/4 in the studio',
};

export const heroChapters: HeroChapter[] = [
  {
    id: 'groove', title: 'Groove', start: .14,
    copy: 'Keep the pulse steady. Let the ride cymbal and snare shape how it feels.',
    image: 'performance.webp',
    srcset: '/images/performance-768.webp 768w, /images/performance-1280.webp 1280w, /images/performance.webp 2560w, /images/performance-3840.webp 3840w',
    mobile: '/images/hero-session-mobile-1920.webp',
    position: '50% 45%', tint: '#2d1612',
  },
  {
    id: 'control', title: 'Control', start: .25,
    copy: 'Let the backbeat speak clearly. Keep the ghost notes soft enough that you feel them before you hear them.',
    image: 'home-stage.webp',
    srcset: '/images/home-stage-768.webp 768w, /images/home-stage.webp 1440w',
    position: '50% 31%', tint: '#222126',
  },
  {
    id: 'technique', title: 'Technique', start: .36,
    copy: 'A relaxed grip gives the stick room to rebound and leaves the hand ready for the next stroke.',
    image: 'recording.webp',
    srcset: '/images/recording-768.webp 768w, /images/recording-1280.webp 1280w, /images/recording.webp 2000w',
    position: '57% 48%', tint: '#20150d',
  },
  {
    id: 'flow', title: 'Flow', start: .47,
    copy: 'Move the phrase from snare to toms and keep its place in the bar.',
    image: 'stage.webp',
    srcset: '/images/stage-768.webp 768w, /images/stage-1280.webp 1280w, /images/stage.webp 2400w',
    position: '58% 42%', tint: '#21172e',
  },
  {
    id: 'musicality', title: 'Musicality', start: .58,
    copy: 'Leave room for the bass, bring one accent forward, and let the cymbal ring.',
    image: 'records.webp',
    position: '50% 48%', tint: '#301b15',
  },
  {
    id: 'anticipation', title: 'Before the hit', start: .69,
    copy: 'The first stick accent opens the original studio performance.',
    image: notesFilm.poster,
    position: '50% 50%', tint: '#15100d',
  },
  {
    id: 'discovery', title: 'The quiet notes', start: .935,
    copy: 'Same tempo. Same backbeat. Hear what four quiet snare strokes change.',
    image: 'workshop.webp',
    srcset: '/images/workshop-768.webp 768w, /images/workshop-1280.webp 1280w, /images/workshop.webp 2000w',
    position: '50% 51%', tint: '#241e19',
  },
];

export const performanceStart = .80;
