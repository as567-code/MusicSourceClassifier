import { useState, useCallback } from "react";
import { Upload, Music, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import WaveformVisualizer from "./WaveformVisualizer";

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  uploadedFile: File | null;
}

const DropZone = ({ onFileSelect, isProcessing, uploadedFile }: DropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const validExtensions = ['.wav', '.mp3', '.flac', '.ogg'];
      const isValidFile = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      if (isValidFile) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative w-full max-w-sm mx-auto cursor-pointer",
        isProcessing && "animate-pulse-glow"
      )}
    >
      <label className="block cursor-pointer">
        <input
          type="file"
          accept=".wav,.mp3,.flac,.ogg,audio/wav,audio/mpeg,audio/flac,audio/ogg"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        {/* Turntable Base */}
        <div className={cn(
          "relative bg-secondary rounded-2xl p-6 transition-all duration-300 shadow-vinyl",
          isDragging && "scale-[1.02]"
        )}>
          
          {/* Main platter area - centered */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className={cn(
                "w-44 h-44 rounded-full bg-muted border-4 border-border flex items-center justify-center transition-all duration-300",
                isDragging && "border-primary"
              )}>
                <div className={cn(
                  "w-36 h-36 rounded-full bg-vinyl-black vinyl-grooves flex items-center justify-center transition-transform duration-500",
                  (isProcessing || uploadedFile) && "animate-spin-slow"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    uploadedFile && !isProcessing
                      ? "bg-primary"
                      : "bg-glow-amber"
                  )}>
                    {uploadedFile && !isProcessing ? (
                      <Check className="w-6 h-6 text-primary-foreground" />
                    ) : isProcessing ? (
                      <Music className="w-6 h-6 text-foreground" />
                    ) : (
                      <Upload className="w-6 h-6 text-foreground" />
                    )}
                  </div>
                </div>
              </div>
              
              
              {/* Tonearm */}
              <div className="absolute -right-8 top-2">
                <div className="w-6 h-6 rounded-full bg-border" />
                <div className={cn(
                  "absolute left-3 top-3 w-1.5 h-16 bg-muted-foreground rounded-full origin-top transition-transform duration-500",
                  (isProcessing || uploadedFile) ? "rotate-[45deg]" : "rotate-[0deg]"
                )} />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex justify-center gap-3 mt-4">
              <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-muted" />
              </div>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                isProcessing ? "bg-primary" : "bg-border"
              )}>
                <div className={cn(
                  "w-3 h-3 rounded-full transition-colors",
                  isProcessing ? "bg-primary-foreground" : "bg-muted"
                )} />
              </div>
              <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-muted" />
              </div>
            </div>

            {/* File name display */}
            {uploadedFile && (
              <p className="text-xs text-muted-foreground mt-2 truncate max-w-[180px]">
                {uploadedFile.name}
              </p>
            )}

            {/* Waveform */}
            {(isProcessing || uploadedFile) && (
              <div className="w-full mt-3">
                <WaveformVisualizer isActive={isProcessing} />
              </div>
            )}
          </div>
        </div>
      </label>
    </div>
  );
};

export default DropZone;
