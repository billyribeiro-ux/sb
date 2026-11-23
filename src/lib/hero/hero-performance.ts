import type { HeroOpeningEdit } from './hero-chapters';

const driftTolerance = 0.3;
const audioFocusEvent = 'sergio:audio-focus';
const interactiveSelector = 'a, button, input, select, textarea, label, summary, [contenteditable], [role="button"], [role="link"], [tabindex]';
const soundFadeFloor = .08;
const fullSoundRatio = .9;

export function mountHeroPerformance(
  stage: HTMLElement,
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  onSoundChange: (playing: boolean) => void,
  flow: HTMLVideoElement,
  openingEdit?: HeroOpeningEdit,
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const performanceOffset = openingEdit?.handoff ?? 0;
  let openingTime = 0;
  let scrubbingOpening = Boolean(openingEdit);
  let openingGain = 1;
  let joiningPerformance = false;
  let entered = false;
  let stageVisible = false;
  let stageRatio = 0;
  let pictureActive = false;
  let holdingOpeningAngle = false;
  let cutawayActive = false;
  let blocked = false;
  let soundChoice: 'auto' | 'on' | 'off' = 'auto';
  let needsGesture = false;
  let gestureRetried = false;
  let soundPlaying = false;
  let pendingSound = false;
  let soundRequest = 0;
  let fadeFrame = 0;
  let targetLevel = 1;
  let level = 1;
  let gainContext: AudioContext | undefined;
  let gain: GainNode | undefined;

  // Some mobile browsers reserve the media element volume for hardware controls.
  let nativeVolume = false;
  try {
    audio.volume = .5;
    nativeVolume = audio.volume === .5;
    audio.volume = 1;
  } catch { /* Fall back to Web Audio gain when available. */ }

  video.defaultMuted = true;
  video.muted = true;
  updatePreload();
  flow.defaultMuted = true;
  flow.muted = true;

  const onStage = () => stageVisible && !blocked && !document.hidden;
  const soundAllowed = () => entered && !blocked && !document.hidden && soundChoice !== 'off' &&
    (soundChoice === 'on' || !reducedMotion.matches);

  function reportSound(playing: boolean) {
    if (playing === soundPlaying) return;
    soundPlaying = playing;
    onSoundChange(playing);
  }

  function pauseSound() {
    cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
    if (pendingSound || !audio.paused) {
      soundRequest += 1;
      pendingSound = false;
      audio.pause();
    }
    reportSound(false);
  }

  function setLevel(value: number) {
    level = value;
    if (gain) gain.gain.value = value;
    else if (nativeVolume) audio.volume = value;
  }

  function prepareGain() {
    if (nativeVolume || gain || typeof window.AudioContext !== 'function') return;
    const context = gainContext ??= new AudioContext();
    void context.resume().then(() => {
      if (gainContext !== context || gain || context.state !== 'running') return;
      const output = context.createGain();
      output.gain.value = level;
      output.connect(context.destination);
      context.createMediaElementSource(audio).connect(output);
      gain = output;
    }).catch(() => {});
  }

  function stageLevel() {
    return Math.max(0, Math.min(1, (stageRatio - soundFadeFloor) / (fullSoundRatio - soundFadeFloor)));
  }

  function levelFromScroll() {
    return stageLevel() * (openingEdit?.soundDuringOpening && !pictureActive ? openingGain : 1);
  }

  function fadeWithScroll() {
    if (joiningPerformance) return;
    const next = levelFromScroll();
    if (next === targetLevel && fadeFrame) return;
    cancelAnimationFrame(fadeFrame);
    fadeFrame = 0;
    targetLevel = next;
    if (next === level) {
      if (next === 0) pauseSound();
      return;
    }

    const from = level;
    const start = performance.now();
    const duration = next < from ? 620 : 300;
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const easing = t * t * (3 - 2 * t);
      setLevel(from + (next - from) * easing);
      fadeFrame = t < 1 ? requestAnimationFrame(step) : 0;
      if (!fadeFrame && next === 0) pauseSound();
    }
    fadeFrame = requestAnimationFrame(step);
  }

  function playSound(joinPicture = false) {
    if (!onStage() || !soundAllowed() || needsGesture || pendingSound || !audio.paused) return;
    if (openingEdit) {
      const explicitStaticPlayback = soundChoice === 'on' && (reducedMotion.matches || !stage.hasAttribute('data-opening-scrub') && !pictureActive);
      if (!pictureActive && !explicitStaticPlayback && (!openingEdit.soundDuringOpening || !scrubbingOpening)) return;
      if (pictureActive && (video.paused || video.seeking ||
          video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)) return;
    }

    if (audio.ended) {
      audio.currentTime = 0;
    } else if (joinPicture && pictureActive && !video.ended && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      audio.currentTime = Math.max(0, video.currentTime - performanceOffset);
    }

    const request = ++soundRequest;
    pendingSound = true;
    targetLevel = levelFromScroll();
    setLevel(targetLevel);
    void audio.play().then(() => {
      if (request === soundRequest) pendingSound = false;
    }, () => {
      if (request !== soundRequest) return;
      pendingSound = false;
      needsGesture = true;
      reportSound(false);
    });
    prepareGain();
  }

  function alignPicture() {
    if (joiningPerformance || holdingOpeningAngle || !pictureActive || !onStage() || reducedMotion.matches || audio.paused || audio.ended || video.seeking ||
        !Number.isFinite(video.duration) || video.duration <= 0) return;

    const length = video.duration - performanceOffset;
    if (length <= 0) return;
    const looping = video.loop || Boolean(openingEdit);
    const time = performanceOffset + (looping ? audio.currentTime % length : Math.min(audio.currentTime, length));
    const drift = Math.abs(video.currentTime - time);
    if (drift > driftTolerance && (!looping || length - drift > driftTolerance)) video.currentTime = time;
  }

  function applyOpeningSeek() {
    if (!openingEdit || pictureActive || !scrubbingOpening || video.seeking ||
        video.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (Math.abs(video.currentTime - openingTime) >= 0.5 / openingEdit.frameRate) {
      video.currentTime = openingTime;
    }
  }

  function seekOpening(progress: number) {
    if (!openingEdit) return;
    scrubbingOpening = progress < 1 && !reducedMotion.matches;
    stage.toggleAttribute('data-opening-scrub', scrubbingOpening && progress > .05);
    const lastFrame = Math.round(performanceOffset * openingEdit.frameRate) - 1;
    const amount = Math.max(0, Math.min(1, (progress - .05) / .9));
    openingTime = Math.round(lastFrame * amount) / openingEdit.frameRate;
    if (openingEdit.soundDuringOpening && (scrubbingOpening || !pictureActive)) {
      const remaining = Math.max(0, Math.min(1, (1 - progress) / .2));
      openingGain = remaining * remaining * (3 - 2 * remaining);
      if (!audio.paused) {
        cancelAnimationFrame(fadeFrame);
        fadeFrame = 0;
        targetLevel = stageLevel() * openingGain;
        setLevel(targetLevel);
      }
    }
    applyOpeningSeek();
  }

  function showOpeningVideo() {
    stage.toggleAttribute('data-opening-ready', Boolean(openingEdit));
  }

  function onPicturePlaying() {
    if (joiningPerformance) {
      joiningPerformance = false;
      audio.currentTime = Math.max(0, video.currentTime - performanceOffset);
      if (!audio.paused) fadeWithScroll();
    }
    if (audio.paused) playSound(true);
  }

  function replayPerformance() {
    if (!openingEdit || !pictureActive || !onStage()) return;
    video.currentTime = performanceOffset;
    updatePicture();
  }

  function updatePicture() {
    if (!onStage() || !pictureActive || reducedMotion.matches) {
      video.pause();
      flow.pause();
      return;
    }

    alignPicture();
    if (video.paused && !video.ended) void video.play().catch(() => {});
    if (!cutawayActive) flow.pause();
    else if (flow.paused) void flow.play().catch(() => {});
  }

  function update() {
    if (!soundAllowed()) pauseSound();
    else if (!audio.paused) fadeWithScroll();
    else if (stageVisible) playSound();
    updatePicture();
  }

  function updatePreload() {
    video.preload = reducedMotion.matches ? 'none' : openingEdit && entered ? 'auto' : 'metadata';
    flow.preload = !reducedMotion.matches && entered ? 'metadata' : 'none';
  }

  function onMotionChange() {
    updatePreload();
    update();
  }

  function onAudioPlaying() {
    if (!soundAllowed() || stageRatio === 0) {
      pauseSound();
      return;
    }
    reportSound(true);
    fadeWithScroll();
    alignPicture();
    document.dispatchEvent(new CustomEvent(audioFocusEvent, { detail: audio }));
  }

  function onAudioPause() {
    if (audio.paused) reportSound(false);
  }

  function onAudioEnded() {
    soundChoice = 'off';
    reportSound(false);
  }

  function onOtherAudio(event: Event) {
    if ((event as CustomEvent<unknown>).detail === audio) return;
    soundChoice = 'off';
    pauseSound();
  }

  function onFirstGesture(event: MouseEvent | KeyboardEvent) {
    if (!needsGesture || gestureRetried || soundChoice !== 'auto' || !onStage() || !soundAllowed() || !event.isTrusted ||
        (event.target instanceof Element && event.target.closest(interactiveSelector))) return;
    if (event instanceof MouseEvent && event.button !== 0) return;
    if (event instanceof KeyboardEvent && (event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
        event.key === 'Escape' || event.key === 'Tab')) return;

    gestureRetried = true;
    needsGesture = false;
    playSound(true);
  }

  function setSound(enabled: boolean) {
    if (!enabled) {
      soundChoice = 'off';
      pauseSound();
      return;
    }

    soundChoice = 'on';
    if (soundPlaying) return;
    if (pendingSound) pauseSound();
    needsGesture = false;
    playSound(true);
  }

  const visibility = new IntersectionObserver(([entry]) => {
    stageRatio = entry.isIntersecting ? entry.intersectionRatio : 0;
    stageVisible = stageRatio >= .55;
    update();
  }, { threshold: [0, soundFadeFloor, .2, .32, .44, .55, .67, .79, fullSoundRatio, 1] });
  visibility.observe(stage);
  document.addEventListener('visibilitychange', update);
  document.addEventListener(audioFocusEvent, onOtherAudio);
  reducedMotion.addEventListener('change', onMotionChange);
  stage.addEventListener('click', onFirstGesture);
  stage.addEventListener('keydown', onFirstGesture);
  audio.addEventListener('playing', onAudioPlaying);
  audio.addEventListener('pause', onAudioPause);
  audio.addEventListener('ended', onAudioEnded);
  audio.addEventListener('timeupdate', alignPicture);
  video.addEventListener('canplay', updatePicture);
  if (openingEdit) {
    video.addEventListener('loadedmetadata', applyOpeningSeek);
    video.addEventListener('loadeddata', showOpeningVideo);
    video.addEventListener('seeked', applyOpeningSeek);
    video.addEventListener('playing', onPicturePlaying);
    video.addEventListener('ended', replayPerformance);
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showOpeningVideo();
  }

  return {
    setPictureActive(active: boolean, matchingOpening = false) {
      if (pictureActive === active && holdingOpeningAngle === matchingOpening) return;
      if (openingEdit && active && !pictureActive) {
        joiningPerformance = true;
        cancelAnimationFrame(fadeFrame);
        fadeFrame = 0;
        setLevel(0);
        video.currentTime = performanceOffset;
      } else if (!active) {
        joiningPerformance = false;
      }
      if (active && matchingOpening && !pictureActive) video.currentTime = 0;
      pictureActive = active;
      holdingOpeningAngle = matchingOpening;
      updatePicture();
      if (openingEdit && !active && scrubbingOpening) {
        if (!openingEdit.soundDuringOpening) pauseSound();
        applyOpeningSeek();
      }
    },
    prepareOpening() {
      entered = true;
      updatePreload();
      update();
    },
    seekOpening,
    setCutawayActive(active: boolean) {
      if (cutawayActive === active) return;
      cutawayActive = active;
      updatePicture();
    },
    setBlocked(nextBlocked: boolean) {
      if (blocked === nextBlocked) return;
      blocked = nextBlocked;
      update();
    },
    setSound,
    destroy() {
      visibility.disconnect();
      document.removeEventListener('visibilitychange', update);
      document.removeEventListener(audioFocusEvent, onOtherAudio);
      reducedMotion.removeEventListener('change', onMotionChange);
      stage.removeEventListener('click', onFirstGesture);
      stage.removeEventListener('keydown', onFirstGesture);
      audio.removeEventListener('playing', onAudioPlaying);
      audio.removeEventListener('pause', onAudioPause);
      audio.removeEventListener('ended', onAudioEnded);
      audio.removeEventListener('timeupdate', alignPicture);
      video.removeEventListener('canplay', updatePicture);
      video.removeEventListener('loadedmetadata', applyOpeningSeek);
      video.removeEventListener('loadeddata', showOpeningVideo);
      video.removeEventListener('seeked', applyOpeningSeek);
      video.removeEventListener('playing', onPicturePlaying);
      video.removeEventListener('ended', replayPerformance);
      stage.removeAttribute('data-opening-ready');
      stage.removeAttribute('data-opening-scrub');
      video.pause();
      flow.pause();
      pauseSound();
      const context = gainContext;
      gainContext = undefined;
      void context?.close().catch(() => {});
    },
  };
}
