import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useLang } from '../i18n/LanguageContext'
import SectionHeader from '../components/SectionHeader'
import ServiceCard from '../components/ServiceCard'
import PageTitle from '../components/PageTitle'

export default function Services() {
  const { t } = useLang()
  const [services, setServices] = useState([])
  useEffect(() => { api.getServices().then(setServices).catch(() => {}) }, [])

  return (
    <div className="view-enter mx-auto max-w-site px-[26px] pb-[90px] pt-[70px]">
      <PageTitle title={t.servicesTitle} />
      <SectionHeader as="h1" kicker={t.servicesKick} title={t.servicesTitle} sub={t.servicesSub} />
      <div data-grid3 className="grid gap-[18px]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {services.map((s) => <ServiceCard key={s.id} service={s} />)}
      </div>
    </div>
  )
}
