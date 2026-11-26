/** Real film grain: one noise tile, generated once, that the stylesheet jitters with steps(). */
export function filmGrain(element: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const density = Math.min(window.devicePixelRatio || 1, 2)
  const size = Math.round(96 * density)
  const tile = document.createElement('canvas')
  tile.width = tile.height = size
  const context = tile.getContext('2d')
  if (!context) return

  const pixels = context.createImageData(size, size)
  for (let index = 0; index < pixels.data.length; index += 4) {
    // Three uniforms average to a bell curve around mid grey, the neutral point of an overlay blend.
    const spread = (Math.random() + Math.random() + Math.random()) / 1.5 - 1
    const value = Math.round(128 + spread * 118)
    pixels.data[index] = pixels.data[index + 1] = pixels.data[index + 2] = value
    pixels.data[index + 3] = 255
  }
  context.putImageData(pixels, 0, 0)

  element.style.backgroundImage = `url(${tile.toDataURL()})`
  element.style.backgroundSize = `${size / density}px ${size / density}px`
  element.setAttribute('data-grain', '')
}
