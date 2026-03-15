import { useEffect, useState } from "react";

interface WaveformVisualizerProps {
  isActive?: boolean;
  barCount?: number;
}

const WaveformVisualizer = ({ isActive = false, barCount = 40 }: WaveformVisualizerProps) => {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial random heights
    const initial = Array.from({ length: barCount }, () => Math.random() * 0.6 + 0.2);
    setHeights(initial);

    if (isActive) {
      const interval = setInterval(() => {
        setHeights(prev => prev.map(() => Math.random() * 0.6 + 0.2));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isActive, barCount]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-16 px-4">
      {heights.map((height, index) => (
        <div
          key={index}
          className="w-1 bg-gradient-warm rounded-full transition-all duration-150 ease-out"
          style={{
            height: `${isActive ? height * 100 : 30}%`,
            opacity: isActive ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
