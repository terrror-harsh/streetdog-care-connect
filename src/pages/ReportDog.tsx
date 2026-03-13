import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Camera, MapPin, AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";

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

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const getLocation = () => {
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGettingLocation(false);
        toast.success("Location captured!");
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
          <p className="text-muted-foreground mb-8">Help us locate and rescue dogs in need.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo */}
            <div>
              <Label className="text-sm font-medium">Dog Photo</Label>
              <div className="mt-2">
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Dog preview" className="w-full h-64 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 bg-background/80 rounded-full p-2 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 glass rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload photo</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <Label className="text-sm font-medium">Location</Label>
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
                <p className="text-xs text-accent mt-1">📍 GPS: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
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
              disabled={loading}
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
