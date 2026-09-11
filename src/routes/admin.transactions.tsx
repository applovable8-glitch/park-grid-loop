import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminHeader, AdminSearch, StatusPill, TableShell } from "@/components/admin/AdminTable";
import { usePointsLedger } from "@/lib/admin-finance";
import { useUserDirectory, fmtDateTime, dash, useSearch, shortRef } from "@/lib/admin-tables";

export const Route = createFileRoute("/admin/transactions")({
  head: () => ({ meta: [{ title: "Transactions — AndiPark Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTransactions;
});

function AdminTransactions() {
  return null;
}
