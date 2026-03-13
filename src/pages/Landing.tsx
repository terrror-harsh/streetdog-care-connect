import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, MapPin, Shield, Users, AlertTriangle, Stethoscope, Bone, Zap } from "lucide-react";
import heroImage from "@/assets/hero-dog.jpg";

const stats = [
  { label: "Dogs Rescued", value: "2,500+", icon: Heart },
  { label: "Active Volunteers", value: "350+", icon: Users },
  { label: "Cities Covered", value: "45+", icon: MapPin },
  { label: "Success Rate", value: "94%", icon: Shield },
];

const categories = [
  { icon: AlertTriangle, label: "Injury", description: "Report injured street dogs", color: "text-destructive" },
  { icon: Stethoscope, label: "Disease", description: "Report sick dogs needing medical care", color: "text-warning" },
  { icon: Bone, label: "Hunger", description: "Report starving dogs needing food", color: "text-primary" },
  { icon: Zap, label: "Emergency", description: "Urgent SOS rescue required", color: "text-accent" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Street dog being rescued" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div className="max-w-2xl" {...fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              🐾 Technology for protecting street dogs
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Street Dog <br />
              <span className="text-gradient">Health Twin</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Report injured street dogs, track rescues in real-time, and help volunteers respond faster. Every report saves a life.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/report">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-primary font-semibold px-8">
                  Report a Dog
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted font-semibold px-8">
                  Join as Volunteer
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-display text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Report by Category</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose the right category to help volunteers prioritize and respond quickly.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="glass rounded-xl p-6 cursor-pointer transition-shadow hover:shadow-lg"
              >
                <cat.icon className={`h-10 w-10 ${cat.color} mb-4`} />
                <h3 className="font-display font-semibold text-lg mb-2">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Report", desc: "Upload a photo, share location, and describe the dog's condition." },
              { step: "02", title: "Respond", desc: "Nearby volunteers get notified and accept the rescue case." },
              { step: "03", title: "Rescue", desc: "Track treatment progress until the dog is safe and healthy." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-6xl font-display font-bold text-primary/20 mb-4">{item.step}</div>
                <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="glass rounded-2xl p-12 text-center glow-primary"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Every Report <span className="text-gradient">Saves a Life</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Join thousands of compassionate people making a difference for street dogs.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8">
                Get Started Now
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-display font-bold">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            <span>SDHT</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Street Dog Health Twin. Technology for protecting street dogs.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
