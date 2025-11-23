import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Lock, Unlock, CreditCard, RefreshCw, Download, Copy } from "lucide-react";

export default function LicenseSubscription() {
  const [licenseKey] = useState("HPMS-A1B2-C3D4-E5F6");
  const [subscription, setSubscription] = useState({
    status: "active",
    type: "professional",
    startDate: "2024-01-01",
    expiresAt: "2025-01-01",
    daysRemaining: 342,
    properties: 2,
    maxProperties: 5,
    price: 99.99,
    billingCycle: "monthly",
  });

  const [features] = useState({
    ai: {
      name: "AI Features",
      enabled: true,
      details: [
        "Demand Forecasting",
        "Dynamic Pricing",
        "Fraud Detection",
        "Guest Churn Prediction",
        "Sentiment Analysis",
        "Maintenance Prediction",
      ],
    },
    reports: {
      name: "Advanced Analytics",
      enabled: true,
      details: [
        "Custom Reports",
        "Data Export (CSV, PDF)",
        "Real-time Dashboards",
        "Predictive Insights",
      ],
    },
    integrations: {
      name: "Integrations",
      enabled: true,
      details: [
        "Stripe Payments",
        "OpenAI Integration",
        "OTA Connectivity",
      ],
    },
    support: {
      name: "Support",
      enabled: true,
      details: [
        "Email Support",
        "Phone Support",
        "Priority Support",
        "Dedicated Account Manager",
      ],
    },
  });

  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const plans = [
    {
      name: "Starter",
      price: 49,
      properties: 1,
      features: ["Basic Dashboard", "Room Management", "Guest Billing"],
      current: false,
    },
    {
      name: "Professional",
      price: 99,
      properties: 5,
      features: [
        "Everything in Starter +",
        "AI Features",
        "Advanced Analytics",
        "Custom Reports",
      ],
      current: true,
      recommended: true,
    },
    {
      name: "Enterprise",
      price: 299,
      properties: "Unlimited",
      features: [
        "Everything in Professional +",
        "API Access",
        "White Label Options",
        "Dedicated Support",
      ],
      current: false,
    },
  ];

  const billingHistory = [
    {
      date: "2024-01-01",
      description: "Professional Plan (Monthly)",
      amount: 99.99,
      status: "Paid",
      invoice: "INV-2024-001",
    },
    {
      date: "2023-12-01",
      description: "Professional Plan (Monthly)",
      amount: 99.99,
      status: "Paid",
      invoice: "INV-2023-012",
    },
    {
      date: "2023-11-01",
      description: "Professional Plan (Monthly)",
      amount: 99.99,
      status: "Paid",
      invoice: "INV-2023-011",
    },
  ];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-4xl font-bold">License & Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your license key, subscription plan, and billing
        </p>
      </div>

      {/* Subscription Status */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <CardTitle className="text-green-900">Subscription Active</CardTitle>
                <CardDescription className="text-green-700">
                  {subscription.daysRemaining} days remaining
                </CardDescription>
              </div>
            </div>
            <Badge className="capitalize bg-green-600">
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-green-700 font-medium">Plan</p>
            <p className="text-lg font-bold text-green-900 capitalize">{subscription.type}</p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Expires</p>
            <p className="text-lg font-bold text-green-900">{subscription.expiresAt}</p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Properties</p>
            <p className="text-lg font-bold text-green-900">
              {subscription.properties}/{subscription.maxProperties}
            </p>
          </div>
          <div>
            <p className="text-sm text-green-700 font-medium">Billing</p>
            <p className="text-lg font-bold text-green-900 capitalize">{subscription.billingCycle}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="license" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="license">License</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* License Tab */}
        <TabsContent value="license" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>Your activation license key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4 flex items-center justify-between">
                <code className="text-lg font-mono font-bold text-gray-900">{licenseKey}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLicense}
                  className={copySuccess ? "bg-green-100" : ""}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copySuccess ? "Copied!" : "Copy"}
                </Button>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Keep your license key safe. You'll need it to activate the application on other devices.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Activated Devices</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Main Office - Windows</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Laptop - macOS</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">License Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span className="font-medium">2024-01-01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expiry:</span>
                      <span className="font-medium">2025-01-01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="default">Valid</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh License
                </Button>
                <Button variant="outline">Contact Support</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(features).map(([key, feature]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    {feature.enabled ? (
                      <Badge className="bg-green-600">Unlocked</Badge>
                    ) : (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm">
                        {feature.enabled ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.recommended ? "border-2 border-blue-600 ring-2 ring-blue-100" : ""} ${
                  plan.current ? "border-2 border-green-600" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold">
                    RECOMMENDED
                  </div>
                )}
                {plan.current && (
                  <div className="absolute top-0 left-0 bg-green-600 text-white px-3 py-1 rounded-br-lg text-xs font-semibold">
                    CURRENT PLAN
                  </div>
                )}
                <CardHeader className="pt-10">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>
                    Up to {plan.properties} {typeof plan.properties === "number" ? "properties" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!plan.current && (
                    <Button className="w-full" variant={plan.recommended ? "default" : "outline"}>
                      Upgrade Plan
                    </Button>
                  )}
                  {plan.current && (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Billing Information</CardTitle>
                  <CardDescription>Manage your payment method and invoices</CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Invoices
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Payment Method</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Visa ending in 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Update</Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Billing History</h3>
                <div className="space-y-2">
                  {billingHistory.map((item) => (
                    <div key={item.invoice} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.amount}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{item.status}</Badge>
                          <Button variant="ghost" size="sm" className="text-xs">
                            {item.invoice}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auto-Renewal Setting */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Renewal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Automatic Renewal Enabled</p>
            <p className="text-sm text-muted-foreground">
              Your subscription will automatically renew on 2025-01-01
            </p>
          </div>
          <Button variant="outline">Manage Auto-Renewal</Button>
        </CardContent>
      </Card>
    </div>
  );
}
