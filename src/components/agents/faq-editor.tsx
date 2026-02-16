"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { faqTemplates } from "@/lib/mock-data";
import type { FAQ } from "@/lib/mock-data";
import { sendWebhook } from "@/lib/webhook";
import { toast } from "sonner";

interface FaqEditorProps {
  agentId: string;
}

export function FaqEditor({ agentId }: FaqEditorProps) {
  const { faqs, addFaq, updateFaq, deleteFaq } = useAgentStore();
  const { t } = useLocaleStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");

  const agentFaqs = faqs.filter((f) => f.agentId === agentId);

  function openNew() {
    setEditingFaq(null);
    setQuestion("");
    setAnswer("");
    setCategory("General");
    setDialogOpen(true);
  }

  function openEdit(faq: FAQ) {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!question.trim() || !answer.trim()) {
      toast.error(t.faqEditor.required);
      return;
    }

    if (editingFaq) {
      updateFaq(editingFaq.id, {
        question: question.trim(),
        answer: answer.trim(),
        category,
      });
      toast.success(t.faqEditor.faqUpdated);
    } else {
      addFaq({
        agentId,
        question: question.trim(),
        answer: answer.trim(),
        category,
        isActive: true,
      });
      toast.success(t.faqEditor.faqAdded);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    deleteFaq(id);
    toast.success(t.faqEditor.faqDeleted);
  }

  function handleToggle(faq: FAQ) {
    updateFaq(faq.id, { isActive: !faq.isActive });
  }

  function loadTemplates() {
    faqTemplates.forEach((tpl) => {
      addFaq({
        agentId,
        question: tpl.question,
        answer: tpl.answer,
        category: tpl.category,
        isActive: true,
      });
    });
    sendWebhook("faq.templates_loaded", { agentId, templates: faqTemplates });
    toast.success(t.faqEditor.templatesLoaded);
  }

  const categories = [...new Set(agentFaqs.map((f) => f.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {agentFaqs.length} {t.agents.faqs}
          </span>
        </div>
        <div className="flex gap-2">
          {agentFaqs.length === 0 && (
            <Button variant="outline" size="sm" onClick={loadTemplates}>
              {t.faqEditor.loadTemplates}
            </Button>
          )}
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" />
            {t.faqEditor.addFaq}
          </Button>
        </div>
      </div>

      {agentFaqs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-blue-50 p-3 mb-4">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-1">{t.faqEditor.noFaqsTitle}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {t.faqEditor.noFaqsDescription}
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={openNew}>
                {t.faqEditor.addFirstFaq}
              </Button>
              <Button size="sm" variant="outline" onClick={loadTemplates}>
                {t.faqEditor.useHotelTemplates}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                {cat}
              </h3>
              {agentFaqs
                .filter((f) => f.category === cat)
                .map((faq) => (
                  <Card key={faq.id} className="mb-2">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={faq.isActive}
                            onCheckedChange={() => handleToggle(faq)}
                            className="scale-75"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(faq)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(faq.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? t.faqEditor.editFaq : t.faqEditor.addFaq}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="faq-question">{t.faqEditor.question}</Label>
              <Input
                id="faq-question"
                placeholder={t.faqEditor.questionPlaceholder}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-answer">{t.faqEditor.answer}</Label>
              <Textarea
                id="faq-answer"
                placeholder={t.faqEditor.answerPlaceholder}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="faq-category">{t.faqEditor.category}</Label>
              <Input
                id="faq-category"
                placeholder={t.faqEditor.categoryPlaceholder}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleSave}>
              {editingFaq ? t.faqEditor.saveChanges : t.faqEditor.addFaq}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
