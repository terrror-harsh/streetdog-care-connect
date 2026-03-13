import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Clock, CheckCircle, AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const VolunteerDashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [myCases, setMyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (role !== "volunteer" && role !== "admin") { navigate("/"); return; }
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: pendingReports }, { data: cases }] = await Promise.all([
      supabase.from("dog_reports").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("rescue_cases").select("*, dog_reports(*)").eq("volunteer_id", user.id).order("created_at", { ascending: false }),
    ]);
    setReports(pendingReports || []);
    setMyCases(cases || []);
    setLoading(false);
  };

  const acceptCase = async (reportId: string) => {
    if (!user) return;
    try {
      const { error: caseError } = await supabase.from("rescue_cases").insert({
        report_id: reportId,
        volunteer_id: user.id,
        status: "accepted",
      });
      if (caseError) throw caseError;

      const { error: updateError } = await supabase.from("dog_reports")
        .update({ status: "in_progress", assigned_volunteer_id: user.id })
        .eq("id", reportId);
      if (updateError) throw updateError;

      toast.success("Case accepted!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateCaseStatus = async (caseId: string, reportId: string, newStatus: string) => {
    try {
      await supabase.from("rescue_cases").update({ status: newStatus }).eq("id", caseId);
      const reportStatus = newStatus === "completed" ? "completed" : newStatus === "under_treatment" ? "under_treatment" : "in_progress";
      await supabase.from("dog_reports").update({ status: reportStatus }).eq("id", reportId);
      toast.success("Status updated!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statCards = [
    { label: "Active Cases", value: myCases.filter((c) => c.status !== "completed").length, icon: Activity, color: "text-primary" },
    { label: "Completed", value: myCases.filter((c) => c.status === "completed").length, icon: CheckCircle, color: "text-accent" },
    { label: "Pending Reports", value: reports.length, icon: Clock, color: "text-warning" },
  ];

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Volunteer Dashboard</h1>
          <p className="text-muted-foreground mb-8">Manage your rescue cases and accept new ones.</p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {statCards.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-5 flex items-center gap-4">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <div className="font-display text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending reports */}
          <h2 className="font-display text-xl font-semibold mb-4">Pending Reports</h2>
          {reports.length === 0 ? (
            <p className="text-muted-foreground mb-10">No pending reports right now. 🎉</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              {reports.map((report) => (
                <motion.div key={report.id} whileHover={{ y: -2 }} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="secondary" className="capitalize mb-2">{report.category}</Badge>
                      <p className="text-sm line-clamp-2">{report.description}</p>
                    </div>
                    {report.photo_url && (
                      <img src={report.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover ml-3" />
                    )}
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => acceptCase(report.id)}>
                    Accept Case
                  </Button>
                </motion.div>
              ))}
            </div>
          )}

          {/* My cases */}
          <h2 className="font-display text-xl font-semibold mb-4">My Cases</h2>
          {myCases.length === 0 ? (
            <p className="text-muted-foreground">You haven't accepted any cases yet.</p>
          ) : (
            <div className="space-y-4">
              {myCases.map((c) => (
                <div key={c.id} className="glass rounded-xl p-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <Badge variant="secondary" className="capitalize mb-1">{c.dog_reports?.category}</Badge>
                      <p className="text-sm">{c.dog_reports?.description}</p>
                    </div>
                    <Select value={c.status || "accepted"} onValueChange={(val) => updateCaseStatus(c.id, c.report_id, val)}>
                      <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="under_treatment">Under Treatment</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
