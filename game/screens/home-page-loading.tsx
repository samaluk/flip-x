import { Skeleton } from "@/shared/ui/skeleton";

export function HomePageLoading() {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <Skeleton radius="xl" className="mx-auto h-12 w-40" />
          <Skeleton radius="lg" className="mx-auto mt-2 h-4 w-64" />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton radius="lg" className="h-4 w-24" />
            <Skeleton radius="lg" className="h-10 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton radius="lg" className="h-4 w-28" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} radius="full" className="size-10" />
              ))}
            </div>
          </div>

          <Skeleton radius="lg" className="h-11 w-full" />
        </div>
      </div>
    </main>
  );
}
