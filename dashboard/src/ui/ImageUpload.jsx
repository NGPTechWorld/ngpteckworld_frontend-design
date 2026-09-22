import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { cx } from '@/lib/cx'
import { Button } from './Button'
import { useFieldContext } from './Field'
import { Spinner } from './Spinner'
import { IMAGE_ACCEPT, MAX_IMAGE_MB, uploadErrorText, validateImage } from './upload'

const shapes = {
  landscape: 'aspect-video w-full max-w-sm rounded-xl',
  square: 'aspect-square w-40 rounded-xl',
  circle: 'aspect-square w-32 rounded-full',
}

/**
 * Single image field. The form stores the relative `path` returned by POST /uploads; the preview uses the
 * absolute `url` — for a record loaded from the API that is `record.logo_url` next to `record.logo`.
 *
 *   <Controller name="logo" control={control} render={({ field }) => (
 *     <ImageUpload folder="partners" value={field.value} url={partner?.logo_url} onChange={field.onChange} />
 *   )} />
 *
 * value: path | null · url: preview URL of the saved value · onChange(path | null) · folder: one of the API folders.
 * shape: 'landscape' (default) | 'square' | 'circle'. onUploadingChange(bool) lets the form block Save meanwhile.
 * Files are checked (type, size ≤ 5 MB) before upload; the picker, drag & drop and the keyboard all work.
 */
export function ImageUpload({ value = null, url, onChange, folder, shape = 'landscape', disabled = false, invalid, maxSizeMB = MAX_IMAGE_MB, onUploadingChange, id, className, alt }) {
  const c = useCommon()
  const field = useFieldContext()
  const isInvalid = invalid ?? field?.invalid
  const inputRef = useRef(null)
  const mounted = useRef(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploaded, setUploaded] = useState(null) // { path, url } of the file uploaded in this session

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const previewUrl = value ? (uploaded?.path === value ? uploaded.url : url) : null

  const upload = async (file) => {
    if (!file || disabled) return
    const problem = validateImage(file, maxSizeMB)
    if (problem) {
      setError(uploadErrorText(problem, c, maxSizeMB))
      return
    }
    setError('')
    setUploading(true)
    onUploadingChange?.(true)
    try {
      const result = await api.upload(file, folder)
      if (mounted.current) setUploaded(result)
      onChange?.(result.path)
    } catch (err) {
      if (mounted.current) setError(uploadErrorText(err, c, maxSizeMB))
    } finally {
      if (mounted.current) setUploading(false)
      onUploadingChange?.(false)
    }
  }

  const pick = () => inputRef.current?.click()
  const onFiles = (event) => {
    upload(event.target.files?.[0])
    event.target.value = '' // allow choosing the same file again
  }

  const frame = cx(
    'group relative flex items-center justify-center overflow-hidden border bg-white/[.03] transition-colors',
    shapes[shape],
    isInvalid || error ? 'border-danger/60' : dragOver ? 'border-accent-light bg-accent/15' : 'border-white/[.14]',
    !previewUrl && 'border-dashed',
  )

  return (
    <div className={cx('min-w-0', className)}>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} hidden tabIndex={-1} onChange={onFiles} data-testid="image-input" />

      <div
        className={frame}
        onDragOver={(event) => {
          if (disabled) return
          event.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragOver(false)
          upload(event.dataTransfer?.files?.[0])
        }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={alt ?? c.imagePreview} className="size-full object-cover" />
        ) : (
          <button
            type="button"
            id={id ?? field?.id}
            onClick={pick}
            disabled={disabled || uploading}
            aria-describedby={field?.describedBy}
            className="flex size-full flex-col items-center justify-center gap-1.5 p-3 text-center text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus size={shape === 'circle' ? 22 : 26} aria-hidden="true" />
            {shape !== 'circle' ? <span className="text-[13px] font-medium">{c.dropOrClick}</span> : <span className="sr-only">{c.uploadImage}</span>}
          </button>
        )}

        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-deep/75 text-accent-lighter" role="status">
            <Spinner size={24} />
            <span className="text-xs font-medium">{c.uploading}</span>
          </div>
        ) : null}
      </div>

      {previewUrl && !disabled ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={RefreshCw} onClick={pick} disabled={uploading} id={id ?? field?.id}>
            {c.replaceImage}
          </Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => onChange?.(null)} disabled={uploading}>
            {c.removeImage}
          </Button>
        </div>
      ) : null}

      {!previewUrl && shape !== 'circle' ? <p className="mt-1.5 text-xs text-muted">{c.imageHint(maxSizeMB)}</p> : null}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
