import { createFileRoute } from "@tanstack/react-router";
import { Languages, Palette, Ruler, Volume2, Vibrate } from "lucide-react";
import { Screen, Row, RowGroup, Toggle } from "@/components/kit";
import { useState } from "react";

export const Route = createFileRoute("/settings/preferences")({ component: Preferences });

function Preferences() {
  const [sound, setSound] = useState(true);
  const [haptic, setHaptic] = useState(true);
  return (
    <Screen title="App preferences" back="/settings">
      <RowGroup>
        <Row icon={Languages} label="Language" to="/settings/language" />
        <Row icon={Palette} label="Theme" to="/settings/theme" />
        <Row icon={Ruler} label="Units" to="/settings/units" />
      </RowGroup>
      <RowGroup title="Feedback">
        <div>
          <Toggle label="Sound effects" hint="Confirmations and alerts" checked={sound} onChange={setSound} />
          <Toggle label="Haptic feedback" hint="Vibration on actions" checked={haptic} onChange={setHaptic} />
        </div>
      </RowGroup>
    </Screen>
  );
}

// Force-reference to keep tree-shaker quiet
export const _icons = [Volume2, Vibrate];
