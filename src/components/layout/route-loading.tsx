import { cn } from "@/lib/utils";

type RouteLoadingProps = {
  className?: string;
  withRailHint?: boolean;
};

function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-app-divider/70 route-bone rounded-[1px]", className)} />;
}

export function RouteLoading({ className, withRailHint = false }: RouteLoadingProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div className="space-y-2">
        <Bone className="h-3 w-20" />
        <Bone className="h-8 w-40 max-w-full" />
        <Bone className="h-3 w-56 max-w-full" />
      </div>
      <div className="border-app-divider bg-app-paper border">
        <div className="border-app-divider border-b px-4 py-2.5">
          <Bone className="h-4 w-28" />
        </div>
        <div className="divide-app-divider divide-y">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-2.5">
              <Bone className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Bone className="h-3.5 w-40 max-w-full" />
                <Bone className="h-3 w-24 max-w-[60%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {withRailHint ? (
        <div className="border-app-divider hidden space-y-3 border-t pt-4 xl:block">
          <Bone className="h-3 w-20" />
          <Bone className="h-32 w-full" />
        </div>
      ) : null}
    </div>
  );
}
