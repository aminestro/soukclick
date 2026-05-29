type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
};

export function SectionHeader({ eyebrow, title, description, align = "start" }: SectionHeaderProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow ? <p className="text-sm font-bold text-brand-red">{eyebrow}</p> : null}
      <h2 className="mt-2 text-2xl font-black leading-[1.35] text-brand-black md:text-4xl">{title}</h2>
      {description ? <p className="mt-3 text-base leading-8 text-gray-600">{description}</p> : null}
    </div>
  );
}
