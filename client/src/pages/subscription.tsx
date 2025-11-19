import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Calendar, CreditCard, Check, AlertCircle } from "lucide-react";
import type { License } from "@shared/schema";
import { format } from "date-fns";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

function SubscribeForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription?success=true",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full hover-elevate active-elevate-2"
        data-testid="button-subscribe-submit"
      >
        {isSubmitting ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
}

export default function Subscription() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | null>(null);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: license, isLoading } = useQuery<License>({
    queryKey: ["/api/license/current"],
    enabled: isAuthenticated,
  });

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setSelectedPlan(plan);
    try {
      const response = await apiRequest("POST", "/api/subscription/create", { plan });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectedPlan(null);
    }
  };

  if (authLoading || isLoading) {
    return <SubscriptionSkeleton />;
  }

  const isActive = license?.subscriptionStatus === "active";
  const isTrial = license?.subscriptionStatus === "trial";
  const isExpired = license?.subscriptionStatus === "expired" || license?.subscriptionStatus === "grace_period";
  const daysRemaining = license?.expiresAt
    ? Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          License & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and product key</p>
      </div>

      {/* Current License Status */}
      <Card data-testid="card-license-status">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-primary" />
              <CardTitle>Current License</CardTitle>
            </div>
            <Badge
              variant={isActive ? "default" : isTrial ? "secondary" : "destructive"}
              data-testid="badge-subscription-status"
            >
              {license?.subscriptionStatus || "No License"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">License Key</p>
              <p className="text-sm font-mono mt-1" data-testid="text-license-key">
                {license?.licenseKey || "Not activated"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subscription Type</p>
              <p className="text-sm mt-1 capitalize" data-testid="text-subscription-type">
                {license?.subscriptionType || isTrial ? "3-Month Free Trial" : "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {isTrial ? "Trial Expires" : isActive ? "Renews On" : "Expired On"}
              </p>
              <p className="text-sm mt-1" data-testid="text-expiry-date">
                {license?.expiresAt
                  ? format(new Date(license.expiresAt), "MMMM dd, yyyy")
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
              <p
                className={`text-sm mt-1 font-semibold ${
                  daysRemaining < 30 ? "text-amber-600" : ""
                } ${daysRemaining < 7 ? "text-destructive" : ""}`}
                data-testid="text-days-remaining"
              >
                {daysRemaining} days
              </p>
            </div>
          </div>

          {isExpired && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Subscription Expired</p>
                <p className="text-sm text-destructive/90 mt-1">
                  Your subscription has expired. AI features and advanced reports are disabled. Subscribe below to restore access.
                </p>
              </div>
            </div>
          )}

          {/* Features Status */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Enabled Features</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${isActive || isTrial ? "text-green-500" : "text-muted-foreground"}`} />
                <span className={`text-sm ${!isActive && !isTrial ? "text-muted-foreground line-through" : ""}`}>
                  AI Forecasting
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${isActive || isTrial ? "text-green-500" : "text-muted-foreground"}`} />
                <span className={`text-sm ${!isActive && !isTrial ? "text-muted-foreground line-through" : ""}`}>
                  Dynamic Pricing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className={`h-4 w-4 ${isActive || isTrial ? "text-green-500" : "text-muted-foreground"}`} />
                <span className={`text-sm ${!isActive && !isTrial ? "text-muted-foreground line-through" : ""}`}>
                  Unlimited Properties
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      {(!isActive || isExpired) && (
        <div className="space-y-4">
          {!stripePromise && (
            <div className="bg-amber-500/10 border border-amber-500 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500">Stripe Not Configured</p>
                <p className="text-sm text-amber-500/90 mt-1">
                  Stripe payment processing is not set up. Add VITE_STRIPE_PUBLIC_KEY and STRIPE_SECRET_KEY to enable subscriptions.
                </p>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-semibold">Subscribe Now</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <Card className="hover-elevate" data-testid="card-plan-monthly">
              <CardHeader>
                <CardTitle className="text-xl">Monthly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$99</span>
                  <span className="text-muted-foreground">/month</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Unlimited properties
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    AI forecasting & pricing
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Email support
                  </li>
                </ul>
                <Button
                  className="w-full hover-elevate active-elevate-2"
                  onClick={() => handleSubscribe("monthly")}
                  disabled={selectedPlan === "monthly"}
                  data-testid="button-subscribe-monthly"
                >
                  {selectedPlan === "monthly" ? "Selected" : "Subscribe Monthly"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary border-2 hover-elevate" data-testid="card-plan-yearly">
              <CardHeader>
                <div className="inline-block bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full mb-2">
                  SAVE 20%
                </div>
                <CardTitle className="text-xl">Yearly</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">$949</span>
                  <span className="text-muted-foreground">/year</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Everything in Monthly
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Save $239/year
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Dedicated account manager
                  </li>
                </ul>
                <Button
                  className="w-full hover-elevate active-elevate-2"
                  onClick={() => handleSubscribe("yearly")}
                  disabled={selectedPlan === "yearly"}
                  data-testid="button-subscribe-yearly"
                >
                  {selectedPlan === "yearly" ? "Selected" : "Subscribe Yearly"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          {clientSecret && selectedPlan && stripePromise && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Enter your payment information to complete subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <SubscribeForm
                    onSuccess={() => {
                      toast({
                        title: "Success!",
                        description: "Your subscription has been activated.",
                      });
                      window.location.reload();
                    }}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isActive && !isExpired && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Active</CardTitle>
            <CardDescription>
              You have full access to all features. Your subscription will renew automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Need to update your payment method or cancel? Contact support at support@hotelpms.com
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
