import HseTopbar from './components/Topbar.jsx';
import HeroSectionV2 from './pages/HeroSection.jsx';
import AboutSection from './pages/About.jsx';
import ProgramSection from './pages/Program.jsx';
import PolicySection from './pages/Policy.jsx';
import FacilityHSESection from './pages/HSE.jsx';
import FacilityCCTVSection from './pages/CCTV.jsx';
import FacilityFireSection from './pages/FacilityFire.jsx';
import FacilityHealthSection from './pages/Paramedis.jsx';
import StatsSection from './pages/Stats.jsx';
import OrgStructureSection from './pages/Structure.jsx';
import TeamCarouselSection from './pages/Team.jsx';
import ContactSection from './pages/Contact.jsx';
import Footer from './pages/Footer.jsx';

function LandingMain() {
  return (
    <>
      <HseTopbar />
      <HeroSectionV2 />
      <AboutSection />
      <ProgramSection />
      <PolicySection />
      <FacilityHSESection />
      <FacilityCCTVSection />
      <FacilityFireSection />
      <FacilityHealthSection />
      <StatsSection />
      <OrgStructureSection />
      <TeamCarouselSection />
      <ContactSection />
      <Footer />
    </>
  );
}

export default LandingMain;
