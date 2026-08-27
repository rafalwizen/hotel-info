"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type QrRoomRow = {
  id: string;
  number: string;
  namePl: string;
  path: string;
  svg: string;
};

type Props = {
  lobby: { url: string; svg: string };
  rooms: QrRoomRow[];
  unprintable: Array<{ id: string; number: string }>;
};

/** Inline QR preview — the library SVG scales to its box. */
function QrPreview({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("[&>svg]:h-full [&>svg]:w-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Polish plural forms for "naklejka": 1 naklejka, 3 naklejki, 5 naklejek. */
function pluralStickers(n: number): string {
  if (n === 1) return "naklejka";
  const last = n % 10;
  const hundreds = n % 100;
  if (last >= 2 && last <= 4 && (hundreds < 12 || hundreds > 14)) return "naklejki";
  return "naklejek";
}

/**
 * Sticker picker. Selection drives the print sheet link; every row also
 * exposes its PNG download (tenancy-checked /api/qr/...).
 */
export function QrCenter({ lobby, rooms, unprintable }: Props) {
  const [lobbyOn, setLobbyOn] = useState(true);
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(rooms.map((room) => room.id)),
  );

  const printHref = useMemo(() => {
    const params = new URLSearchParams();
    if (lobbyOn) params.set("lobby", "1");
    const ids = rooms.filter((room) => selected.has(room.id)).map((room) => room.id);
    if (ids.length > 0) params.set("rooms", ids.join(","));
    const query = params.toString();
    return query ? `/panel/qr/print?${query}` : "/panel/qr/print";
  }, [lobbyOn, rooms, selected]);

  const stickerCount = (lobbyOn ? 1 : 0) + [...selected].length;
  const nothingSelected = stickerCount === 0;

  function toggleRoom(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allRoomsSelected = rooms.length > 0 && rooms.every((room) => selected.has(room.id));

  function toggleAllRooms() {
    setSelected(allRoomsSelected ? new Set() : new Set(rooms.map((room) => room.id)));
  }

  return (
    <>
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kody QR</h1>
        <p className="text-sm text-muted-foreground">
          Wydrukuj naklejki i przyklej je w pokojach. Gość skanuje kod telefonem i od razu
          widzi stronę ze wszystkimi informacjami — bez logowania, bez aplikacji.
        </p>
      </header>

      {rooms.length === 0 && unprintable.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Najpierw dodaj pokoje — każda naklejka prowadzi do strony jednego pokoju.
          </p>
          <Button asChild className="mt-4">
            <Link href="/panel/pokoje">Dodaj pokój</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Lobby sticker — the one code for the whole hotel */}
          <section className="rounded-xl border">
            <label className="flex cursor-pointer items-center gap-4 p-4">
              <input
                type="checkbox"
                checked={lobbyOn}
                onChange={() => setLobbyOn((v) => !v)}
                className="size-4 shrink-0 accent-foreground"
              />
              <QrPreview svg={lobby.svg} className="size-20 shrink-0 rounded-md border p-1" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Hol / recepcja</span>
                  <Badge className="bg-primary/10 text-primary">cały hotel</Badge>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Prowadzi do strony z Wi-Fi, godzinami i listą pokoi — idealny na recepcję.
                </span>
                <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                  {lobby.url}
                </span>
              </span>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <a href="/api/qr/hotel" download>
                  <Download className="size-4" /> PNG
                </a>
              </Button>
            </label>
          </section>

          {/* Room stickers */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Pokoje</h2>
              {rooms.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllRooms}
                  className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {allRoomsSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                </button>
              )}
            </div>
            <ul className="divide-y rounded-xl border">
              {rooms.map((room) => {
                const checked = selected.has(room.id);
                return (
                  <li key={room.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-4 p-4 transition-colors",
                        checked ? "bg-muted/40" : "hover:bg-muted/30",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRoom(room.id)}
                        className="size-4 shrink-0 accent-foreground"
                      />
                      <QrPreview svg={room.svg} className="size-16 shrink-0 rounded-md border p-1" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="font-mono text-lg font-semibold">{room.number}</span>
                          <span className="truncate text-sm">{room.namePl}</span>
                        </span>
                        <span className="mt-1 block truncate font-mono text-xs text-muted-foreground">
                          {room.path}
                        </span>
                      </span>
                      <Button asChild variant="outline" size="sm" className="shrink-0">
                        <a href={`/api/qr/${room.id}`} download>
                          <Download className="size-4" /> PNG
                        </a>
                      </Button>
                    </label>
                  </li>
                );
              })}

              {unprintable.map((room) => (
                <li key={room.id} className="flex items-center gap-4 p-4 opacity-60">
                  <div className="size-4 shrink-0" />
                  <div className="flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed">
                    <span className="font-mono text-xs text-muted-foreground">QR</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="font-mono text-lg font-semibold">{room.number}</span>
                      <Badge className="border-border bg-transparent text-muted-foreground">
                        nieopublikowany
                      </Badge>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Opublikuj pokój, aby wydrukować jego naklejkę — jego strona jest teraz
                      niedostępna dla gości.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Print action */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {nothingSelected ? (
                "Wybierz przynajmniej jedną naklejkę."
              ) : (
                <>
                  Wydrukuje się{" "}
                  <strong className="font-semibold text-foreground">{stickerCount}</strong>{" "}
                  {pluralStickers(stickerCount)} na arkuszu A4.
                </>
              )}
            </p>
            <Button asChild disabled={nothingSelected}>
              {/* New tab keeps the checklist state while the sheet auto-prints */}
              <a href={printHref} target="_blank" rel="noreferrer">
                <Printer className="size-4" /> Drukuj naklejki
              </a>
            </Button>
          </div>
        </>
      )}
    </>
  );
}
