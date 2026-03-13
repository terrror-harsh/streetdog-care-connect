import { motion } from "framer-motion";
import { Heart, Trophy, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const successStories = [
  { name: "Buddy", story: "Found injured near the highway, now happily adopted by a loving family.", status: "Adopted ❤️" },
  { name: "Luna", story: "Rescued from disease, treated for 3 weeks, and now thriving in a shelter.", status: "Healthy 🌟" },
  { name: "Max", story: "Was starving on the streets, volunteers provided food and found him a home.", status: "Adopted ❤️" },
];

const leaderboard = [
  { name: "Dr. Priya Sharma", rescues: 45, rank: 1 },
  { name: "Rahul Verma", rescues: 38, rank: 2 },
  { name: "Anita Desai", rescues: 32, rank: 3 },
  { name: "Vikram Singh", rescues: 28, rank: 4 },
  { name: "Maya Patel", rescues: 25, rank: 5 },
];

const Community = () => {
  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Community</h1>
          <p className="text-muted-foreground mb-10">Stories, heroes, and ways to help.</p>

          {/* Success Stories */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-primary" /> Success Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {successStories.map((story, i) => (
                <motion.div
                  key={story.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -3 }}
                  className="glass rounded-xl p-6"
                >
                  <div className="text-4xl mb-3">🐕</div>
                  <h3 className="font-display text-lg font-semibold mb-1">{story.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{story.story}</p>
                  <span className="text-sm font-medium text-accent">{story.status}</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Volunteer Leaderboard */}
          <section className="mb-16">
            <h2 className="font-display text-2xl font-semibold mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-warning" /> Volunteer Leaderboard
            </h2>
            <div className="glass rounded-xl overflow-hidden">
              {leaderboard.map((v, i) => (
                <motion.div
                  key={v.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className={`flex items-center justify-between p-4 ${i < leaderboard.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-display text-xl font-bold ${v.rank <= 3 ? "text-primary" : "text-muted-foreground"}`}>
                      #{v.rank}
                    </span>
                    <span className="font-medium">{v.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{v.rescues} rescues</span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Adoption & Donation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8 text-center"
            >
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Adopt a Dog</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Give a rescued street dog a forever home. Browse available dogs ready for adoption.
              </p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                View Dogs for Adoption
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8 text-center"
            >
              <Gift className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Donate</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Your donation helps fund medical treatment, food, and shelter for street dogs.
              </p>
              <Button variant="outline">
                Make a Donation
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Community;
