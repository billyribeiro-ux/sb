export interface HeroChapter {
  id: string;
  title: string;
  copy: string;
  start: number;
  image: string;
  srcset?: string;
  motion?: string;
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
    id: 'groove', title: 'Groove', start: .12,
    copy: 'Keep the pulse steady. Let the ride cymbal and snare shape how it feels.',
    image: '/videos/sergio-groove-insert-poster.webp',
    motion: '/videos/sergio-groove-insert.mp4',
    position: '50% 50%', tint: '#15100d',
  },
  {
    id: 'control', title: 'Control', start: .207,
    copy: 'Let the backbeat speak clearly. Keep the ghost notes soft enough that you feel them before you hear them.',
    image: 'home-stage.webp',
    srcset: '/images/home-stage-768.webp 768w, /images/home-stage.webp 1440w',
    position: '50% 31%', tint: '#222126',
  },
  {
    id: 'technique', title: 'Technique', start: .305,
    copy: 'A relaxed grip gives the stick room to rebound and leaves the hand ready for the next stroke.',
    image: 'recording.webp',
    srcset: '/images/recording-768.webp 768w, /images/recording-1280.webp 1280w, /images/recording.webp 2000w',
    position: '57% 48%', tint: '#20150d',
  },
  {
    id: 'flow', title: 'Flow', start: .407,
    copy: 'Move the phrase from snare to toms and keep its place in the bar.',
    image: '/videos/sergio-flow-insert-poster.webp',
    motion: '/videos/sergio-flow-insert.mp4',
    position: '50% 50%', tint: '#15100d',
  },
  {
    id: 'musicality', title: 'Musicality', start: .506,
    copy: 'Leave room for the bass, bring one accent forward, and let the cymbal ring.',
    image: 'records.webp',
    position: '50% 48%', tint: '#301b15',
  },
  {
    id: 'anticipation', title: 'Before the hit', start: .602,
    copy: 'The first stick accent opens the original studio performance.',
    image: notesFilm.poster,
    position: '50% 50%', tint: '#15100d',
  },
  {
    id: 'discovery', title: 'The quiet notes', start: .945,
    copy: 'Same tempo. Same backbeat. Hear what four quiet snare strokes change.',
    image: 'home-percussion-workshop.webp',
    srcset: '/images/home-percussion-workshop-768.webp 768w, /images/home-percussion-workshop.webp 2000w',
    position: '50% 50%', tint: '#241e19',
  },
];

export const performanceStart = .70;
