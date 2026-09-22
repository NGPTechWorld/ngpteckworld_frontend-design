import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, reply } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { GalleryUpload, galleryPaths, toGalleryItems } from './GalleryUpload'

const png = (name) => new File([new Uint8Array(10)], name, { type: 'image/png' })
const answer = ({ body }) => {
  const name = body.get('file').name
  return reply(201, { data: { path: `projects/gallery/${name}`, url: `http://localhost/media/projects/gallery/${name}` } })
}

function Harness({ initial = [], onChange, max, onUploadingChange }) {
  const [items, setItems] = useState(initial)
  return (
    <GalleryUpload
      folder="projects/gallery"
      value={items}
      max={max}
      onUploadingChange={onUploadingChange}
      onChange={(next) => {
        setItems(next)
        onChange?.(next)
      }}
    />
  )
}

describe('toGalleryItems / galleryPaths', () => {
  it('pairs paths with urls and back', () => {
    const items = toGalleryItems(['a.png', 'b.png'], ['http://x/a.png', 'http://x/b.png'])
    expect(items).toEqual([{ path: 'a.png', url: 'http://x/a.png' }, { path: 'b.png', url: 'http://x/b.png' }])
    expect(galleryPaths(items)).toEqual(['a.png', 'b.png'])
    expect(toGalleryItems(undefined, undefined)).toEqual([])
    expect(toGalleryItems(['a.png'], [])).toEqual([{ path: 'a.png', url: null }])
  })
})

describe('GalleryUpload', () => {
  it('renders the existing images and an add tile', () => {
    const { container } = renderWithProviders(<Harness initial={toGalleryItems(['a.png', 'b.png'], ['http://x/a.png', 'http://x/b.png'])} />)
    expect(container.querySelectorAll('img')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Remove image' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Drag to reorder' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Upload images' })).toBeInTheDocument()
  })

  it('uploads several files one after another and appends them in order', async () => {
    const server = mockApi({ 'POST /uploads': answer })
    const onChange = vi.fn()
    const { user, container } = renderWithProviders(<Harness onChange={onChange} />)

    await user.upload(screen.getByTestId('gallery-input'), [png('one.png'), png('two.png')])

    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(2))
    expect(onChange).toHaveBeenLastCalledWith([
      { path: 'projects/gallery/one.png', url: 'http://localhost/media/projects/gallery/one.png' },
      { path: 'projects/gallery/two.png', url: 'http://localhost/media/projects/gallery/two.png' },
    ])
    expect(server.calls('POST', '/uploads').map((call) => call.body.get('folder'))).toEqual(['projects/gallery', 'projects/gallery'])
    expect(screen.queryByText('one.png')).not.toBeInTheDocument() // no leftover progress tile
  })

  it('shows one progress tile per file while uploading and reports the busy state', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /uploads': async (req) => {
        await gate
        return answer(req)
      },
    })
    const onUploadingChange = vi.fn()
    const { user } = renderWithProviders(<Harness onUploadingChange={onUploadingChange} />)

    await user.upload(screen.getByTestId('gallery-input'), [png('slow.png')])

    expect(await screen.findByText('slow.png')).toBeInTheDocument() // the progress tile shows the file name
    expect(onUploadingChange).toHaveBeenLastCalledWith(true)

    release()
    await waitFor(() => expect(screen.queryByText('slow.png')).not.toBeInTheDocument())
    expect(onUploadingChange).toHaveBeenLastCalledWith(false)
  })

  it('keeps a failed file as an error tile that can be retried or dismissed', async () => {
    const server = mockApi({ 'POST /uploads': () => reply(500, { message: 'boom' }) })
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.upload(screen.getByTestId('gallery-input'), [png('bad.png')])
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error')
    expect(onChange).not.toHaveBeenCalled()

    server.on('POST /uploads', answer)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('dismisses an error tile', async () => {
    mockApi({ 'POST /uploads': () => reply(500, {}) })
    const { user } = renderWithProviders(<Harness />)
    await user.upload(screen.getByTestId('gallery-input'), [png('bad.png')])
    await screen.findByRole('alert')

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rejects files of the wrong type without calling the API', async () => {
    const server = mockApi({})
    renderWithProviders(<Harness />)

    fireEvent.change(screen.getByTestId('gallery-input'), { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')
    expect(server.requests).toHaveLength(0)
  })

  it('removes an image', async () => {
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial={toGalleryItems(['a.png', 'b.png'], ['http://x/a.png', 'http://x/b.png'])} onChange={onChange} />)

    await user.click(screen.getAllByRole('button', { name: 'Remove image' })[0])

    expect(onChange).toHaveBeenLastCalledWith([{ path: 'b.png', url: 'http://x/b.png' }])
  })

  it('respects max: no add tile when full, extra files are refused', async () => {
    const server = mockApi({ 'POST /uploads': answer })
    const { user, rerender } = renderWithProviders(<Harness initial={toGalleryItems(['a.png'], ['http://x/a.png'])} max={2} />)

    await user.upload(screen.getByTestId('gallery-input'), [png('b.png'), png('c.png')])

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Remove image' })).toHaveLength(2))
    expect(server.calls('POST', '/uploads')).toHaveLength(1)
    expect(screen.getAllByText('At most 2 images.').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Upload images' })).not.toBeInTheDocument()
    rerender(<Harness initial={[]} max={2} />)
  })

  it('accepts dropped files', async () => {
    mockApi({ 'POST /uploads': answer })
    const onChange = vi.fn()
    const { container } = renderWithProviders(<Harness onChange={onChange} />)

    fireEvent.drop(container.firstChild, { dataTransfer: { files: [png('dropped.png')] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))
    expect(onChange.mock.calls[0][0][0].path).toBe('projects/gallery/dropped.png')
  })
})
