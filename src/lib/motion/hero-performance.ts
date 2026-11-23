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
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stageVisible = false;
  let stageRatio = 0;
  let pictureActive = false;
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
  video.preload = reducedMotion.matches ? 'none' : 'metadata';
  flow.defaultMuted = true;
  flow.muted = true;

  const onStage = () => stageVisible && !blocked && !document.hidden;
  const soundAllowed = () => !blocked && !document.hidden && soundChoice !== 'off' &&
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

  function levelFromScroll() {
    return Math.max(0, Math.min(1, (stageRatio - soundFadeFloor) / (fullSoundRatio - soundFadeFloor)));
  }

  function fadeWithScroll() {
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

    if (audio.ended) {
      audio.currentTime = 0;
    } else if (joinPicture && pictureActive && !video.ended && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      audio.currentTime = video.currentTime;
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
    if (!pictureActive || !onStage() || reducedMotion.matches || audio.paused || audio.ended || video.seeking ||
        !Number.isFinite(video.duration) || video.duration <= 0) return;

    const time = video.loop ? audio.currentTime % video.duration : Math.min(audio.currentTime, video.duration);
    const drift = Math.abs(video.currentTime - time);
    if (drift > driftTolerance && (!video.loop || video.duration - drift > driftTolerance)) video.currentTime = time;
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

  function onMotionChange() {
    video.preload = reducedMotion.matches ? 'none' : 'metadata';
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

  return {
    setPictureActive(active: boolean) {
      if (pictureActive === active) return;
      pictureActive = active;
      updatePicture();
    },
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
      video.pause();
      flow.pause();
      pauseSound();
      const context = gainContext;
      gainContext = undefined;
      void context?.close().catch(() => {});
    },
  };
}
