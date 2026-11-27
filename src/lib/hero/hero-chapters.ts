export interface HeroFraming {
  scale: number;
  xPercent: number;
  yPercent: number;
  shade: number;
  brightness?: number;
  saturation?: number;
}

export interface HeroChapter {
  id: string;
  title: string;
  kicker: string;
  copy: string;
  /** A phrase in the copy that is marked in brass as the line lands. */
  emphasis?: string;
  start: number;
  framing?: HeroFraming;
}

export interface HeroOpeningEdit {
  picture: string;
  poster: string;
  handoff: number;
  frameRate: number;
  soundDuringOpening?: boolean;
}

export const widePerformanceFraming: HeroFraming = { scale: 1, xPercent: 0, yPercent: 0, shade: .74, brightness: 1, saturation: 1 };

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

export const performanceOpeningEdit: HeroOpeningEdit = {
  picture: heroSession.picture,
  poster: '/motion/sergio-studio-opening-poster.webp',
  handoff: 0,
  frameRate: 30,
  soundDuringOpening: true,
};

export const heroChapters: HeroChapter[] = [
  {
    id: 'groove', title: 'Groove', kicker: 'Movement I · The foundation', start: .28,
    copy: 'The room finds its pulse. Ride, snare, and kick lock into a feel you sense before you hear it.',
    emphasis: 'pulse',
    framing: { scale: 1.035, xPercent: 0, yPercent: 0, shade: .88, brightness: 1.04, saturation: 1.08 },
  },
  {
    id: 'control', title: 'Control', kicker: 'Movement II · Power with restraint', start: .355,
    copy: 'The backbeat stays commanding. The ghost notes barely touch the surface. Power lives in the space between.',
    emphasis: 'the space between',
    framing: { scale: 1.16, xPercent: 4.5, yPercent: .5, shade: .92, brightness: .9, saturation: .78 },
  },
  {
    id: 'technique', title: 'Technique', kicker: 'Movement III · Effort becomes motion', start: .435,
    copy: 'A relaxed grip turns effort into rebound. Every stroke is already preparing the next.',
    emphasis: 'rebound',
    framing: { scale: 1.32, xPercent: -6, yPercent: -1.5, shade: .94, brightness: 1.08, saturation: .92 },
  },
  {
    id: 'flow', title: 'Flow', kicker: 'Movement IV · Momentum without gravity', start: .518,
    copy: 'One idea travels from snare to toms, gathering momentum without ever losing its place in the bar.',
    emphasis: 'momentum',
    framing: { scale: 1.18, xPercent: 5.5, yPercent: -.6, shade: .8, brightness: 1.02, saturation: 1.12 },
  },
  {
    id: 'musicality', title: 'Musicality', kicker: 'Movement V · The space is an instrument', start: .599,
    copy: 'An accent leans forward. A cymbal opens the room. What remains unplayed changes everything.',
    emphasis: 'unplayed',
    framing: { scale: 1.09, xPercent: -1.5, yPercent: 0, shade: .82, brightness: .94, saturation: .82 },
  },
  {
    id: 'anticipation', title: 'Before the hit', kicker: 'Movement VI · A fraction of forever', start: .677,
    copy: 'For a suspended instant, everything is possibility. Then the stick falls.',
    emphasis: 'the stick falls',
    framing: { scale: 1.29, xPercent: -2.5, yPercent: 1.2, shade: .96, brightness: .86, saturation: .72 },
  },
  {
    id: 'discovery', title: 'The quiet notes', kicker: 'Movement VII · Hear what was always there', start: .86,
    copy: 'Same tempo. Same backbeat. Four quiet strokes change everything.',
    emphasis: 'quiet strokes',
  },
];

export const performanceStart = .76;
