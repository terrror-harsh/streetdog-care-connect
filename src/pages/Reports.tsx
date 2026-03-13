import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, Stethoscope, Bone, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const categoryIcons: Record<string, any> = {
  injury: AlertTriangle,
  disease: Stethoscope,
  hunger: Bone,
  emergency: Zap,
};

const severityColors: Record<string, string> = {
  low: "bg-accent/10 text-accent",
  medium: "bg-warning/10 text-warning",
  high: "bg-primary/10 text-primary",
  critical: "bg-destructive/10 text-destructive",
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  under_treatment: "bg-accent/10 text-accent",
  rescued: "bg-success/10 text-success",
  completed: "bg-success/10 text-success",
};

const Reports = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchReports = async () => {
      let query = supabase.from("dog_reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("category", filter);
      const { data } = await query;
      setReports(data || []);
      setLoading(false);
    };
    fetchReports();
  }, [filter]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Dog Reports</h1>
          <p className="text-muted-foreground mb-8">All reported cases from the community.</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {["all", "injury", "disease", "hunger", "emergency"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl h-72 animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No reports found. Be the first to report!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report, i) => {
                const Icon = categoryIcons[report.category] || AlertTriangle;
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="glass rounded-xl overflow-hidden"
                  >
                    {report.photo_url && (
                      <img src={report.photo_url} alt="Reported dog" className="w-full h-48 object-cover" />
                    )}
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium capitalize">{report.category}</span>
                        </div>
                        <Badge variant="secondary" className={statusColors[report.status || "pending"]}>
                          {(report.status || "pending").replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2 mb-3">{report.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {report.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {report.address}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {report.severity && (
                        <div className="mt-3">
                          <Badge variant="secondary" className={severityColors[report.severity]}>
                            {report.severity} severity
                          </Badge>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Reports;
