import { Progress } from '@/components/ui/progress'
import { Target } from 'lucide-react'

interface GoalProgressProps {
  current: number
  goal: number
}

export function GoalProgress({ current, goal }: GoalProgressProps) {
  const pct = goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0
  const remaining = Math.max(goal - current, 0)

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold text-foreground">התקדמות לעבר יעד הרישום</span>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">
          {pct}%
        </span>
      </div>
      <Progress value={pct} className="h-2.5" />
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{current} רשומים</span>
        {remaining > 0 && <span>נותרו {remaining} עד היעד</span>}
        <span>יעד: {goal}</span>
      </div>
    </div>
  )
}
