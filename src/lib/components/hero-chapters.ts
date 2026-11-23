export interface HeroChapter {
  id: string;
  title: string;
  copy: string;
  start: number;
  framing?: { scale: number; xPercent: number };
}

export const notesFilm = {
  src: '/videos/sergio-notes-between.mp4?edit=front',
  src4k: '/videos/sergio-notes-between-4k.mp4?edit=front',
  poster: '/videos/sergio-notes-between-poster.webp?edit=front',
  label: 'Sergio Bellotti performing Happy People 7/4 in the studio',
};

export const heroSession = {
  picture: '/videos/sergio-hero-session.mp4',
  soundtrack: '/videos/sergio-hero-soundtrack.m4a',
  poster: '/videos/sergio-hero-session-poster.webp',
};

export const heroChapters: HeroChapter[] = [
  {
    id: 'groove', title: 'Groove', start: .12,
    copy: 'Keep the pulse steady. Let the ride cymbal and snare shape how it feels.',
    framing: { scale: 1, xPercent: 0 },
  },
  {
    id: 'control', title: 'Control', start: .207,
    copy: 'Let the backbeat speak clearly. Keep the ghost notes soft enough that you feel them before you hear them.',
    framing: { scale: 1.06, xPercent: 1.2 },
  },
  {
    id: 'technique', title: 'Technique', start: .305,
    copy: 'A relaxed grip gives the stick room to rebound and leaves the hand ready for the next stroke.',
    framing: { scale: 1.12, xPercent: -1.8 },
  },
  {
    id: 'flow', title: 'Flow', start: .407,
    copy: 'Move the phrase from snare to toms and keep its place in the bar.',
    framing: { scale: 1.08, xPercent: 1.8 },
  },
  {
    id: 'musicality', title: 'Musicality', start: .506,
    copy: 'Leave room for the bass, bring one accent forward, and let the cymbal ring.',
    framing: { scale: 1.025, xPercent: 0 },
  },
  {
    id: 'anticipation', title: 'Before the hit', start: .602,
    copy: 'Watch where the sticks rise before the next accented note.',
    framing: { scale: 1.07, xPercent: 0 },
  },
  {
    id: 'discovery', title: 'The quiet notes', start: .82,
    copy: 'Same tempo. Same backbeat. Hear what four quiet snare strokes change.',
  },
];

export const performanceStart = .70;
