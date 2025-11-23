import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, Shield, TrendingDown, CheckCircle, AlertCircle, Download, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AIFraudDetection() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [churnRisks, setChurnRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("fraud");

  useEffect(() => {
    fetchFraudData();
  }, []);

  const fetchFraudData = async () => {
    setLoading(true);
    try {
      // Fetch fraud predictions
      const fraudResponse = await fetch("http://localhost:8000/predict/fraud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-License-Key": localStorage.getItem("licenseKey") || "",
        },
        body: JSON.stringify({
          property_id: localStorage.getItem("propertyId"),
          timeframe: "7days",
        }),
      });

      // Fetch churn predictions
      const churnResponse = await fetch("http://localhost:8000/predict/churn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-License-Key": localStorage.getItem("licenseKey") || "",
        },
        body: JSON.stringify({
          property_id: localStorage.getItem("propertyId"),
        }),
      });

      setAlerts(generateMockFraudAlerts());
      setChurnRisks(generateMockChurnRisks());
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setAlerts(generateMockFraudAlerts());
      setChurnRisks(generateMockChurnRisks());
    } finally {
      setLoading(false);
    }
  };

  const generateMockFraudAlerts = () => [
    {
      id: "FRAUD001",
      timestamp: new Date(Date.now() - 2 * 60000).toLocaleTimeString(),
      guest: "John Smith",
      type: "Multiple Cards",
      amount: 2450,
      riskLevel: "High",
      reason: "3 different payment methods in 2 hours",
      status: "Flagged",
      color: "bg-red-50 border-red-200",
    },
    {
      id: "FRAUD002",
      timestamp: new Date(Date.now() - 15 * 60000).toLocaleTimeString(),
      guest: "Sarah Johnson",
      type: "Geographic Anomaly",
      amount: 850,
      riskLevel: "Medium",
      reason: "Booking from Nigeria, card from US",
      status: "Review",
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      id: "FRAUD003",
      timestamp: new Date(Date.now() - 45 * 60000).toLocaleTimeString(),
      guest: "Mike Chen",
      type: "Velocity Check",
      amount: 580,
      riskLevel: "Low",
      reason: "4 bookings in 24 hours - bulk buyer",
      status: "Approved",
      color: "bg-green-50 border-green-200",
    },
  ];

  const generateMockChurnRisks = () => [
    {
      id: "CHURN001",
      guestName: "Patricia Williams",
      lastStay: "2 months ago",
      bookingsCount: 5,
      satisfaction: 3.2,
      riskLevel: "High",
      reason: "Low satisfaction scores, long gap since last stay",
      action: "Send special offer email",
      actionTaken: false,
    },
    {
      id: "CHURN002",
      guestName: "David Martinez",
      lastStay: "1 month ago",
      bookingsCount: 12,
      satisfaction: 4.1,
      riskLevel: "Medium",
      reason: "Declining booking frequency over 6 months",
      action: "Call to offer loyalty discount",
      actionTaken: false,
    },
    {
      id: "CHURN003",
      guestName: "Emma Davis",
      lastStay: "1 week ago",
      bookingsCount: 8,
      satisfaction: 4.8,
      riskLevel: "Low",
      reason: "Regular customer, high satisfaction",
      action: "Send VIP invitation to new amenities",
      actionTaken: true,
    },
  ];

  const fraudMetrics = [
    {
      label: "Fraud Cases Detected",
      value: "12",
      period: "This month",
      color: "text-red-600",
    },
    {
      label: "Blocked Transactions",
      value: "$18,400",
      period: "Saved",
      color: "text-green-600",
    },
    {
      label: "False Positives",
      value: "2",
      period: "Very low",
      color: "text-blue-600",
    },
    {
      label: "Detection Rate",
      value: "94%",
      period: "Accuracy",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-4xl font-bold">AI Risk Detection</h1>
        <p className="text-muted-foreground mt-2">
          Real-time fraud detection and guest churn prediction
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {fraudMetrics.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-600">{stat.period}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fraud">Fraud Alerts</TabsTrigger>
          <TabsTrigger value="churn">Churn Risk</TabsTrigger>
        </TabsList>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Recent Fraud Alerts</h2>
            <Button variant="outline" size="sm" onClick={fetchFraudData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Active Alerts */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`border-2 ${alert.color}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${alert.riskLevel === "High" ? "text-red-600" : alert.riskLevel === "Medium" ? "text-yellow-600" : "text-green-600"}`} />
                        <div>
                          <p className="font-semibold">{alert.guest}</p>
                          <p className="text-sm text-muted-foreground">{alert.type}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-semibold">${alert.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Risk Level</p>
                          <p className="font-semibold">{alert.riskLevel}</p>
                        </div>
                      </div>
                      <p className="text-sm mt-2 italic text-gray-600">{alert.reason}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={alert.riskLevel === "High" ? "destructive" : alert.riskLevel === "Medium" ? "secondary" : "default"}>
                        {alert.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">{alert.timestamp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fraud Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Fraud Incidents Trend (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { date: "Day 1", incidents: 0 },
                  { date: "Day 5", incidents: 1 },
                  { date: "Day 10", incidents: 1 },
                  { date: "Day 15", incidents: 2 },
                  { date: "Day 20", incidents: 3 },
                  { date: "Day 25", incidents: 2 },
                  { date: "Day 30", incidents: 3 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="incidents" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { factor: "Multiple payment methods", count: 8, risk: 95 },
                  { factor: "Geographic inconsistencies", count: 6, risk: 87 },
                  { factor: "Unusual booking patterns", count: 5, risk: 72 },
                  { factor: "IP/Device mismatches", count: 3, risk: 65 },
                ].map((item) => (
                  <div key={item.factor} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.factor}</p>
                      <p className="text-xs text-muted-foreground">{item.count} incidents</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{item.risk}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Churn Risk Tab */}
        <TabsContent value="churn" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Guest Churn Risk Analysis</h2>
            <Button variant="outline" size="sm" onClick={fetchFraudData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* At-Risk Guests Table */}
          <Card>
            <CardHeader>
              <CardTitle>At-Risk Guests</CardTitle>
              <CardDescription>Guests likely to churn in the next 3 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>Last Stay</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Risk Level</TableHead>
                      <TableHead>Recommendation</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnRisks.map((risk) => (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{risk.guestName}</TableCell>
                        <TableCell>{risk.lastStay}</TableCell>
                        <TableCell>{risk.bookingsCount}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-sm">{risk.satisfaction.toFixed(1)}/5</span>
                            <div className="ml-2 flex text-yellow-400">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className={i < risk.satisfaction ? "text-yellow-400" : "text-gray-300"}>★</span>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={risk.riskLevel === "High" ? "destructive" : risk.riskLevel === "Medium" ? "secondary" : "default"}>
                            {risk.riskLevel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{risk.action}</TableCell>
                        <TableCell>
                          <Button size="sm" variant={risk.actionTaken ? "default" : "outline"}>
                            {risk.actionTaken ? <CheckCircle className="w-4 h-4" /> : "Send"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Retention Strategies */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Retention Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium">Personalized Offers</p>
                  <p className="text-sm text-muted-foreground">Send customized discounts based on previous booking patterns</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium">Loyalty Program</p>
                  <p className="text-sm text-muted-foreground">Enroll high-risk guests in loyalty rewards automatically</p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium">VIP Treatment</p>
                  <p className="text-sm text-muted-foreground">Offer room upgrades and complimentary amenities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Fraud Alerts
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export At-Risk Guests
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
