import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import BlueprintCanvas from "./components/BlueprintCanvas";

export default function Home() {
  return (
    <main>
      <BlueprintCanvas />
      <div style={{ position: "relative", zIndex: 1 }}>
        <Navbar />
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <CTA />
        <Footer />
      </div>
    </main>
  );
}
