import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Screen, Row, RowGroup } from "@/components/kit";

export const Route = createFileRoute("/search/recent")({ component: Recent });

const recent = ["Sheikh Zayed Rd", "DIFC", "Marina Walk", "Downtown Blvd", "Al Wasl Rd"];

function Recent() {
  return (
    <Screen title="Recent searches" back="/home">
      <RowGroup>
        {recent.map((r) => <Row key={r} icon={Clock} label={r} to="/home" />)}
      </RowGroup>
    </Screen>
  );
}
