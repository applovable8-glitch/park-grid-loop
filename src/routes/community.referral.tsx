import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Users } from "lucide-react";
import { Screen, Card, Button } from "@/components/kit";
import { useApp } from "@/lib/parkout-store";
import { useI18n } from "@/lib/i18n";
import { useReferral } from "@/lib/referrals";

export const Route = createFileRoute("/community/referral")({ component: ReferralProgram });

const GOAL = 5;

function ReferralProgram() {
  const { user } = useApp();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { friends, code } = useReferral(user?.id);
  const count = friends.length;
  const pct = Math.min(100, (count / GOAL) * 100);

  return (
    <Screen title={ar ? "برنامج الإحالة" : "Referral program"} back="/community">
      <Card>
        <div className="flex h-14 w-14 animate-scale-in items-center justify-center rounded-3xl bg-emerald/15 text-[color:var(--emerald)]"><Gift className="h-7 w-7" /></div>
        <h2 className="mt-3 font-[var(--font-display)] text-lg font-bold">
          {ar ? `ادعُ ${GOAL} أصدقاء · افتح AndiPark Plus` : `Refer ${GOAL} friends · Unlock AndiPark Plus`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar ? `لقد دعوت ${count} من ${GOAL}.` : `You've referred ${count} out of ${GOAL}.`}
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-[var(--emerald)] transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        {code && (
          <p className="mt-3 text-xs text-muted-foreground">
            {ar ? "رمزك" : "Your code"}: <span className="font-[var(--font-display)] font-bold tracking-widest text-foreground">{code}</span>
          </p>
        )}
      </Card>

      <Card className="mt-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-[color:var(--emerald)]" /> {ar ? "أصدقاء انضموا" : "Friends joined"}</p>
        {count === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">{ar ? "لم ينضم أحد بعد." : "Nobody has joined yet."}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {friends.map((f) => (
              <span key={f.id} className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{f.name}</span>
            ))}
          </div>
        )}
      </Card>

      <Link to="/rewards/invite"><Button className="mt-4" variant="emerald">{ar ? "ادعُ المزيد" : "Invite more friends"}</Button></Link>
    </Screen>
  );
}
