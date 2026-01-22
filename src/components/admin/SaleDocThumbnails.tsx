import * as React from "react";

import { cn } from "@/lib/utils";
import { toSignedStorageUrl } from "@/lib/storageSignedUrl";

type Props = {
  tagUrl?: string | null;
  policyUrl?: string | null;
  invoiceUrl?: string | null;
  onPreview: (url: string) => void;
  className?: string;
};

type DocItem = {
  key: "tag" | "policy" | "invoice";
  label: string;
  url: string;
  alt: string;
};

export function SaleDocThumbnails({ tagUrl, policyUrl, invoiceUrl, onPreview, className }: Props) {
  const docs = React.useMemo<DocItem[]>(() => {
    const list: DocItem[] = [];
    if (tagUrl) list.push({ key: "tag", label: "TAG", url: tagUrl, alt: "TAG de póliza" });
    if (policyUrl) list.push({ key: "policy", label: "Póliza", url: policyUrl, alt: "Póliza de garantía" });
    if (invoiceUrl) list.push({ key: "invoice", label: "Factura", url: invoiceUrl, alt: "Factura o nota de venta" });
    return list;
  }, [tagUrl, policyUrl, invoiceUrl]);

  const [signedUrls, setSignedUrls] = React.useState<Record<DocItem["key"], string | null>>({
    tag: null,
    policy: null,
    invoice: null,
  });

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const next: Record<DocItem["key"], string | null> = { tag: null, policy: null, invoice: null };
      await Promise.all(
        docs.map(async (d) => {
          next[d.key] = await toSignedStorageUrl(d.url);
        })
      );
      if (alive) setSignedUrls(next);
    })();

    return () => {
      alive = false;
    };
  }, [docs]);

  if (docs.length === 0) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {docs.map((doc) => (
        (() => {
          const url = signedUrls[doc.key] ?? doc.url;
          return (
            <button
              key={doc.key}
              type="button"
              onClick={() => onPreview(url)}
              className={cn(
                "group relative h-10 w-14 overflow-hidden rounded-md border border-border bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-label={`Ver ${doc.label}`}
              title={`Ver ${doc.label}`}
            >
              <img src={url} alt={doc.alt} loading="lazy" className="h-full w-full object-cover" />
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0",
                  "bg-background/80 px-1 py-0.5 text-[10px] text-foreground text-center",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                )}
              >
                {doc.label}
              </span>
            </button>
          );
        })()
      ))}
    </div>
  );
}
