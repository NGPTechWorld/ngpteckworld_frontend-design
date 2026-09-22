// Fixtures shared by the projects tests (not imported by the app).
const stamp = '2026-09-01T10:00:00.000000Z'

/** A row of GET /projects (counts, no nested arrays). */
export const makeProject = (id, over = {}) => ({
  id,
  slug: `project-${id}`,
  category: 'web',
  client: `Client ${id}`,
  year: 2024,
  status: 'completed',
  featured: false,
  name_ar: `مشروع ${id}`,
  name_en: `Project ${id}`,
  short_ar: `وصف قصير ${id}`,
  short_en: `Short ${id}`,
  description_ar: `وصف طويل ${id}`,
  description_en: `Long ${id}`,
  cover_image: null,
  cover_image_url: null,
  gallery: [],
  gallery_urls: [],
  video_url: null,
  order: id - 1,
  created_at: stamp,
  updated_at: stamp,
  team_members_count: 0,
  links_count: 0,
  ...over,
})

/** GET /projects/:id, POST and PUT answer with this shape: the row plus nested arrays. */
export const showProject = (id, over = {}) => {
  const team_members = over.team_members ?? []
  const links = over.links ?? []
  return makeProject(id, { team_members_count: team_members.length, links_count: links.length, ...over, team_members, links })
}

export const makeMember = (id, over = {}) => ({
  id,
  project_id: 7,
  name: `Member ${id}`,
  role_ar: `دور ${id}`,
  role_en: `Role ${id}`,
  tasks_ar: [],
  tasks_en: [],
  avatar: null,
  avatar_url: null,
  order: id - 1,
  created_at: stamp,
  updated_at: stamp,
  ...over,
})

export const makeLink = (id, over = {}) => ({
  id,
  project_id: 7,
  type: 'website',
  url: `https://example.com/${id}`,
  order: id - 1,
  created_at: stamp,
  updated_at: stamp,
  ...over,
})

/**
 * Types `text` into a field in one go (click to focus, then paste): far faster than user.type() key by key, which
 * matters for forms with a dozen fields when the whole suite runs in parallel. Use user.type() when key events matter.
 */
export async function enter(user, element, text) {
  await user.click(element)
  await user.paste(text)
}
