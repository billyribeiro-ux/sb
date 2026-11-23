const driftTolerance = 0.3;
const audioFocusEvent = 'sergio:audio-focus';
const interactiveSelector = 'a, button, input, select, textarea, label, summary, [contenteditable], [role="button"], [role="link"], [tabindex]';

export function mountHeroPerformance(
  stage: HTMLElement,
  video: HTMLVideoElement,
  audio: HTMLAudioElement,
  onSoundChange: (playing: boolean) => void,
) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stageVisible = false;
  let pictureActive = false;
  let blocked = false;
  let soundChoice: 'auto' | 'on' | 'off' = 'auto';
  let needsGesture = false;
  let gestureRetried = false;
  let soundPlaying = false;
  let pendingSound = false;
  let soundRequest = 0;

  video.defaultMuted = true;
  video.muted = true;
  video.preload = reducedMotion.matches ? 'none' : 'metadata';

  const onStage = () => stageVisible && !blocked && !document.hidden;
  const mayPlaySound = () => onStage() && soundChoice !== 'off' &&
    (soundChoice === 'on' || !reducedMotion.matches);

  function reportSound(playing: boolean) {
    if (playing === soundPlaying) return;
    soundPlaying = playing;
    onSoundChange(playing);
  }

  function pauseSound() {
    if (pendingSound || !audio.paused) {
      soundRequest += 1;
      pendingSound = false;
      audio.pause();
    }
    reportSound(false);
  }

  function playSound(joinPicture = false) {
    if (!mayPlaySound() || needsGesture || pendingSound || !audio.paused) return;

    if (audio.ended) {
      audio.currentTime = 0;
    } else if (joinPicture && pictureActive && !video.ended && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      audio.currentTime = video.currentTime;
    }

    const request = ++soundRequest;
    pendingSound = true;
    void audio.play().then(() => {
      if (request === soundRequest) pendingSound = false;
    }, () => {
      if (request !== soundRequest) return;
      pendingSound = false;
      needsGesture = true;
      reportSound(false);
    });
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
      return;
    }

    alignPicture();
    if (video.paused && !video.ended) void video.play().catch(() => {});
  }

  function update() {
    if (mayPlaySound()) playSound();
    else pauseSound();
    updatePicture();
  }

  function onMotionChange() {
    video.preload = reducedMotion.matches ? 'none' : 'metadata';
    update();
  }

  function onAudioPlaying() {
    if (!mayPlaySound()) {
      pauseSound();
      return;
    }
    reportSound(true);
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
    if (!needsGesture || gestureRetried || soundChoice !== 'auto' || !mayPlaySound() || !event.isTrusted ||
        (event.target instanceof Element && event.target.closest(interactiveSelector))) return;
    if (event instanceof MouseEvent && event.button !== 0) return;
    if (event instanceof KeyboardEvent && (event.repeat || event.metaKey || event.ctrlKey || event.altKey ||
        event.key === 'Escape' || event.key === 'Tab')) return;

    gestureRetried = true;
    needsGesture = false;
    playSound(true);
  }

  const visibility = new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
    update();
  }, { threshold: 0.55 });
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
    setBlocked(nextBlocked: boolean) {
      if (blocked === nextBlocked) return;
      blocked = nextBlocked;
      update();
    },
    toggleSound() {
      if (soundPlaying) {
        soundChoice = 'off';
        pauseSound();
        return;
      }

      if (pendingSound) pauseSound();
      soundChoice = 'on';
      needsGesture = false;
      playSound(true);
    },
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
      pauseSound();
    },
  };
}
