import * as React from "react";

import { cn } from "@/lib/utils";
import { toSignedStorageUrl } from "@/lib/storageSignedUrl";

type Props = {
  invoiceUrl?: string | null;
  idFrontUrl?: string | null;
  idBackUrl?: string | null;
  onPreview: (url: string) => void;
  className?: string;
};

type DocItem = {
  key: "invoice" | "id_front" | "id_back";
  label: string;
  url: string;
  alt: string;
};

export function ClientDocThumbnails({ invoiceUrl, idFrontUrl, idBackUrl, onPreview, className }: Props) {
  const docs = React.useMemo<DocItem[]>(() => {
    const list: DocItem[] = [];
    if (invoiceUrl) list.push({ key: "invoice", label: "Factura", url: invoiceUrl, alt: "Factura o nota de venta" });
    if (idFrontUrl) list.push({ key: "id_front", label: "CI Anverso", url: idFrontUrl, alt: "Carnet de identidad (anverso)" });
    if (idBackUrl) list.push({ key: "id_back", label: "CI Reverso", url: idBackUrl, alt: "Carnet de identidad (reverso)" });
    return list;
  }, [invoiceUrl, idFrontUrl, idBackUrl]);

  const [signedUrls, setSignedUrls] = React.useState<Record<DocItem["key"], string | null>>({
    invoice: null,
    id_front: null,
    id_back: null,
  });

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const next: Record<DocItem["key"], string | null> = { invoice: null, id_front: null, id_back: null };
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
