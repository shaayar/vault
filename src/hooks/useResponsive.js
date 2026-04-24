/**
 * Responsive design utilities and hooks
 */

import { useState, useEffect } from 'react'

/**
 * Breakpoint definitions
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

/**
 * Get current breakpoint
 */
export function getCurrentBreakpoint(width) {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return 'xs'
}

/**
 * Check if width matches breakpoint
 */
export function matchesBreakpoint(width, breakpoint) {
  return width >= BREAKPOINTS[breakpoint]
}

/**
 * Custom hook for responsive design
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  const [breakpoint, setBreakpoint] = useState(() => 
    getCurrentBreakpoint(windowSize.width)
  )

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      setBreakpoint(getCurrentBreakpoint(width))
    }

    if (typeof window !== 'undefined') {
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return {
    width: windowSize.width,
    height: windowSize.height,
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    isSmallScreen: windowSize.width < 768,
    isLargeScreen: windowSize.width >= 1024,
    
    // Breakpoint checks
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    
    // Utility functions
    matches: (bp) => matchesBreakpoint(windowSize.width, bp),
    between: (min, max) => windowSize.width >= BREAKPOINTS[min] && windowSize.width < BREAKPOINTS[max]
  }
}

/**
 * Hook for responsive values
 */
export function useResponsiveValue(values) {
  const { breakpoint } = useResponsive()
  
  if (typeof values === 'string' || typeof values === 'number') {
    return values
  }
  
  // Return value for current breakpoint
  if (values[breakpoint] !== undefined) {
    return values[breakpoint]
  }
  
  // Fallback to next larger breakpoint
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpoints.indexOf(breakpoint)
  
  for (let i = currentIndex + 1; i < breakpoints.length; i++) {
    if (values[breakpoints[i]] !== undefined) {
      return values[breakpoints[i]]
    }
  }
  
  // Fallback to smallest breakpoint
  return values.xs || values.sm || values.md || values.lg || values.xl || values['2xl']
}

/**
 * Hook for mobile menu state
 */
export function useMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { isMobile } = useResponsive()

  useEffect(() => {
    // Close mobile menu when switching to desktop
    if (!isMobile) {
      setIsOpen(false)
    }
  }, [isMobile])

  const toggle = () => setIsOpen(!isOpen)
  const close = () => setIsOpen(false)
  const open = () => setIsOpen(true)

  return {
    isOpen,
    toggle,
    open,
    close,
    isMobile
  }
}

/**
 * Hook for responsive sidebar
 */
export function useResponsiveSidebar() {
  const { isMobile, isTablet } = useResponsive()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    // Auto-hide sidebar on mobile
    if (isMobile) {
      setIsHidden(true)
      setIsCollapsed(false)
    } else if (isTablet) {
      setIsHidden(false)
      setIsCollapsed(true)
    } else {
      setIsHidden(false)
      setIsCollapsed(false)
    }
  }, [isMobile, isTablet])

  const toggle = () => {
    if (isMobile) {
      setIsHidden(!isHidden)
    } else {
      setIsCollapsed(!isCollapsed)
    }
  }

  const show = () => {
    setIsHidden(false)
    setIsCollapsed(false)
  }

  const hide = () => {
    if (isMobile) {
      setIsHidden(true)
    } else {
      setIsCollapsed(true)
    }
  }

  return {
    isCollapsed,
    isHidden,
    toggle,
    show,
    hide,
    isMobile,
    isTablet
  }
}

/**
 * Hook for responsive panels
 */
export function useResponsivePanel(defaultWidth = 320, minWidth = 200, maxWidth = 600) {
  const { isMobile, isTablet } = useResponsive()
  const [width, setWidth] = useState(defaultWidth)
  const [isHidden, setIsHidden] = useState(false)

  useEffect(() => {
    // Adjust panel width for mobile/tablet
    if (isMobile) {
      setIsHidden(true)
      setWidth(window.innerWidth - 32) // Full width with padding
    } else if (isTablet) {
      setIsHidden(false)
      setWidth(Math.min(defaultWidth, 280))
    } else {
      setIsHidden(false)
      setWidth(defaultWidth)
    }
  }, [isMobile, isTablet, defaultWidth])

  const resize = (newWidth) => {
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    setWidth(clampedWidth)
  }

  const toggle = () => setIsHidden(!isHidden)

  return {
    width,
    isHidden,
    resize,
    toggle,
    isMobile,
    isTablet
  }
}

/**
 * Touch gesture utilities
 */
export function useTouchGestures() {
  const [startTouch, setStartTouch] = useState(null)
  const [swipeDirection, setSwipeDirection] = useState(null)

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    setStartTouch({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    })
    setSwipeDirection(null)
  }

  const handleTouchEnd = (e) => {
    if (!startTouch) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startTouch.x
    const deltaY = touch.clientY - startTouch.y
    const deltaTime = Date.now() - startTouch.time

    // Minimum swipe distance and time
    const minDistance = 50
    const maxTime = 300

    if (Math.abs(deltaX) > minDistance && deltaTime < maxTime) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left')
    }

    setStartTouch(null)
  }

  return {
    startTouch,
    swipeDirection,
    handleTouchStart,
    handleTouchEnd
  }
}
