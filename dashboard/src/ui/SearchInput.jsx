import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useCommon, useLanguage } from '@/i18n'
import { cx } from '@/lib/cx'
import { IconButton } from './IconButton'
import { Input } from './Input'

/**
 * Debounced search box. `value` is the committed search (from the URL / list state); `onChange(text)` fires
 * `delay` ms after the last keystroke, immediately on Enter, and with '' when cleared.
 *   <SearchInput value={list.params.search ?? ''} onChange={(search) => list.set({ search })} />
 */
export function SearchInput({ value = '', onChange, delay = 350, placeholder, className, ...rest }) {
  const c = useCommon()
  const { dir } = useLanguage()
  const [text, setText] = useState(value)
  const timer = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // keep in sync when the parent resets the value (e.g. "clear filters")
  useEffect(() => setText(value), [value])
  useEffect(() => () => clearTimeout(timer.current), [])

  const flush = (next) => {
    clearTimeout(timer.current)
    onChangeRef.current?.(next.trim())
  }

  return (
    <div role="search" className={cx('w-full sm:w-72', className)}>
      <Input
        type="search"
        dir={dir}
        value={text}
        placeholder={placeholder ?? c.searchPlaceholder}
        aria-label={rest['aria-label'] ?? c.search}
        startIcon={Search}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          clearTimeout(timer.current)
          timer.current = setTimeout(() => flush(next), delay)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            flush(text)
          }
        }}
        endAdornment={
          text ? (
            <IconButton
              icon={X}
              size="sm"
              label={c.clearSearch}
              onClick={() => {
                setText('')
                flush('')
              }}
            />
          ) : null
        }
        className="[&::-webkit-search-cancel-button]:hidden"
        {...rest}
      />
    </div>
  )
}
