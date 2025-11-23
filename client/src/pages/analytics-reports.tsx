import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Calendar, TrendingUp, Filter } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AnalyticsReports() {
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");

  const revenueData = [
    { month: "Jan", revenue: 42000, occupancy: 68, adr: 145 },
    { month: "Feb", revenue: 48500, occupancy: 72, adr: 152 },
    { month: "Mar", revenue: 55200, occupancy: 78, adr: 165 },
    { month: "Apr", revenue: 51800, occupancy: 75, adr: 158 },
    { month: "May", revenue: 59300, occupancy: 82, adr: 175 },
    { month: "Jun", revenue: 64100, occupancy: 85, adr: 185 },
  ];

  const roomTypeData = [
    { name: "Standard", value: 35, revenue: 18200 },
    { name: "Deluxe", value: 28, revenue: 24500 },
    { name: "Suite", value: 22, revenue: 28900 },
    { name: "Budget", value: 15, revenue: 8400 },
  ];

  const channelData = [
    { name: "Direct", value: 40, revenue: 52000 },
    { name: "OTA", value: 35, revenue: 45500 },
    { name: "Corporate", value: 15, revenue: 19500 },
    { name: "Partner", value: 10, revenue: 13000 },
  ];

  const guestData = [
    { segment: "Leisure", count: 156, spend: 24500, satisfaction: 4.2 },
    { segment: "Business", count: 89, spend: 52300, satisfaction: 4.5 },
    { segment: "Group", count: 34, spend: 28900, satisfaction: 4.1 },
    { segment: "Extended Stay", count: 21, spend: 18700, satisfaction: 4.3 },
  ];

  const reports = [
    {
      name: "Monthly Revenue Report",
      generatedAt: "2024-01-22",
      period: "Jan 2024",
      file: "revenue_jan_2024.pdf",
    },
    {
      name: "Occupancy Analysis",
      generatedAt: "2024-01-20",
      period: "Last 30 days",
      file: "occupancy_30days.pdf",
    },
    {
      name: "Guest Satisfaction Report",
      generatedAt: "2024-01-18",
      period: "Q4 2023",
      file: "satisfaction_q4_2023.pdf",
    },
    {
      name: "Financial Summary",
      generatedAt: "2024-01-15",
      period: "Dec 2023",
      file: "financial_dec_2023.pdf",
    },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive business intelligence and custom reports
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Generate Custom Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <label className="text-sm font-medium block mb-2">Date Range</label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last 12 months</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-64">
            <label className="text-sm font-medium block mb-2">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="revenue">Revenue Analysis</SelectItem>
                <SelectItem value="occupancy">Occupancy</SelectItem>
                <SelectItem value="guest">Guest Analytics</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { label: "Total Revenue", value: "$320,900", trend: "+12%", color: "text-green-600" },
              { label: "Avg Occupancy", value: "76.5%", trend: "+3.2%", color: "text-blue-600" },
              { label: "Avg Daily Rate", value: "$162.50", trend: "+8%", color: "text-purple-600" },
              { label: "RevPAR", value: "$124.31", trend: "+11%", color: "text-orange-600" },
              { label: "Guest Satisfaction", value: "4.3/5", trend: "+0.2", color: "text-yellow-600" },
            ].map((kpi, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-xs text-green-600 mt-1">↑ {kpi.trend}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Occupancy Trend</CardTitle>
              <CardDescription>Last 6 months performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={2} name="Occupancy (%)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Room Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Room Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roomTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roomTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Booking Channel */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Bookings (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed Analysis */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guest Segment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Segment</th>
                      <th className="text-right py-2 px-2">Guest Count</th>
                      <th className="text-right py-2 px-2">Total Spend</th>
                      <th className="text-right py-2 px-2">Avg Spend</th>
                      <th className="text-right py-2 px-2">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guestData.map((row) => (
                      <tr key={row.segment} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{row.segment}</td>
                        <td className="text-right py-2 px-2">{row.count}</td>
                        <td className="text-right py-2 px-2">${row.spend.toLocaleString()}</td>
                        <td className="text-right py-2 px-2">${(row.spend / row.count).toFixed(2)}</td>
                        <td className="text-right py-2 px-2">{row.satisfaction}/5 ⭐</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { metric: "Check-in Time", current: "2:45 PM", target: "3:00 PM", status: "On Track" },
                  { metric: "Check-out Time", current: "11:15 AM", target: "11:00 AM", status: "Delayed" },
                  { metric: "Room Turnover", current: "35 min", target: "40 min", status: "Efficient" },
                ].map((item) => (
                  <div key={item.metric} className="border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">{item.metric}</p>
                    <p className="text-lg font-bold">{item.current}</p>
                    <p className="text-xs text-muted-foreground">Target: {item.target}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Reports */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Builder</CardTitle>
              <CardDescription>Create custom reports with selected metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Report Name</label>
                  <Input placeholder="e.g., Q1 Performance Report" />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Report Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary Report</SelectItem>
                      <SelectItem value="detailed">Detailed Report</SelectItem>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full">Generate Report</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.file} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.period} • Generated {report.generatedAt}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>Export data in multiple formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { format: "CSV", description: "Excel compatible", icon: "📊" },
                  { format: "PDF", description: "Printable format", icon: "📄" },
                  { format: "JSON", description: "For integrations", icon: "{}"},
                  { format: "Excel", description: "Advanced spreadsheet", icon: "📈" },
                ].map((option) => (
                  <Button key={option.format} variant="outline" className="h-auto py-4 justify-start">
                    <div className="text-left">
                      <p className="text-lg font-semibold">{option.format}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                  </Button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">Include Tables</label>
                <div className="space-y-2">
                  {["Reservations", "Guests", "Revenue", "Occupancy", "Feedback"].map((table) => (
                    <div key={table} className="flex items-center">
                      <input type="checkbox" id={table} defaultChecked className="mr-2" />
                      <label htmlFor={table} className="text-sm">{table}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full">Export Selected Data</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
