import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { IconButton } from './IconButton'
import { Input } from './Input'

/**
 * Password <Input> with a show / hide toggle. Works with `{...register('password')}`; follows the page's own
 * direction (RTL in the Arabic UI, LTR in English) — pass `dir` explicitly to override.
 * `showLabel`/`hideLabel` are REQUIRED (same rule as IconButton's `label`): pass the caller's own translated text.
 */
export function PasswordInput({ showLabel, hideLabel, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <Input
      type={shown ? 'text' : 'password'}
      endAdornment={<IconButton icon={shown ? EyeOff : Eye} size="sm" label={shown ? hideLabel : showLabel} onClick={() => setShown((value) => !value)} />}
      {...props}
    />
  )
}
