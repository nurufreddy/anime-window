import Image from "next/image";
import type { Project } from "@/lib/content";

/** One slide: image (grayscale until hover), title, category and year. */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <a
      href={`/work/${project.slug}`}
      draggable={false}
      className="group flex w-[260px] shrink-0 flex-col gap-2 md:w-[300px] lg:w-[330px]"
    >
      <div className="relative h-[180px] w-full overflow-hidden md:h-[200px] lg:h-[220px]">
        <Image
          src={project.image}
          alt={project.title}
          fill
          draggable={false}
          sizes="330px"
          className="object-cover grayscale transition-[filter,scale] duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04] group-hover:grayscale-0"
        />
      </div>
      <h3 className="text-[19px] leading-tight tracking-[-0.02em] lg:text-[22px]">{project.title}</h3>
      <div className="label flex justify-between text-paper-50">
        <p>{project.category}</p>
        <p>{project.year}</p>
      </div>
    </a>
  );
}
