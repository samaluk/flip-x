export interface HomeHeaderProps {
  title: string;
  subtitle: string;
}

export function HomeHeader({ title, subtitle }: HomeHeaderProps) {
  return (
    <div className="text-center">
      <h1 className="text-5xl font-medium tracking-tighter text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
