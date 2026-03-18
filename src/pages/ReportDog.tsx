import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Camera, MapPin, Upload, Brain, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAIDogAnalysis } from "@/hooks/useAIDogAnalysis";
import AIAssessmentCard from "@/components/AIAssessmentCard";

const ReportDog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const { analyzing, assessment, analyzePhoto, clearAssessment } = useAIDogAnalysis();

  // Auto-fetch location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setGettingLocation(false);
        toast.success("Location detected automatically!");
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          const data = await res.json();
          if (data.display_name) {
            setAddress(data.display_name);
          }
        } catch { /* ignore geocoding errors */ }
      },
      () => {
        setGettingLocation(false);
      }
    );
  }, []);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      clearAssessment();
      // Auto-analyze with AI
      await analyzePhoto(file);
    }
  };

  const handleApplyAI = () => {
    if (!assessment) return;
    setCategory(assessment.suggestedCategory);
    setSeverity(assessment.suggestedSeverity);
    if (!description) {
      const parts = [assessment.description];
      if (assessment.visibleInjuries.length) parts.push(`Injuries: ${assessment.visibleInjuries.join(", ")}`);
      if (assessment.healthConcerns.length) parts.push(`Concerns: ${assessment.healthConcerns.join(", ")}`);
      setDescription(parts.join("\n"));
    }
    toast.success("AI suggestions applied!");
  };

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocation(coords);
        setGettingLocation(false);
        toast.success("Location captured!");
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`
          );
          const data = await res.json();
          if (data.display_name) setAddress(data.display_name);
        } catch { /* ignore */ }
      },
      () => {
        toast.error("Could not get location. Please enter address manually.");
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    setLoading(true);
    try {
      let photoUrl = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("dog-photos")
          .upload(path, photoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("dog-photos").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("dog_reports").insert({
        reporter_id: user.id,
        photo_url: photoUrl,
        latitude: location?.lat,
        longitude: location?.lng,
        address,
        description,
        category,
        severity,
      });

      if (error) throw error;
      toast.success("Report submitted successfully!");
      navigate("/reports");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Report a Street Dog</h1>
          <p className="text-muted-foreground mb-8">Upload a photo and our AI will help identify the dog's condition.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo + AI */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" /> AI Dog Scanner
              </Label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Dog preview" className="w-full h-64 object-cover" />
                    {analyzing && (
                      <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <span className="text-sm font-medium text-primary">AI is analyzing...</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); clearAssessment(); }}
                      className="absolute top-2 right-2 bg-background/80 rounded-full p-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 glass rounded-xl cursor-pointer hover:border-primary/50 transition-colors border-2 border-dashed border-muted-foreground/30">
                    <Camera className="h-10 w-10 text-primary mb-2" />
                    <span className="text-sm font-medium text-foreground">Take Photo or Upload</span>
                    <span className="text-xs text-muted-foreground mt-1">AI will auto-detect the dog's condition</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* AI Assessment */}
            {assessment && (
              <AIAssessmentCard assessment={assessment} onApply={handleApplyAI} />
            )}

            {/* Location - auto-fetched */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Location
                {gettingLocation && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </Label>
              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Enter address or area"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={getLocation} disabled={gettingLocation}>
                  <MapPin className="h-4 w-4 mr-1" />
                  {gettingLocation ? "..." : "GPS"}
                </Button>
              </div>
              {location && (
                <p className="text-xs text-primary mt-1">📍 GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              )}
            </div>

            {/* Category & Severity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="injury">🩹 Injury</SelectItem>
                    <SelectItem value="disease">🩺 Disease</SelectItem>
                    <SelectItem value="hunger">🍖 Hunger</SelectItem>
                    <SelectItem value="emergency">🚨 Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="desc" className="text-sm font-medium">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the dog's condition, behavior, and any visible injuries..."
                className="mt-1 min-h-[120px]"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading || analyzing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              size="lg"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ReportDog;
