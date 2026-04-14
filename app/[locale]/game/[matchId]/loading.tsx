import { Skeleton } from "@/shared/ui/skeleton";

export default function LoadingGamePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>

      <div className="surface-elevated rounded-2xl p-5">
        <div className="border-border flex items-start justify-between gap-4 border-b pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>

        <div className="grid gap-5 pt-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
