'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface DataPoint {
  category: string
  amount: number
}

interface IncomeByCategoryChartProps {
  data: DataPoint[]
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function IncomeByCategoryChart({ data }: IncomeByCategoryChartProps) {
  const chartConfig = Object.fromEntries(
    data.map((d, i) => [d.category, { label: d.category, color: COLORS[i % COLORS.length] }])
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">פילוח הכנסות לפי קטגוריה</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">אין נתוני הכנסה</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={65}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
