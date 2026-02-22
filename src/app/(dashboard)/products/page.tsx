"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Plus, Bot } from "lucide-react";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductsEditor } from "@/components/agents/products-editor";
import type { AlgorithmType } from "@/lib/mock-data";

const PRODUCT_ALGORITHM_TYPES: AlgorithmType[] = ["whatsapp-store", "ecommerce", "restaurant"];

export default function ProductsPage() {
  const { agents, loadProducts } = useAgentStore();
  const { t } = useLocaleStore();

  const eligibleAgents = agents.filter(
    (a) => a.algorithmType && PRODUCT_ALGORITHM_TYPES.includes(a.algorithmType)
  );

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (eligibleAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(eligibleAgents[0].id);
    }
  }, [eligibleAgents, selectedAgentId]);

  useEffect(() => {
    if (selectedAgentId) {
      loadProducts(selectedAgentId);
    }
  }, [selectedAgentId, loadProducts]);

  if (eligibleAgents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-full bg-orange-50 p-4 mb-4">
          <Package className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {t.products.noProductsTitle}
        </h2>
        <p className="mb-4 text-sm text-gray-500 max-w-md">
          {t.products.noProductsDescription}
        </p>
        <Button asChild>
          <Link href="/agents">{t.nav.agents}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Agent selector — solo si hay más de uno */}
      {eligibleAgents.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {eligibleAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedAgentId === agent.id
                  ? "bg-orange-100 text-orange-700"
                  : "bg-white text-muted-foreground ring-1 ring-black/[0.06] hover:bg-gray-50"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              {agent.name}
              {agent.productCount > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {agent.productCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedAgentId && <ProductsEditor agentId={selectedAgentId} />}
    </div>
  );
}
