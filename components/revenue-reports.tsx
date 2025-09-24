"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface RevenueData {
  name: string
  revenue: number
  sessions: number
  billiardRevenue?: number
  ps4Revenue?: number
}

interface ReportSummary {
  totalRevenue: number
  totalSessions: number
  avgPerSession: number
  topPerformingDay: string
  growthRate: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function RevenueReports() {
  const [timeRange, setTimeRange] = useState("daily")
  const [chartType, setChartType] = useState("bar")

  const { data: reportData, error } = useSWR(`/api/reports?period=${timeRange}`, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  const [data, setData] = useState<RevenueData[]>([])
  const [summary, setSummary] = useState<ReportSummary | null>(null)

  useEffect(() => {
    if (reportData) {
      setData(reportData.data || [])
      setSummary(reportData.summary || null)
    }
  }, [reportData])

  const exportReport = () => {
    const csvContent = [
      ["Period", "Revenue", "Sessions", "Billiard Revenue", "PS4 Revenue"],
      ...data.map((item) => [item.name, item.revenue, item.sessions, item.billiardRevenue || 0, item.ps4Revenue || 0]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `revenue-report-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const pieData =
    data.length > 0
      ? [
          {
            name: "Billiard Tables",
            value: data.reduce((sum, item) => sum + (item.billiardRevenue || 0), 0),
            color: "hsl(var(--primary))",
          },
          {
            name: "PS4 Stations",
            value: data.reduce((sum, item) => sum + (item.ps4Revenue || 0), 0),
            color: "hsl(var(--secondary))",
          },
        ]
      : []

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Error Loading Reports</h3>
        <p className="text-muted-foreground">Please check your Google Sheets connection</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="monthly">Monthly View</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportReport} variant="outline" className="rounded-xl bg-transparent">
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold text-primary">
                ${summary.totalRevenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardHeader className="pb-2">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-2xl font-bold text-secondary-foreground">
                {summary.totalSessions.toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardHeader className="pb-2">
              <CardDescription>Avg per Session</CardDescription>
              <CardTitle className="text-2xl font-bold text-accent-foreground">
                ${summary.avgPerSession.toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-chart-4/10 to-chart-4/5 border-chart-4/20">
            <CardHeader className="pb-2">
              <CardDescription>Top Performing</CardDescription>
              <CardTitle className="text-2xl font-bold">{summary.topPerformingDay}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="rounded-2xl bg-gradient-to-br from-chart-5/10 to-chart-5/5 border-chart-5/20">
            <CardHeader className="pb-2">
              <CardDescription>Growth Rate</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center gap-1">
                {summary.growthRate > 0 ? "+" : ""}
                {summary.growthRate.toFixed(1)}%
                {summary.growthRate > 0 ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">↗</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">↘</Badge>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Main Revenue Chart */}
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Revenue Trends
            <Badge className="bg-primary/20 text-primary-foreground">
              {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}
            </Badge>
          </CardTitle>
          <CardDescription>
            {timeRange === "daily" ? "This week" : timeRange === "weekly" ? "Last 4 weeks" : "Last 6 months"}{" "}
            performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "bar" ? (
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value, name) => [
                      `$${value}`,
                      name === "revenue" ? "Revenue" : name === "sessions" ? "Sessions" : name,
                    ]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Revenue by Station Type</CardTitle>
            <CardDescription>Billiard vs PS4 performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm">Billiard Tables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-sm">PS4 Stations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Session Analytics</CardTitle>
            <CardDescription>Number of sessions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                    }}
                    formatter={(value) => [value, "Sessions"]}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="rounded-2xl shadow-lg bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">💡 Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-card/50 rounded-xl">
              <h4 className="font-semibold mb-2">Peak Performance</h4>
              <p className="text-sm text-muted-foreground">
                {summary?.topPerformingDay} generated the highest revenue this {timeRange.slice(0, -2)}
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-xl">
              <h4 className="font-semibold mb-2">Station Preference</h4>
              <p className="text-sm text-muted-foreground">
                Billiard tables generate{" "}
                {pieData.length > 0 ? Math.round((pieData[0].value / (pieData[0].value + pieData[1].value)) * 100) : 0}%
                of total revenue
              </p>
            </div>
            <div className="p-4 bg-card/50 rounded-xl">
              <h4 className="font-semibold mb-2">Growth Trend</h4>
              <p className="text-sm text-muted-foreground">
                {summary && summary.growthRate > 0 ? "Positive" : "Negative"} growth trend of{" "}
                {summary?.growthRate.toFixed(1)}% this period
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
