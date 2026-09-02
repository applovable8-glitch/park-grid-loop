import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera, Loader2, Save } from "lucide-react";
import { useApp, type NotificationPrefs, type LocationPrefs } from "@/lib/parkout-store";

export const Route = createFileRoute("/profile/edit")({ component: EditProfile });

function EditProfile() {
  const { user, session, loading, updateProfile, uploadAvatar } = useApp();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth" });
  }, [loading, session, nav]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [carType, setCarType] = useState("Sedan");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("White");
  const [showPhone, setShowPhone] = useState(true);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("system");
  const [notif, setNotif] = useState<NotificationPrefs>({ push: true, nearby_spots: true, reservations: true, points: true });
  const [loc, setLoc] = useState<LocationPrefs>({ radius_m: 800, share_location: true });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setPhone(user.phone ?? "");
    setPlate(user.plate ?? "");
    setCarType(user.car_type ?? "Sedan");
    setMake(user.car_make ?? "");
    setModel(user.car_model ?? "");
    setColor(user.car_color ?? "White");
    setShowPhone(user.show_phone ?? true);
    setLanguage(user.language);
    setTheme(user.theme);
    setNotif(user.notification_prefs);
    setLoc(user.location_prefs);
  }, [user]);

  if (loading || !user) return null;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setUploading(true);
    const { error } = await uploadAvatar(file);
    setUploading(false);
    if (error) toast.error(error);
    else toast.success("Avatar updated");
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await updateProfile({
      name: name.trim(), phone: phone.trim() || null, plate: plate.trim().toUpperCase() || null,
      car_type: carType, car_make: make.trim() || null, car_model: model.trim() || null,
      car_color: color, show_phone: showPhone,
      language, theme, notification_prefs: notif, location_prefs: loc,
    });
    setBusy(false);
    if (error) toast.error(error);
    else { toast.success("Profile saved"); nav({ to: "/profile" }); }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><ArrowLeft className="h-4 w-4" /></Link>
        <h1 className="font-[var(--font-display)] text-lg font-bold">Edit profile</h1>
      </div>

      <form onSubmit={submit} className="space-y-6 px-5 pt-3">
        <div className="flex flex-col items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="h-24 w-24 rounded-3xl object-cover ring-2 ring-border" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald text-emerald-foreground font-[var(--font-display)] text-4xl font-bold">{user.avatar}</div>
            )}
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <p className="text-xs text-muted-foreground">Tap to change photo</p>
        </div>

        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className={inputCls} />
        </Field>
        <Field label="Phone number">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="+971 50 000 0000" maxLength={30} className={inputCls} />
        </Field>
        <Field label="Vehicle plate">
          <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="DXB A 12345" maxLength={16} className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Car type">
            <select value={carType} onChange={(e) => setCarType(e.target.value)} className={inputCls}>
              {["Sedan","SUV","Hatchback","Pickup","Van","Coupe","Electric"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Colour">
            <select value={color} onChange={(e) => setColor(e.target.value)} className={inputCls}>
              {["White","Black","Silver","Grey","Blue","Red","Green","Other"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Make"><input value={make} onChange={(e) => setMake(e.target.value)} className={inputCls} placeholder="Toyota" /></Field>
          <Field label="Model"><input value={model} onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Camry" /></Field>
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-muted p-3 text-sm">
          <input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} className="h-4 w-4 accent-[var(--emerald)]" />
          Let other drivers call me on my number
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Language">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
          </Field>
          <Field label="Theme">
            <select value={theme} onChange={(e) => setTheme(e.target.value)} className={inputCls}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Field>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notifications</h3>
          <div className="space-y-2 rounded-2xl bg-card p-1 shadow-[var(--shadow-card)]">
            <Toggle label="Push notifications" checked={notif.push} onChange={(v) => setNotif({ ...notif, push: v })} />
            <Toggle label="Nearby parking spots" checked={notif.nearby_spots} onChange={(v) => setNotif({ ...notif, nearby_spots: v })} />
            <Toggle label="Reservations" checked={notif.reservations} onChange={(v) => setNotif({ ...notif, reservations: v })} />
            <Toggle label="Points & rewards" checked={notif.points} onChange={(v) => setNotif({ ...notif, points: v })} />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</h3>
          <div className="space-y-2 rounded-2xl bg-card p-1 shadow-[var(--shadow-card)]">
            <Toggle label="Share my location" checked={loc.share_location} onChange={(v) => setLoc({ ...loc, share_location: v })} />
            <div className="px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Search radius</span>
                <span className="text-muted-foreground">{loc.radius_m}m</span>
              </div>
              <input type="range" min={200} max={3000} step={100} value={loc.radius_m}
                onChange={(e) => setLoc({ ...loc, radius_m: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--emerald)]" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save changes</>}
        </button>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-[var(--emerald)] focus:ring-4 focus:ring-emerald/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-muted">
      <span className="text-sm font-medium">{label}</span>
      <span className={`relative flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[var(--emerald)]" : "bg-border"}`}>
        <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}
