'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'

interface GenderChartProps {
  data: { gender: string; count: number }[]
}

const COLORS: Record<string, string> = {
  'זכר': '#333654',
  'נקבה': '#00B1AE',
  'לא ידוע': '#E5E5E8',
}

const chartConfig = {
  'זכר': { label: 'זכר', color: '#333654' },
  'נקבה': { label: 'נקבה', color: '#00B1AE' },
  'לא ידוע': { label: 'לא ידוע', color: '#E5E5E8' },
}

export function GenderChart({ data }: GenderChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const visible = data.filter(d => d.count > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">פילוח מגדרי</CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">אין נתוני מגדר</p>
        ) : (
          <div className="flex items-center gap-6">
            <ChartContainer config={chartConfig} className="h-40 w-40 shrink-0">
              <PieChart>
                <Pie data={visible} dataKey="count" nameKey="gender" cx="50%" cy="50%" outerRadius={55}>
                  {visible.map((d, i) => (
                    <Cell key={i} fill={COLORS[d.gender] ?? '#9091A8'} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-2">
              {visible.map(d => (
                <div key={d.gender} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[d.gender] ?? '#9091A8' }} />
                  <span className="text-[#6B6D8A]">{d.gender}</span>
                  <span className="font-bold text-[#333654]">{d.count}</span>
                  <span className="text-xs text-[#9091A8]">({Math.round((d.count / total) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
