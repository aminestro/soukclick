import type { LucideIcon } from "lucide-react";

type ValueCardProps = {
  icon: LucideIcon;
  title: string;
  text: string;
};

export function ValueCard({ icon: Icon, title, text }: ValueCardProps) {
  return (
    <div className="rounded-card border bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-brand-red">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-gray-600">{text}</p>
    </div>
  );
}
