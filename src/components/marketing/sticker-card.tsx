import Link from "next/link";
import { HeroQr } from "./hero-qr";
import { DEMO_ROOM_URL } from "@/lib/site";

/**
 * Marketing replica of the printable room sticker (see /panel/qr/print):
 * dashed cut line, hotel eyebrow, big mono room number, URL as the manual
 * fallback. Both the QR (HeroQr) and the fallback URL lead to the demo
 * hotel's real room 101 guest page.
 */
export function StickerCard() {
  return (
    <figure className="w-full max-w-[330px] rotate-[-2deg] rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5 shadow-xl shadow-neutral-900/10 transition-transform duration-300 ease-out hover:rotate-0 md:rotate-[-3deg]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        Willa Mazury
      </p>
      <div className="mt-4 flex items-center gap-5">
        <div className="w-32 shrink-0 md:w-36">
          <HeroQr />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Zeskanuj kod telefonem
          </p>
          <p className="mt-1.5 font-mono text-4xl font-bold leading-none tracking-tight text-neutral-900">
            101
          </p>
          <p className="mt-1.5 text-xs text-neutral-600">Pokój standardowy</p>
          <p className="mt-2 font-mono text-[9px] leading-snug break-all text-neutral-400">
            <Link
              href="/willa-mazury/101"
              className="underline-offset-2 transition-colors hover:text-neutral-600 hover:underline"
            >
              {DEMO_ROOM_URL}
            </Link>
          </p>
        </div>
      </div>
    </figure>
  );
}
