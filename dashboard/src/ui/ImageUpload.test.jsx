import { fireEvent, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { mockApi, reply, validationError } from '@/test/mockApi'
import { renderWithProviders } from '@/test/renderWithProviders'
import { Field } from './Field'
import { ImageUpload } from './ImageUpload'

const png = (name = 'logo.png', size = 10) => new File([new Uint8Array(size)], name, { type: 'image/png' })
const uploaded = { path: 'partners/logo.png', url: 'http://localhost/media/partners/logo.png' }

function Harness({ initial = null, url, onChange, onUploadingChange, folder = 'partners', ...props }) {
  const [value, setValue] = useState(initial)
  return (
    <ImageUpload
      folder={folder}
      value={value}
      url={url}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
      onUploadingChange={onUploadingChange}
      {...props}
    />
  )
}

describe('ImageUpload', () => {
  it('shows the empty drop zone with the size hint', () => {
    renderWithProviders(<Harness />)
    expect(screen.getByRole('button', { name: /Drop an image here or click to choose/ })).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG, WEBP or GIF — up to 5 MB')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('uploads the chosen file to the folder, previews the returned url and reports the path', async () => {
    const server = mockApi({ 'POST /uploads': () => reply(201, { data: uploaded }) })
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByRole('img', { name: 'Image preview' })).toHaveAttribute('src', uploaded.url)
    expect(onChange).toHaveBeenCalledWith('partners/logo.png')
    const body = server.calls('POST', '/uploads')[0].body
    expect(body.get('folder')).toBe('partners')
    expect(body.get('file').name).toBe('logo.png')
  })

  it('shows an uploading state and blocks the form meanwhile (onUploadingChange)', async () => {
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    mockApi({
      'POST /uploads': async () => {
        await gate
        return reply(201, { data: uploaded })
      },
    })
    const onUploadingChange = vi.fn()
    const { user } = renderWithProviders(<Harness onUploadingChange={onUploadingChange} />)

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByText('Uploading…')).toBeInTheDocument()
    expect(onUploadingChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByRole('button', { name: /Drop an image here/ })).toBeDisabled()

    release()
    await screen.findByRole('img')
    expect(screen.queryByText('Uploading…')).not.toBeInTheDocument()
    expect(onUploadingChange).toHaveBeenLastCalledWith(false)
  })

  it('shows the server validation message when the upload is rejected (422)', async () => {
    mockApi({ 'POST /uploads': () => validationError({ file: ['The file must be a valid image.'] }) })
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness onChange={onChange} />)

    await user.upload(screen.getByTestId('image-input'), png())

    expect(await screen.findByRole('alert')).toHaveTextContent('The file must be a valid image.')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a localized message for network / server failures and lets the user retry', async () => {
    const server = mockApi({ 'POST /uploads': () => reply(500, { message: 'internal' }) })
    const { user } = renderWithProviders(<Harness />)

    await user.upload(screen.getByTestId('image-input'), png())
    expect(await screen.findByRole('alert')).toHaveTextContent('Server error. Please try again later.')

    server.on('POST /uploads', () => reply(201, { data: uploaded }))
    await user.upload(screen.getByTestId('image-input'), png())
    expect(await screen.findByRole('img')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rejects wrong types and oversize files before uploading', async () => {
    const server = mockApi({})
    renderWithProviders(<Harness />)
    const input = screen.getByTestId('image-input')

    fireEvent.change(input, { target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported file type')

    fireEvent.change(input, { target: { files: [png('big.png', 6 * 1024 * 1024)] } })
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('larger than 5 MB'))
    expect(server.requests).toHaveLength(0)
  })

  it('previews an existing record image (path + url) and can replace or remove it', async () => {
    const server = mockApi({ 'POST /uploads': () => reply(201, { data: { path: 'partners/new.png', url: 'http://localhost/media/partners/new.png' } }) })
    const onChange = vi.fn()
    const { user } = renderWithProviders(<Harness initial="partners/old.png" url="http://localhost/media/partners/old.png" onChange={onChange} />)

    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://localhost/media/partners/old.png')

    await user.upload(screen.getByTestId('image-input'), png('new.png'))
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'http://localhost/media/partners/new.png'))
    expect(onChange).toHaveBeenLastCalledWith('partners/new.png')
    expect(server.calls('POST', '/uploads')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Drop an image here/ })).toBeInTheDocument()
  })

  it('accepts a dropped file', async () => {
    mockApi({ 'POST /uploads': () => reply(201, { data: uploaded }) })
    const onChange = vi.fn()
    renderWithProviders(<Harness onChange={onChange} />)

    fireEvent.drop(screen.getByRole('button', { name: /Drop an image here/ }).parentElement, { dataTransfer: { files: [png()] } })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('partners/logo.png'))
  })

  it('is read-only when disabled', () => {
    renderWithProviders(<Harness initial="partners/old.png" url="http://x/old.png" disabled />)
    expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replace' })).not.toBeInTheDocument()
  })

  it('picks up the id and error state from <Field>', () => {
    renderWithProviders(
      <Field label="Logo" error="Required">
        <Harness />
      </Field>,
    )
    expect(screen.getByLabelText('Logo')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
  })
})
