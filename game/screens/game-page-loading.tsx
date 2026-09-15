import { Skeleton } from "@/shared/ui/skeleton";

export function GamePageLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton radius="xl" className="h-12 w-36" />
          <Skeleton radius="lg" className="h-10 w-28" />
        </div>
        <Skeleton radius="lg" className="h-9 w-36" />
      </div>

      <div className="surface-elevated rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-2">
            <Skeleton radius="lg" className="h-6 w-44" />
            <Skeleton radius="lg" className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton radius="full" className="h-6 w-20" />
            <Skeleton radius="full" className="h-6 w-24" />
          </div>
        </div>

        <div className="grid gap-5 pt-5 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <Skeleton radius="xl" className="h-24 w-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} radius="xl" className="h-28 w-full" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton radius="xl" className="h-36 w-full" />
            <Skeleton radius="xl" className="h-24 w-full" />
          </div>
        </div>
      </div>

      <Skeleton radius="2xl" className="h-48 w-full" />
    </div>
  );
}
