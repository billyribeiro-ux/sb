interface Pace {
  /** Milliseconds the scroll takes to close most of the gap to wherever the wheel pointed. */
  glide: number
  /** Fastest the page may move, in viewport heights a second. */
  speed: number
}

const filmPace: Pace = { glide: 380, speed: 1 }

/**
 * Keeps the wheel at the film's pace while the hero is on screen: a turn of the wheel only names a
 * destination, and the page glides there, never faster than the pace allows. Touch, keys and the
 * scrollbar stay native, and so does any wheel turn that leaves the film.
 */
export function filmWheel(scope: HTMLElement, pace: Pace = filmPace) {
  let target = 0
  let current = 0
  let previous = 0
  let raf = 0

  /** Where the film is on screen, or nothing when it has been scrolled past. */
  function runway() {
    const stage = scope.querySelector<HTMLElement>('[data-hero-stage]')
    if (!stage || scope.dataset.cinematic !== 'true') return
    const start = scope.getBoundingClientRect().top + window.scrollY
    const end = start + scope.clientHeight - stage.clientHeight
    const y = window.scrollY
    if (y < start - 1 || y > end + 1) return
    return { start, end, y }
  }

  function glide(now: number) {
    raf = 0
    const seconds = Math.min(64, now - previous) / 1000
    previous = now
    const gap = target - current
    const step = Math.sign(gap) * Math.min(
      Math.abs(gap) * (1 - Math.exp((-seconds * 1000) / pace.glide)),
      pace.speed * window.innerHeight * seconds,
    )
    current += Math.abs(gap) - Math.abs(step) < 0.5 ? gap : step
    window.scrollTo({ top: current, behavior: 'instant' })
    if (Math.abs(target - current) > 0.5) raf = requestAnimationFrame(glide)
  }

  function onWheel(event: WheelEvent) {
    if (event.ctrlKey || event.defaultPrevented || document.querySelector('dialog[open]')) return
    const film = runway()
    if (!film) return
    // A turn that leaves the film scrolls the page natively once the glide has arrived.
    if ((event.deltaY < 0 && film.y <= film.start) ||
        (event.deltaY > 0 && film.y >= film.end - 1 && Math.abs(target - current) < 1)) return
    // Keys, touch or the scrollbar moved the page behind our back: start from where they left it.
    if (!raf) target = current = film.y
    const lines = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
    target = Math.min(film.end, Math.max(film.start, target + event.deltaY * lines))
    event.preventDefault()
    previous = performance.now()
    if (!raf) raf = requestAnimationFrame(glide)
  }

  window.addEventListener('wheel', onWheel, { passive: false })

  return {
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', onWheel)
    },
  }
}
