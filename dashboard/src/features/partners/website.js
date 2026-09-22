/** Only http(s) addresses are turned into links: data saved before the API validated URLs may hold anything. */
export const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())

/** "https://www.acme.example/about/" → "www.acme.example/about" (what people recognise in a table cell). */
export const displayUrl = (value) =>
  String(value ?? '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
