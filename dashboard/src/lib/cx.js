/** Tiny className joiner: cx('a', cond && 'b', { c: true }, ['d']) → 'a b c d' */
export function cx(...args) {
  const out = []
  for (const arg of args) {
    if (!arg) continue
    if (typeof arg === 'string' || typeof arg === 'number') out.push(arg)
    else if (Array.isArray(arg)) out.push(cx(...arg))
    else if (typeof arg === 'object') {
      for (const [key, on] of Object.entries(arg)) if (on) out.push(key)
    }
  }
  return out.join(' ')
}
