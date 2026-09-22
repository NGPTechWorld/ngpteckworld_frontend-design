import { useEffect, useRef, useState } from 'react'
import { ImagePlus, RefreshCw, Trash2, X } from 'lucide-react'
import { useCommon } from '@/i18n'
import { api } from '@/lib/api'
import { cx } from '@/lib/cx'
import { SortableList } from './SortableList'
import { Spinner } from './Spinner'
import { IMAGE_ACCEPT, MAX_IMAGE_MB, uploadErrorText, validateImage } from './upload'

/** API record (`gallery` paths + `gallery_urls`) → the items <GalleryUpload> works with. */
export const toGalleryItems = (paths = [], urls = []) => paths.map((path, index) => ({ path, url: urls[index] ?? null }))

/** Items → the array of paths to send to the API. */
export const galleryPaths = (items = []) => items.map((item) => item.path)

let pendingId = 1

const tileCls = 'relative aspect-square overflow-hidden rounded-xl border bg-white/[.03]'
const smallBtn =
  'inline-flex size-8 items-center justify-center rounded-lg bg-white/10 text-ink hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light'

/**
 * Multiple images with reordering (drag & drop or keyboard on the handle) and removal. Value is an array of
 * `{ path, url }` items — build it with toGalleryItems(record.gallery, record.gallery_urls) and send
 * galleryPaths(items) on save:
 *
 *   <Controller name="gallery" control={control} render={({ field }) => (
 *     <GalleryUpload folder="projects/gallery" value={field.value} onChange={field.onChange} />
 *   )} />
 *
 * Several files can be chosen or dropped at once; they upload one after another and each shows its own
 * progress / error (with retry) tile. `max` caps the count. onUploadingChange(bool) lets the form block Save.
 */
export function GalleryUpload({ value = [], onChange, folder, max = 20, disabled = false, invalid, maxSizeMB = MAX_IMAGE_MB, onUploadingChange, className }) {
  const c = useCommon()
  const inputRef = useRef(null)
  const mounted = useRef(true)
  const itemsRef = useRef(value)
  itemsRef.current = value
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [pending, setPending] = useState([]) // { key, file, status: 'uploading' | 'error', error }
  const [dragOver, setDragOver] = useState(false)
  const busy = pending.filter((entry) => entry.status === 'uploading').length

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    onUploadingChange?.(busy > 0)
  }, [busy, onUploadingChange])

  const patch = (key, next) => mounted.current && setPending((list) => list.map((entry) => (entry.key === key ? { ...entry, ...next } : entry)))
  const drop = (key) => mounted.current && setPending((list) => list.filter((entry) => entry.key !== key))

  const commit = (next) => {
    itemsRef.current = next
    onChangeRef.current?.(next)
  }

  const runUpload = async (key, file) => {
    try {
      const result = await api.upload(file, folder)
      commit([...itemsRef.current, { path: result.path, url: result.url }])
      drop(key)
    } catch (err) {
      patch(key, { status: 'error', error: uploadErrorText(err, c, maxSizeMB) })
    }
  }

  const addFiles = async (fileList) => {
    if (disabled) return
    let room = max - itemsRef.current.length - busy
    const queue = []
    for (const file of [...(fileList ?? [])]) {
      const key = pendingId++
      const problem = validateImage(file, maxSizeMB)
      if (problem) queue.push({ key, file, status: 'error', error: uploadErrorText(problem, c, maxSizeMB) })
      else if (room > 0) {
        room -= 1
        queue.push({ key, file, status: 'uploading' })
      } else queue.push({ key, file, status: 'error', error: c.galleryFull(max), final: true })
    }
    if (!queue.length) return
    setPending((list) => [...list, ...queue])
    for (const entry of queue) if (entry.status === 'uploading') await runUpload(entry.key, entry.file)
  }

  const retry = (entry) => {
    patch(entry.key, { status: 'uploading', error: '' })
    runUpload(entry.key, entry.file)
  }

  const full = value.length + busy >= max

  const trailing = (
    <>
      {pending.map((entry) => (
        <li key={`pending-${entry.key}`} className={cx(tileCls, 'list-none', entry.status === 'error' ? 'border-danger/50' : 'border-white/[.12]')}>
          {entry.status === 'uploading' ? (
            <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center text-accent-lighter" role="status">
              <Spinner size={22} />
              <span className="line-clamp-2 break-all text-[11px] text-muted">{entry.file.name}</span>
            </div>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 p-2 text-center">
              <p role="alert" className="line-clamp-3 text-[11px] font-medium text-danger">
                {entry.error}
              </p>
              <div className="flex gap-1">
                {!entry.final ? (
                  <button type="button" onClick={() => retry(entry)} aria-label={c.retry} title={c.retry} className={smallBtn}>
                    <RefreshCw size={14} aria-hidden="true" />
                  </button>
                ) : null}
                <button type="button" onClick={() => drop(entry.key)} aria-label={c.dismiss} title={c.dismiss} className={smallBtn}>
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
      {!full && !disabled ? (
        <li key="add" className="list-none">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[.2] p-2 text-center text-muted transition-colors hover:border-accent-light hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
          >
            <ImagePlus size={24} aria-hidden="true" />
            <span className="text-xs font-medium">{c.uploadImages}</span>
          </button>
        </li>
      ) : null}
    </>
  )

  return (
    <div
      className={cx('min-w-0 rounded-xl', dragOver && 'bg-accent/10 ring-2 ring-accent-light/50', invalid && 'ring-1 ring-danger/60', className)}
      onDragOver={(event) => {
        if (disabled) return
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragOver(false)
        addFiles(event.dataTransfer?.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        hidden
        tabIndex={-1}
        data-testid="gallery-input"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <SortableList
        layout="grid"
        items={value}
        getId={(item) => item.path}
        disabled={disabled}
        onReorder={commit}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
        trailing={trailing}
        renderItem={(item, { handle, isDragging }) => (
          <div className={cx(tileCls, isDragging ? 'border-accent-light' : 'border-white/[.12]')}>
            {item.url ? <img src={item.url} alt="" className="size-full object-cover" /> : <div className="size-full bg-white/[.05]" />}
            <span className="absolute start-1.5 top-1.5 rounded-lg bg-deep/75 backdrop-blur">{handle}</span>
            {!disabled ? (
              <button
                type="button"
                onClick={() => commit(itemsRef.current.filter((entry) => entry.path !== item.path))}
                aria-label={c.removeImage}
                title={c.removeImage}
                className="absolute end-1.5 top-1.5 inline-flex size-9 items-center justify-center rounded-lg bg-deep/75 text-danger backdrop-blur transition-colors hover:bg-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-light"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        )}
      />

      <p className="mt-2 text-xs text-muted">{full ? c.galleryFull(max) : `${c.dropOrClickMany} — ${c.imageHint(maxSizeMB)}`}</p>
    </div>
  )
}
