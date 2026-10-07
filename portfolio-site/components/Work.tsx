import ProjectSlider from "@/components/ProjectSlider";
import SectionLabel from "@/components/ui/SectionLabel";
import { work } from "@/lib/content";

/**
 * Dark sticky panel that slides up over the hero. The <ScrollHold />
 * after it in page.tsx keeps this panel pinned for one extra viewport.
 */
export default function Work() {
  return (
    <section
      id="work"
      className="sticky top-0 z-[2] flex h-svh min-h-[600px] flex-col justify-between overflow-clip bg-night pb-10 pt-24 text-paper md:min-h-[640px] lg:min-h-[720px] lg:pb-14 lg:pt-28"
    >
      <header className="gutter site-grid label gap-y-2">
        <SectionLabel className="col-span-2 md:col-span-4 lg:col-span-6">{work.label}</SectionLabel>
        <p className="col-span-2 text-right md:col-span-2 md:text-left lg:col-span-3">{work.range}</p>
        <p className="col-span-4 text-paper-50 md:col-span-2 md:text-right lg:col-span-3">{work.dragHint}</p>
      </header>

      <ProjectSlider projects={work.projects} />
    </section>
  );
}
