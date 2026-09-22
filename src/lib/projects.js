/** Projects flagged "featured" in the dashboard come first; if none are flagged, show the first `limit`. */
export function pickFeatured(projects, limit = 3) {
  const flagged = projects.filter((p) => p.featured)
  return (flagged.length ? flagged : projects).slice(0, limit)
}
