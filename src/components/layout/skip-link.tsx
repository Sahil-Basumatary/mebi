import { cn } from "@/lib/utils";

type SkipLinkProps = {
  href?: string;
  className?: string;
};

export function SkipLink({ href = "#main-content", className }: SkipLinkProps) {
  return (
    <a href={href} className={cn("skip-link", className)}>
      Skip to content
    </a>
  );
}
