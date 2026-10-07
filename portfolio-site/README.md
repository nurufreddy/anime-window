# Inés Valverde — portfolio (Next.js rebuild)

Rebuild of the Framer site as React components. Next.js 16, Tailwind 4, GSAP, Framer Motion, Lenis.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## Where things live

- `lib/content.ts`: all copy, links and image paths. Edit content here only.
- `public/images/`: placeholder SVGs. Drop in your files and update paths in `lib/content.ts`.
- `app/page.tsx`: section order and scroll choreography.
- `components/`: one component per section, plus `components/ui/` primitives.

## Scroll choreography

Hero (sticky) → Work slides over it (sticky, dark) → ScrollHold pins Work for one more
viewport → About and Contact scroll over everything. Lenis drives scrolling through
GSAP's ticker so ScrollTrigger stays in sync (`components/SmoothScroll.tsx`).
