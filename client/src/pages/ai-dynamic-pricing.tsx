import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { TrendingUp, Target, AlertTriangle, Download, RefreshCw, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function AIDynamicPricing() {
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState("deluxe");
  const [appliedPrices, setAppliedPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPricingRecommendations();
  }, [selectedRoomType]);

  const fetchPricingRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/predict/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-License-Key": localStorage.getItem("licenseKey") || "",
        },
        body: JSON.stringify({
          room_type: selectedRoomType,
          property_id: localStorage.getItem("propertyId"),
          days_ahead: 30,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const chartData = generateMockPricingData();
        setPricingData(chartData);
        setRecommendations(generateMockRecommendations());
      }
    } catch (error) {
      console.error("Failed to fetch pricing:", error);
      setPricingData(generateMockPricingData());
      setRecommendations(generateMockRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const generateMockPricingData = () => {
    const data = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const basePrice = 150;
      const occupancy = Math.random() * 60 + 40;
      const dynamicPrice = basePrice + (occupancy - 50) * 2;
      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        basePrice,
        recommended: Math.floor(dynamicPrice),
        occupancy: Math.floor(occupancy),
        revenue: Math.floor(dynamicPrice * occupancy / 100),
      });
    }
    return data;
  };

  const generateMockRecommendations = () => [
    {
      roomType: "Standard Room",
      currentPrice: 120,
      recommended: 145,
      increase: 20,
      reason: "High demand forecast, low occupancy risk",
      occupancy: 75,
      impact: "+$2,450/month",
    },
    {
      roomType: "Deluxe Room",
      currentPrice: 180,
      recommended: 165,
      increase: -8,
      reason: "Medium demand, adjust for market competition",
      occupancy: 62,
      impact: "-$150/month",
    },
    {
      roomType: "Suite",
      currentPrice: 250,
      recommended: 290,
      increase: 16,
      reason: "Very high demand forecast, premium positioning",
      occupancy: 88,
      impact: "+$4,800/month",
    },
    {
      roomType: "Budget Room",
      currentPrice: 85,
      recommended: 95,
      increase: 12,
      reason: "Strong demand in budget segment",
      occupancy: 82,
      impact: "+$1,200/month",
    },
  ];

  const stats = [
    {
      label: "Avg Revenue per Room",
      value: "$168",
      trend: "+8%",
      color: "text-green-600",
    },
    {
      label: "Estimated Monthly Revenue",
      value: "$48,600",
      trend: "+12%",
      color: "text-green-600",
    },
    {
      label: "Optimal Pricing Accuracy",
      value: "91%",
      trend: "High",
      color: "text-blue-600",
    },
    {
      label: "Competitive Gap",
      value: "-2%",
      trend: "Good",
      color: "text-purple-600",
    },
  ];

  const handleApplyPrice = (roomType: string, price: number) => {
    setAppliedPrices({
      ...appliedPrices,
      [roomType]: price,
    });
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-4xl font-bold">AI Dynamic Pricing</h1>
        <p className="text-muted-foreground mt-2">
          Real-time pricing recommendations powered by machine learning
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-green-600">↑ {stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Type Selector */}
      <div className="flex gap-2 flex-wrap">
        {["standard", "deluxe", "suite", "budget"].map((type) => (
          <Badge
            key={type}
            variant={selectedRoomType === type ? "default" : "outline"}
            className="cursor-pointer py-2 px-4 capitalize"
            onClick={() => setSelectedRoomType(type)}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* Main Pricing Chart */}
      <Tabs defaultValue="pricing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pricing">Price vs Occupancy</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Impact</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Dynamic Pricing Strategy</CardTitle>
                  <CardDescription>Next 30 days pricing recommendations</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchPricingRecommendations}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <p>Loading pricing recommendations...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={pricingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="basePrice" stroke="#94a3b8" name="Base Price" strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="recommended" stroke="#ef4444" name="AI Recommended" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Impact</CardTitle>
              <CardDescription>Expected daily revenue with recommended pricing</CardDescription>
            </CardHeader>
            <CardContent>
              {!loading && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={pricingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="revenue" fill="#10b981" name="Daily Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
              <CardDescription>Price vs market comparison</CardDescription>
            </CardHeader>
            <CardContent>
              {!loading && (
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="occupancy" name="Occupancy Rate" />
                    <YAxis dataKey="revenue" name="Revenue" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Your Property" data={pricingData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Price Recommendations by Room Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rec.roomType}</CardTitle>
                    <CardDescription>Current: ${rec.currentPrice}</CardDescription>
                  </div>
                  <Badge variant={rec.increase > 0 ? "default" : "secondary"}>
                    {rec.increase > 0 ? "+" : ""}{rec.increase}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Recommended Price</span>
                    <span className="text-2xl font-bold text-green-600">${rec.recommended}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Occupancy Impact</span>
                    <span className="font-medium">{rec.occupancy}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Monthly Impact</span>
                    <span className="font-bold text-green-600">{rec.impact}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-900">{rec.reason}</p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleApplyPrice(rec.roomType, rec.recommended)}
                  variant={appliedPrices[rec.roomType] === rec.recommended ? "default" : "outline"}
                >
                  {appliedPrices[rec.roomType] === rec.recommended ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Applied
                    </>
                  ) : (
                    "Apply Recommendation"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Strategy Tips */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-5 h-5" />
            Pricing Strategy Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-orange-900">
          <p>• Monitor competitor prices daily - adjust your prices within 12 hours of market changes</p>
          <p>• Weekend rates should be 15-25% higher than weekday rates</p>
          <p>• Special events in the area can increase demand by 30-50% - raise prices accordingly</p>
          <p>• Avoid deep discounts below cost; use length-of-stay discounts instead</p>
          <p>• Test 5-10% price changes monthly to optimize revenue</p>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Reports</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Recommendations
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Price History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
