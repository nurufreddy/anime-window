"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/content";

/**
 * Horizontal drag-to-explore rail with inertia (Framer Motion drag).
 * Cards stagger in the first time the rail is visible. Clicks are
 * suppressed right after a drag so dragging never opens a project.
 */
export default function ProjectSlider({ projects }: { projects: Project[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(0);
  const dragging = useRef(false);
  const inView = useInView(viewport, { once: true, amount: 0.3 });

  useEffect(() => {
    const measure = () => {
      if (!viewport.current || !track.current) return;
      setLimit(Math.min(0, viewport.current.offsetWidth - track.current.scrollWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={viewport} className="gutter relative w-full cursor-grab overflow-hidden active:cursor-grabbing">
      <motion.div
        ref={track}
        className="flex w-max gap-2"
        drag="x"
        dragConstraints={{ left: limit, right: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.3, timeConstant: 300 }}
        onDragStart={() => (dragging.current = true)}
        onDragEnd={() => setTimeout(() => (dragging.current = false), 0)}
        onClickCapture={(e) => dragging.current && e.preventDefault()}
      >
        {projects.map((p, i) => (
          <motion.div
            key={p.slug}
            initial={{ opacity: 0, x: 80 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProjectCard project={p} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
