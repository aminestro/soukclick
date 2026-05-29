import { siteConfig } from "@/config/site";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
        SC
      </div>
      <div className="text-right leading-tight">
        <div className="font-bold text-brand-black">{siteConfig.name}</div>
        <div className="text-xs text-gray-500">{siteConfig.arabicName}</div>
      </div>
    </div>
  );
}

