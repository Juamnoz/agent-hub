"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Users,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Tag,
  Star,
  X,
  StickyNote,
} from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import type { CRMClient } from "@/lib/mock-data";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const initialsColors = [
  "from-orange-400 to-orange-500",
  "from-violet-400 to-violet-500",
  "from-emerald-400 to-emerald-500",
  "from-amber-400 to-amber-500",
  "from-rose-400 to-rose-500",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return initialsColors[Math.abs(hash) % initialsColors.length];
}

const tagColors: Record<string, string> = {
  vip: "bg-amber-100 text-amber-700",
  frecuente: "bg-orange-100 text-orange-700",
  nuevo: "bg-emerald-100 text-emerald-700",
};

const statusColors: Record<string, string> = {
  vip: "bg-amber-50 text-amber-700 ring-amber-200",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-gray-50 text-gray-600 ring-gray-200",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CRMClientList({ agentId }: { agentId: string }) {
  const { clients, loadClients, updateClient } = useAgentStore();
  const { t } = useLocaleStore();
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<CRMClient | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  useEffect(() => {
    loadClients(agentId);
  }, [agentId, loadClients]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach((c) => c.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [clients]);

  const filtered = useMemo(() => {
    let result = clients;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    if (filterTag !== "all") {
      result = result.filter((c) => c.tags.includes(filterTag));
    }
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }
    return result;
  }, [clients, search, filterTag, filterStatus]);

  const statusLabels: Record<string, string> = {
    vip: t.crm.vip,
    active: t.crm.active,
    inactive: t.crm.inactive,
  };

  return (
    <>
      <div className="space-y-3">
        {/* Search + Filters */}
        <div className="rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.conversations.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-gray-100/80 py-2 pl-9 pr-3 text-[14px] outline-none placeholder:text-gray-400 focus:bg-gray-100 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
          {/* Filter chips */}
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              active={filterTag === "all"}
              onClick={() => setFilterTag("all")}
              label={t.crm.allTags}
            />
            {allTags.map((tag) => (
              <FilterChip
                key={tag}
                active={filterTag === tag}
                onClick={() => setFilterTag(tag)}
                label={tag}
              />
            ))}
            <span className="w-px h-6 bg-gray-200 mx-1" />
            <FilterChip
              active={filterStatus === "all"}
              onClick={() => setFilterStatus("all")}
              label={t.crm.allStatus}
            />
            {(["active", "inactive", "vip"] as const).map((s) => (
              <FilterChip
                key={s}
                active={filterStatus === s}
                onClick={() => setFilterStatus(s)}
                label={statusLabels[s]}
              />
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 px-1">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-[13px] text-gray-500">
            {filtered.length} {t.crm.clients}
          </span>
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white ring-1 ring-black/[0.04]">
            <Users className="h-10 w-10 text-gray-200 mb-3" />
            <p className="text-[14px] text-gray-400">{t.crm.noClients}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClient(client);
                  setNotesValue(client.notes || "");
                  setEditingNotes(false);
                }}
                className="w-full text-left rounded-2xl bg-white ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04)] p-4 transition-all active:scale-[0.98] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(
                      client.name
                    )} shadow-sm`}
                  >
                    <span className="text-[13px] font-semibold text-white">
                      {getInitials(client.name)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold truncate">{client.name}</span>
                      {client.status === "vip" && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500">{client.phone}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {client.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          tagColors[tag] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2.5 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {client.totalMessages} msgs
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(client.lastContactAt)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Client Detail Dialog */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedClient(null)}
          />
          <div className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl bg-white shadow-xl animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-black/[0.06] px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="text-[17px] font-bold">{selectedClient.name}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Contact info */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getColor(
                    selectedClient.name
                  )} shadow-sm`}
                >
                  <span className="text-[16px] font-bold text-white">
                    {getInitials(selectedClient.name)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-bold">{selectedClient.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ${
                        statusColors[selectedClient.status]
                      }`}
                    >
                      {statusLabels[selectedClient.status]}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedClient.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          tagColors[tag] || "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="space-y-2.5">
                <InfoRow icon={Phone} label={selectedClient.phone} />
                {selectedClient.email && (
                  <InfoRow icon={Mail} label={selectedClient.email} />
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  label={t.crm.totalConversations}
                  value={String(selectedClient.totalConversations)}
                />
                <StatCard
                  label={t.crm.totalMessages}
                  value={String(selectedClient.totalMessages)}
                />
                <StatCard
                  label={t.crm.firstContact}
                  value={formatDate(selectedClient.firstContactAt)}
                />
                <StatCard
                  label={t.crm.lastContact}
                  value={formatDate(selectedClient.lastContactAt)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-gray-400" />
                  <span className="text-[13px] font-semibold text-gray-600">{t.crm.notes}</span>
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-[14px] outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="px-3 py-1.5 text-[13px] font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {t.common.cancel}
                      </button>
                      <button
                        onClick={() => {
                          updateClient(selectedClient.id, { notes: notesValue });
                          setSelectedClient({ ...selectedClient, notes: notesValue });
                          setEditingNotes(false);
                        }}
                        className="px-3 py-1.5 text-[13px] font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        {t.common.save}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="w-full text-left rounded-xl bg-gray-50 px-3 py-2.5 text-[14px] text-gray-600 hover:bg-gray-100 transition-colors min-h-[60px]"
                  >
                    {selectedClient.notes || (
                      <span className="text-gray-400 italic">{t.crm.addNote}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
        active
          ? "bg-orange-500 text-white shadow-sm"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[14px] text-gray-600">
      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-[16px] font-bold mt-0.5">{value}</p>
    </div>
  );
}
