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
      className={cn("space-y-10", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Loading</span>
      <div className="space-y-4">
        <Bone className="h-3 w-28" />
        <Bone className="h-12 w-64 max-w-full sm:w-80" />
        <Bone className="h-4 w-full max-w-xl" />
      </div>
      <div className="border-app-divider bg-app-wash space-y-4 border p-8">
        <Bone className="h-3 w-24" />
        <Bone className="h-8 w-48 max-w-full" />
        <Bone className="h-4 w-full max-w-lg" />
        <Bone className="h-4 w-3/4 max-w-md" />
      </div>
      {withRailHint ? (
        <div className="border-app-divider hidden space-y-3 border-t pt-8 xl:block">
          <Bone className="h-3 w-20" />
          <Bone className="h-40 w-full" />
        </div>
      ) : null}
    </div>
  );
}
