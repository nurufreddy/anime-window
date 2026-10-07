export default function SectionLabel({ children, className = "" }: { children: string; className?: string }) {
  return <p className={`label ${className}`}>{children}</p>;
}
