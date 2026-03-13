import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, FileText, Activity, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(25,95%,53%)", "hsl(160,60%,45%)", "hsl(45,93%,47%)", "hsl(0,84%,60%)"];

const AdminPanel = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (role !== "admin") { navigate("/"); return; }
    fetchData();
  }, [user, role]);

  const fetchData = async () => {
    const [{ data: reportsData }, { data: usersData }] = await Promise.all([
      supabase.from("dog_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*, user_roles(role)"),
    ]);
    setReports(reportsData || []);
    setUsers(usersData || []);
    setLoading(false);
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("dog_reports").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Report deleted");
    fetchData();
  };

  const categoryData = ["injury", "disease", "hunger", "emergency"].map((cat) => ({
    name: cat,
    value: reports.filter((r) => r.category === cat).length,
  }));

  const statusData = ["pending", "in_progress", "under_treatment", "rescued", "completed"].map((s) => ({
    name: s.replace("_", " "),
    count: reports.filter((r) => (r.status || "pending") === s).length,
  }));

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground mb-8">Manage reports, users, and view analytics.</p>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="glass rounded-xl p-5 flex items-center gap-4">
              <FileText className="h-8 w-8 text-primary" />
              <div><div className="font-display text-2xl font-bold">{reports.length}</div><div className="text-sm text-muted-foreground">Total Reports</div></div>
            </div>
            <div className="glass rounded-xl p-5 flex items-center gap-4">
              <Users className="h-8 w-8 text-accent" />
              <div><div className="font-display text-2xl font-bold">{users.length}</div><div className="text-sm text-muted-foreground">Total Users</div></div>
            </div>
            <div className="glass rounded-xl p-5 flex items-center gap-4">
              <Activity className="h-8 w-8 text-warning" />
              <div><div className="font-display text-2xl font-bold">{reports.filter((r) => r.status === "completed").length}</div><div className="text-sm text-muted-foreground">Rescued</div></div>
            </div>
          </div>

          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4">Reports by Category</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4">Reports by Status</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={statusData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(25,95%,53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="capitalize">{report.category}</Badge>
                        <Badge variant="secondary">{report.status || "pending"}</Badge>
                      </div>
                      <p className="text-sm truncate">{report.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteReport(report.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-3">
                {users.map((u) => (
                  <div key={u.id} className="glass rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{u.full_name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{u.phone || "No phone"}</p>
                    </div>
                    <div className="flex gap-2">
                      {(u.user_roles as any[])?.map((r: any) => (
                        <Badge key={r.role} variant="secondary" className="capitalize">{r.role}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
