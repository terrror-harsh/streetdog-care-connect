import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DogAssessment {
  isDog: boolean;
  breed: string;
  estimatedAge: string;
  bodyCondition: string;
  visibleInjuries: string[];
  healthConcerns: string[];
  suggestedCategory: string;
  suggestedSeverity: string;
  description: string;
  confidence: number;
}

export function useAIDogAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<DogAssessment | null>(null);

  const analyzePhoto = useCallback(async (file: File): Promise<DogAssessment | null> => {
    setAnalyzing(true);
    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("analyze-dog", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (!data.isDog) {
        toast.warning("No dog detected in the image. Please upload a photo of a dog.");
        setAnalyzing(false);
        return null;
      }

      setAssessment(data);
      toast.success(`AI detected a ${data.breed} — ${data.description}`);
      return data as DogAssessment;
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("AI analysis failed. You can still submit manually.");
      return null;
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const clearAssessment = useCallback(() => setAssessment(null), []);

  return { analyzing, assessment, analyzePhoto, clearAssessment };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
