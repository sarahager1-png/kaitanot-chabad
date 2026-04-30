'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface GroupSizeChartProps {
  data: { group: string; count: number }[]
}

const chartConfig = {
  count: { label: 'ילדים', color: '#333654' },
}

export function GroupSizeChart({ data }: GroupSizeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">גודל קבוצות</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">אין נתוני קבוצות</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#FEF0EC" />
              <XAxis dataKey="group" tick={{ fontSize: 11, fill: '#6B6D8A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6D8A' }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#333654" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
