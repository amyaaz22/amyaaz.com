import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Work from '@/components/Work'
import Services from '@/components/Services'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="bg-dark-950 min-h-screen">
      <Header />
      <Hero />
      <Work />
      <Services />
      <Footer />
    </main>
  )
}
