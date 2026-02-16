"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocaleStore } from "@/stores/locale-store";
import { toast } from "sonner";

export default function SettingsPage() {
  const { t } = useLocaleStore();
  const [name, setName] = useState("Juan Garcia");
  const [email, setEmail] = useState("juan@hotelplayaazul.com");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [agentAlerts, setAgentAlerts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = () => {
    toast.success(t.settingsPage.saved);
  };

  const handleDeleteAccount = () => {
    toast.error(t.settingsPage.deleteAccountWarning);
    setDeleteDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.settingsPage.title}</h1>
        <p className="text-sm text-gray-500">
          {t.settingsPage.profileDescription}
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsPage.profile}</CardTitle>
          <CardDescription>{t.settingsPage.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t.settingsPage.name}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t.settingsPage.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t.settingsPage.notifications}</CardTitle>
          <CardDescription>
            {t.settingsPage.emailNotificationsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t.settingsPage.emailNotifications}
              </p>
              <p className="text-xs text-gray-500">
                {t.settingsPage.emailNotificationsDesc}
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t.settingsPage.weeklyReports}
              </p>
              <p className="text-xs text-gray-500">
                {t.settingsPage.weeklyReportsDesc}
              </p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {t.settingsPage.agentAlerts}
              </p>
              <p className="text-xs text-gray-500">
                {t.settingsPage.agentAlertsDesc}
              </p>
            </div>
            <Switch
              checked={agentAlerts}
              onCheckedChange={setAgentAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave}>{t.common.save} {t.settingsPage.title}</Button>
      </div>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t.settingsPage.dangerZone}</CardTitle>
          <CardDescription>
            {t.settingsPage.deleteAccountDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t.settingsPage.deleteAccount}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.settingsPage.deleteAccount}</DialogTitle>
                <DialogDescription>
                  {t.settingsPage.deleteAccountConfirm}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  {t.settingsPage.deleteAccount}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
