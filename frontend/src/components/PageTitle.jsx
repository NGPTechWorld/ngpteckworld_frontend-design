import { useEffect } from 'react'

export default function PageTitle({ title }) {
  useEffect(() => {
    document.title = title ? `${title} — NGP TechWorld` : 'NGP TechWorld'
  }, [title])
  return null
}
