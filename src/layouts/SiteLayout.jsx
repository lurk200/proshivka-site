import { Outlet } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import BottomNav from '../components/BottomNav.jsx'
import WriteFab from '../components/WriteFab.jsx'

export default function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="relative flex-1 pb-24 md:pb-8">
        <Outlet />
      </main>
      <Footer />
      <WriteFab />
      <BottomNav />
    </div>
  )
}
