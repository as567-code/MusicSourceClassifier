import { useCallback, useState } from "react";

import HowItWorks from "@/components/home/HowItWorks";
import TrustSection from "@/components/home/TrustSection";
import UploadHero from "@/components/home/UploadHero";
import {
  loadSampleTrackFile,
  type SampleTrack,
} from "@/data/sampleTracks";
import { useToast } from "@/hooks/use-toast";
import { setPendingAnalysisFile } from "@/lib/pending-analysis-file";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    setIsProcessing(false);
    setActiveSampleId(null);

    toast({
      title: "Track loaded",
      description: "Opening the analysis chamber for a staged listening pass.",
    });

    setPendingAnalysisFile(file);
    navigate("/analyze");
  }, [toast, navigate]);

  const handleSampleSelect = useCallback(async (track: SampleTrack) => {
    setActiveSampleId(track.id);
    setIsProcessing(true);

    try {
      const file = await loadSampleTrackFile(track);
      handleFileSelect(file);
    } catch (error) {
      console.error("Error loading sample track:", error);
      setActiveSampleId(null);
      toast({
        variant: "destructive",
        title: "Sample unavailable",
        description: "We couldn't load that demo clip. Try another sample or upload your own track.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [handleFileSelect, toast]);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <main className="mx-auto flex max-w-7xl flex-col gap-8 md:gap-10">
        <UploadHero
          onFileSelect={handleFileSelect}
          onSampleSelect={handleSampleSelect}
          isProcessing={isProcessing}
          uploadedFile={uploadedFile}
          activeTrackId={activeSampleId}
        />
        <HowItWorks />
        <TrustSection />
      </main>
    </div>
  );
};

export default Index;
