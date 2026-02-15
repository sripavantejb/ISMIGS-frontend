import Header from '../components/Header'
import Hero from '../components/Hero'
import TrustBadges from '../components/TrustBadges'
import AnalysisGrid from '../components/AnalysisGrid'
import BuiltOnTrust from '../components/BuiltOnTrust'
import ImpactShowcase from '../components/ImpactShowcase'
import DisclosureFlowSection from '../components/DisclosureFlowSection'
import SubscribeSection from '../components/SubscribeSection'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="h-screen flex flex-col">
          <div className="flex-1 min-h-0">
            <Hero />
          </div>
          <TrustBadges />
        </div>
        <AnalysisGrid />
        <BuiltOnTrust />
        <DisclosureFlowSection />
        <ImpactShowcase />
        <SubscribeSection />
        <Footer />
      </main>
    </div>
  )
}
