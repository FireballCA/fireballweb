let lockCount = 0
let savedBodyOverflow = ''
let savedHtmlOverflow = ''
let savedScrollRootOverflow = ''
let savedScrollRootTouchAction = ''

function getScrollRoot(): HTMLElement | null {
  return document.getElementById('app-scroll-root')
}

export function lockScroll(): void {
  lockCount += 1
  if (lockCount === 1) {
    savedBodyOverflow = document.body.style.overflow
    savedHtmlOverflow = document.documentElement.style.overflow
    const root = getScrollRoot()
    savedScrollRootOverflow = root?.style.overflowY ?? ''
    savedScrollRootTouchAction = root?.style.touchAction ?? ''

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    if (root) {
      root.style.overflowY = 'hidden'
      root.style.touchAction = 'none'
    }
  }
}

export function unlockScroll(): void {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    document.body.style.overflow = savedBodyOverflow
    document.documentElement.style.overflow = savedHtmlOverflow
    const root = getScrollRoot()
    if (root) {
      root.style.overflowY = savedScrollRootOverflow
      root.style.touchAction = savedScrollRootTouchAction
    }
  }
}
