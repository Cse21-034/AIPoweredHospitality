import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, DollarSign, Bot, TrendingUp, Users, ShieldCheck } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl" data-testid="text-hero-title">
              AI-Powered Hotel Management System
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground" data-testid="text-hero-description">
              Complete property management solution with intelligent forecasting, dynamic pricing, and seamless operations for hotels, resorts, and hospitality businesses.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-get-started"
                className="hover-elevate active-elevate-2"
              >
                Get Started - 3 Months Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.location.href = "#features"}
                data-testid="button-learn-more"
                className="hover-elevate active-elevate-2"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Manage Your Property
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From reservations to revenue optimization, all in one powerful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover-elevate" data-testid="card-feature-reservations">
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Smart Reservations</CardTitle>
                <CardDescription>
                  Visual calendar, instant booking, OTA integration with Booking.com, Expedia, and Airbnb
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-ai">
              <CardHeader>
                <Bot className="h-10 w-10 text-primary mb-2" />
                <CardTitle>AI Forecasting</CardTitle>
                <CardDescription>
                  Predict demand, optimize occupancy, and maximize revenue with advanced AI models
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-pricing">
              <CardHeader>
                <DollarSign className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dynamic Pricing</CardTitle>
                <CardDescription>
                  Automated pricing recommendations based on demand, seasonality, and competition
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-analytics">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track ADR, RevPAR, occupancy rates, and comprehensive financial reports
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-guests">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Guest Management</CardTitle>
                <CardDescription>
                  Complete profiles, preferences, loyalty tracking, and room service requests
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-elevate" data-testid="card-feature-properties">
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-Property</CardTitle>
                <CardDescription>
                  Manage multiple properties, room types, and rate plans from one dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-muted/30 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start with a 3-month free trial. No credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
            <Card data-testid="card-pricing-monthly">
              <CardHeader>
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Unlimited properties
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  AI-powered forecasting & pricing
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Advanced analytics & reports
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  OTA integrations
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Email support
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary border-2" data-testid="card-pricing-yearly">
              <CardHeader>
                <div className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full mb-2">
                  SAVE 20%
                </div>
                <CardTitle className="text-2xl">Yearly</CardTitle>
                <CardDescription>
                  <span className="text-4xl font-bold text-foreground">$949</span>
                  <span className="text-muted-foreground">/year</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Everything in Monthly
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Priority support
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Dedicated account manager
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Custom integrations
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Save $239/year
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 text-center">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-start-trial"
              className="hover-elevate active-elevate-2"
            >
              Start Your 3-Month Free Trial
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Hotel PMS. AI-Powered Property Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}
