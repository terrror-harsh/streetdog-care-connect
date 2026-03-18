import { DogAssessment } from "@/hooks/useAIDogAnalysis";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, Heart, Dog } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIAssessmentCardProps {
  assessment: DogAssessment;
  onApply: () => void;
}

const severityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const AIAssessmentCard = ({ assessment, onApply }: AIAssessmentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm">AI Dog Assessment</h3>
        <Badge variant="outline" className="ml-auto text-xs">
          {assessment.confidence}% confidence
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Dog className="h-4 w-4 text-muted-foreground" />
          <span><strong>Breed:</strong> {assessment.breed}</span>
        </div>
        <div>
          <strong>Age:</strong> {assessment.estimatedAge}
        </div>
        <div>
          <strong>Body:</strong> {assessment.bodyCondition}
        </div>
        <div className="flex items-center gap-1">
          <strong>Severity:</strong>
          <span className={`px-2 py-0.5 rounded-full text-xs border ${severityColors[assessment.suggestedSeverity]}`}>
            {assessment.suggestedSeverity}
          </span>
        </div>
      </div>

      {assessment.visibleInjuries.length > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
          <div>
            <strong>Injuries:</strong> {assessment.visibleInjuries.join(", ")}
          </div>
        </div>
      )}

      {assessment.healthConcerns.length > 0 && (
        <div className="flex items-start gap-2 text-sm">
          <Heart className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <strong>Health Concerns:</strong> {assessment.healthConcerns.join(", ")}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground italic">{assessment.description}</p>

      <button
        type="button"
        onClick={onApply}
        className="w-full text-sm font-medium py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        ✨ Apply AI suggestions to form
      </button>
    </motion.div>
  );
};

export default AIAssessmentCard;
