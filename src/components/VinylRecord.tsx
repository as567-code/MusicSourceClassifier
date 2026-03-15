import { cn } from "@/lib/utils";

interface VinylRecordProps {
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const VinylRecord = ({ isPlaying = false, size = "md", className }: VinylRecordProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  const centerDotClasses = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <div
      className={cn(
        "relative rounded-full bg-gradient-vinyl shadow-vinyl",
        sizeClasses[size],
        isPlaying && "animate-spin-slow",
        className
      )}
    >
      {/* Vinyl grooves */}
      <div className="absolute inset-2 rounded-full vinyl-grooves opacity-60" />
      
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/3 h-1/3 rounded-full bg-gradient-warm flex items-center justify-center">
          <div className={cn("rounded-full bg-vinyl-black", centerDotClasses[size])} />
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent" />
    </div>
  );
};

export default VinylRecord;
