import React, { useRef, useEffect } from 'react'

/**
 * RenameInput Component - Inline editing input
 */
export function RenameInput({ 
  initialValue = '', 
  onSave, 
  onCancel,
  className = '' 
}) {
  const inputRef = useRef(null)
  
  useEffect(() => {
    // Focus and select text when mounted
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newValue = inputRef.current?.value?.trim()
      if (newValue && newValue !== initialValue) {
        onSave?.(newValue)
      } else {
        onCancel?.()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel?.()
    }
  }
  
  const handleBlur = () => {
    const newValue = inputRef.current?.value?.trim()
    if (newValue && newValue !== initialValue) {
      onSave?.(newValue)
    } else {
      onCancel?.()
    }
  }
  
  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={initialValue}
      className={`
        w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 
        border border-blue-500 rounded outline-none
        focus:ring-1 focus:ring-blue-500
        ${className}
      `}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  )
}
