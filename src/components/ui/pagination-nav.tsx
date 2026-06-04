import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function PaginationNav({ page, totalPages, buildHref }: Props) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;
  const btnCls = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {prevDisabled ? (
        <span className={cn(btnCls, "opacity-50 pointer-events-none")}>
          <ChevronLeft className="h-4 w-4" />
        </span>
      ) : (
        <Link href={buildHref(page - 1)} className={btnCls}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        Seite {page} von {totalPages}
      </span>
      {nextDisabled ? (
        <span className={cn(btnCls, "opacity-50 pointer-events-none")}>
          <ChevronRight className="h-4 w-4" />
        </span>
      ) : (
        <Link href={buildHref(page + 1)} className={btnCls}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
