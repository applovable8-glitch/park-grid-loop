import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Gift, Zap, Check, Loader2 } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { usePointsHistory } from "@/lib/profile-data";

export const Route = createFileRoute("/rewards/daily")({ component: Daily });

const days = [1, 2, 3, 4, 5, 6, 7];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function Daily() {
  const { user, refreshProfile } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { items, refresh } = usePointsHistory(user?.id, 100);
  const [busy, setBusy] = useState(false);

  const dailyTx = useMemo(() => items.filter((i) => i.reason === "daily"), [items]);

  const claimedToday = dailyTx.some((t) => sameDay(new Date(t.created_at), new Date()));

  const streak = useMemo(() => {
    let s = 0;
    const cursor = new Date();
    if (!claimedToday) cursor.setDate(cursor.getDate() - 1);
    for (let i = 0; i < 30; i++) {
      const hit = dailyTx.some((t) => sameDay(new Date(t.created_at), cursor));
      if (!hit) break;
      s += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return s;
  }, [dailyTx, claimedToday]);

  const nextDay = Math.min(7, (claimedToday ? streak : streak + 1) || 1);
  const reward = nextDay * 5;

  const claim = async () => {
    if (!user || claimedToday) return;
    setBusy(true);
    const { error } = await supabase.from("points_transactions").insert({ user_id: user.id, delta: reward, reason: "daily", metadata: { day: nextDay } });
    if (!error) await supabase.from("profiles").update({ points: (user.points ?? 0) + reward }).eq("user_id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(ar ? `+${reward} نقطة!` : `+${reward} points!`);
    await Promise.all([refreshProfile(), refresh()]);
  };

  return (
    <Screen title={ar ? "المكافآت اليومية" : "Daily rewards"} back="/rewards">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 text-[color:var(--emerald)]"><Zap className="h-6 w-6" /></div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{ar ? "التتابع" : "Streak"}</p>
            <p className="font-[var(--font-display)] text-2xl font-bold">{streak} {ar ? "يوم" : streak === 1 ? "day" : "days"}</p>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {days.map((d) => {
          const done = d <= streak;
          return (
            <div key={d} className={`flex aspect-square flex-col items-center justify-center rounded-2xl text-xs font-bold transition-all ${done ? "bg-[var(--emerald)] text-white" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
              <span className="mt-1">+{d * 5}</span>
            </div>
          );
        })}
      </div>

      <Button className="mt-6" variant="emerald" onClick={claim} disabled={busy || claimedToday}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" />
          : claimedToday ? (ar ? "تم الاستلام اليوم" : "Claimed today")
          : ar ? `استلم +${reward} نقطة` : `Claim +${reward} points`}
      </Button>
    </Screen>
  );
}
