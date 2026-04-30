'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell } from 'recharts'

interface PaymentStatusChartProps {
  data: { status: string; count: number }[]
}

const COLORS: Record<string, string> = {
  'שולם מלא': '#1A7A4A',
  'שולם חלקי': '#B45309',
  'טרם שולם': '#C8251D',
}

const chartConfig = {
  'שולם מלא': { label: 'שולם מלא', color: '#1A7A4A' },
  'שולם חלקי': { label: 'שולם חלקי', color: '#B45309' },
  'טרם שולם': { label: 'טרם שולם', color: '#C8251D' },
}

export function PaymentStatusChart({ data }: PaymentStatusChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">פילוח תשלומים</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">אין נתוני תשלום</p>
        ) : (
          <div className="flex items-center gap-6">
            <ChartContainer config={chartConfig} className="h-40 w-40 shrink-0">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                  {data.map((d, i) => (
                    <Cell key={i} fill={COLORS[d.status] ?? '#9091A8'} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="flex flex-col gap-2">
              {data.map(d => (
                <div key={d.status} className="flex items-center gap-2 text-sm">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COLORS[d.status] ?? '#9091A8' }} />
                  <span className="text-[#6B6D8A]">{d.status}</span>
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
