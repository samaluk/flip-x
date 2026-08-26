import { Skeleton } from "@/shared/ui/skeleton";

export function HomePageLoading() {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center px-6">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center">
          <Skeleton className="mx-auto h-12 w-40 rounded-xl" />
          <Skeleton className="mx-auto mt-2 h-4 w-64 rounded-lg" />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </div>
          </div>

          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </main>
  );
}
