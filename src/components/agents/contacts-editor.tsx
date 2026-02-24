"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { HotelContact } from "@/lib/mock-data";
import { toast } from "sonner";

interface ContactsEditorProps {
  agentId: string;
}

export function ContactsEditor({ agentId }: ContactsEditorProps) {
  const { contacts, loadContacts, addContact, updateContact, deleteContact } =
    useAgentStore();
  const { t } = useLocaleStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HotelContact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadContacts(agentId);
  }, [agentId, loadContacts]);

  const agentContacts = contacts.filter((c) => c.agentId === agentId);

  function openNew() {
    setEditing(null);
    setName("");
    setPhone("");
    setCategory("");
    setDescription("");
    setDialogOpen(true);
  }

  function openEdit(contact: HotelContact) {
    setEditing(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setCategory(contact.category);
    setDescription(contact.description ?? "");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim() || !phone.trim()) {
      toast.error(t.contacts.required);
      return;
    }

    if (editing) {
      updateContact(editing.id, {
        name: name.trim(),
        phone: phone.trim(),
        category: category.trim() || "General",
        description: description.trim() || undefined,
      });
      toast.success(t.contacts.contactUpdated);
    } else {
      addContact({
        agentId,
        name: name.trim(),
        phone: phone.trim(),
        category: category.trim() || "General",
        description: description.trim() || undefined,
        isActive: true,
      });
      toast.success(t.contacts.contactAdded);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteContact(id);
    toast.success(t.contacts.contactDeleted);
  }

  function handleToggle(contact: HotelContact) {
    updateContact(contact.id, { isActive: !contact.isActive });
  }

  const categories = [...new Set(agentContacts.map((c) => c.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {agentContacts.length} {t.contacts.title.toLowerCase()}
        </span>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" />
          {t.contacts.addContact}
        </Button>
      </div>

      {agentContacts.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-black/[0.04]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
            <Phone className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="font-semibold mb-1">{t.contacts.noContactsTitle}</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
            {t.contacts.noContactsDescription}
          </p>
          <Button size="sm" onClick={openNew}>
            {t.contacts.addFirstContact}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                {cat}
              </h3>
              {agentContacts
                .filter((c) => c.category === cat)
                .map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-xl bg-white p-3.5 ring-1 ring-black/[0.04] mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Phone className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[17px] font-medium truncate">
                          {contact.name}
                        </p>
                        <p className="text-[15px] text-muted-foreground truncate">
                          {contact.phone}
                          {contact.description && ` · ${contact.description}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Switch
                          checked={contact.isActive}
                          onCheckedChange={() => handleToggle(contact)}
                          className="scale-75"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(contact)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t.contacts.editContact : t.contacts.addContact}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">{t.contacts.name}</Label>
              <Input
                id="contact-name"
                placeholder={t.contacts.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">{t.contacts.phone}</Label>
              <Input
                id="contact-phone"
                type="tel"
                placeholder={t.contacts.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-category">{t.contacts.category}</Label>
              <Input
                id="contact-category"
                placeholder={t.contacts.categoryPlaceholder}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-desc">{t.contacts.descriptionField}</Label>
              <Input
                id="contact-desc"
                placeholder={t.contacts.descriptionPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave}>
              {editing ? t.contacts.saveChanges : t.contacts.addContact}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
