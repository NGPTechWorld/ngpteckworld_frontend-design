import { toEmbedUrl } from './video'

const yt = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
const vimeo = 'https://player.vimeo.com/video/76979871'

test.each([
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', yt],
  ['https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s', yt],
  ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', yt],
  ['https://youtu.be/dQw4w9WgXcQ', yt],
  ['https://youtu.be/dQw4w9WgXcQ?si=abc123', yt],
  ['https://www.youtube.com/shorts/dQw4w9WgXcQ', yt],
  ['https://www.youtube.com/embed/dQw4w9WgXcQ', yt],
  ['https://vimeo.com/76979871', vimeo],
  ['https://vimeo.com/channels/staffpicks/76979871', vimeo],
  ['https://player.vimeo.com/video/76979871', vimeo],
])('embeds %s', (input, expected) => {
  expect(toEmbedUrl(input)).toBe(expected)
})

test.each([
  [''],
  [null],
  [undefined],
  ['not a url'],
  ['javascript:alert(1)'],
  ['https://example.com/video.mp4'],
  ['https://www.youtube.com/watch'],
  ['https://www.youtube.com/watch?v=<script>'],
  ['https://vimeo.com/about'],
])('returns null for %s', (input) => {
  expect(toEmbedUrl(input)).toBeNull()
})
