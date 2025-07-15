import { BrandLogo } from "./brand-logo";

interface BrandCardProps {
  brand: string;
  onClick: () => void;
}

export function BrandCard({ brand, onClick }: BrandCardProps) {
  return (
    <button
      className="flex flex-col items-center justify-center border-2 rounded-[33px] bg-background shadow-sm p-3 sm:p-4 h-[120px] sm:h-[140px] md:h-[160px] transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
      onClick={onClick}
      type="button"
    >
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 mb-2 flex items-center justify-center">
        <BrandLogo brand={brand} />
      </div>
      <span
        className="text-center font-medium text-xs sm:text-sm w-full px-1 whitespace-normal break-words line-clamp-2"
        style={{ lineHeight: 1 }}
      >
        {brand}
      </span>
    </button>
  );
}
