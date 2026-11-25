import Hero from '../components/Hero.jsx'
import ServiceStrip from '../components/ServiceStrip.jsx'
import WorksCarousel from '../components/WorksCarousel.jsx'
import Contacts from '../components/Contacts.jsx'

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceStrip />
      <WorksCarousel />
      <Contacts />
    </>
  )
}
