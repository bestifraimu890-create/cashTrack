import { ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "../../lib/constants.js";

export function CategoryIcon({ category, size = 18, className = "" }) {
  const meta = CATEGORIES[category];
  if (!meta) return <ArrowUpRight size={size} className={className} />;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full ${className}`}
      style={{ background: `${meta.color}1A`, color: meta.color, width: size + 18, height: size + 18 }}
    >
      <Icon size={size} />
    </span>
  );
}
