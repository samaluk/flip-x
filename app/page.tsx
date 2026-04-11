import { MatchSetup } from "@/components/game/match-setup";

export default function Home() {
  return (
    <main className="flex flex-1 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_40%),linear-gradient(180deg,_var(--background),_color-mix(in_oklab,_var(--background)_92%,_black))]">
      <MatchSetup />
    </main>
  );
}
