import About from "@/components/About";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import Nav from "@/components/Nav";
import ScrollHold from "@/components/ScrollHold";
import Work from "@/components/Work";

/**
 * Scroll choreography (same as the Framer site):
 * Hero (sticky) → Work slides over it (sticky) → ScrollHold keeps Work
 * pinned for a viewport → About and Contact scroll up over everything.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Work />
        <ScrollHold />
        <About />
        <Contact />
      </main>
    </>
  );
}
