import { useEffect } from 'react'

function setMetaByName(name, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaByProp(property, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function PageTitle({ title, description }) {
  useEffect(() => {
    const full = title ? `${title} — NGP TechWorld` : 'NGP TechWorld'
    document.title = full
    setMetaByProp('og:title', full)
  }, [title])

  useEffect(() => {
    if (!description) return
    setMetaByName('description', description)
    setMetaByProp('og:description', description)
  }, [description])

  return null
}
