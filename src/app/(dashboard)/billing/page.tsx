"use client";

import {
  CreditCard,
  Check,
  Bot,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

export default function BillingPage() {
  const { t } = useLocaleStore();

  const handleManageSubscription = () => {
    toast.info(t.billing.subscriptionManaged);
  };

  const handleCancelPlan = () => {
    toast.info(t.billing.planCancelled);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.billing.title}</h1>
        <p className="text-sm text-gray-500">
          {t.billing.manageSubscription}
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.billing.currentPlan}</CardTitle>
              <CardDescription>{t.billing.proPlan}</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800">{t.billing.active}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">$30</span>
            <span className="text-sm text-gray-500">{t.billing.perMonth}</span>
            <Badge variant="secondary" className="ml-2">
              {t.billing.proPlan}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600" />
              <span>Up to 10 AI agents</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600" />
              <span>5,000 messages per month</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600" />
              <span>WhatsApp Business integration</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600" />
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600" />
              <span>Priority support</span>
            </div>
          </div>

          <Separator />

          {/* Usage */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-gray-900">
              {t.billing.usage}
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">3 / 10</p>
                  <p className="text-xs text-gray-500">{t.billing.agentsUsage}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">2,081 / 5,000</p>
                  <p className="text-xs text-gray-500">{t.billing.messagesUsage}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-green-100">
                  <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold">2</p>
                  <p className="text-xs text-gray-500">{t.billing.whatsappLines}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleManageSubscription}>
              {t.billing.manageSubscription}
            </Button>
            <Button variant="outline" onClick={handleCancelPlan}>
              {t.billing.cancelPlan}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle>{t.billing.paymentMethod}</CardTitle>
          <CardDescription>{t.billing.updatePayment}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-100">
                <CreditCard className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t.billing.visaEnding} 4242
                </p>
                <p className="text-xs text-gray-500">{t.billing.expires} 12/2027</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info(t.billing.updatePayment)}
            >
              {t.billing.updatePayment}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
