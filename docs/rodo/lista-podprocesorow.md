# Lista podprocesorów

Stan: 2026-11-20. Obowiązek informowania (umowa powierzenia / art. 28 RODO).
Kolejność alfabetyczna.

| Podprocesor | Rola | Lokalizacja przetwarzania | Instrument prawny transferu | Uwagi |
|---|---|---|---|---|
| Neon Tech, Inc. | Zarządzana baza danych PostgreSQL | UE (Frankfurt, aws-eu-central-1) | — (brak transferu poza EOG) | Region UE potwierdzony w `src/db/index.ts` |
| Resend, Inc. | Wysyłka e-maili transakcyjnych (reset hasła) | USA | DPA + SCC (dostępne w panelu Resend) | Treść: link resetujący; odbiorca: e-mail użytkownika |
| Vercel, Inc. | Hosting aplikacji + Vercel Blob (zdjęcia) | USA (global edge) | DPA (data processing agreement Vercel) | Logi żądań zawierają IP |
| z.ai (Zhipu AI) | Model językowy asystenta AI | Chiny | **BRAK** — brak decyzji o adekwatności, brak zawartych SCC | Patrz sekcja „Ryzyko" |

## Ryzyko: z.ai

- Brak decyzji Komisji Europejskiej o adekwatności dla Chin (art. 45 RODO) i
  brak podpisanych standardowych klauzul umownych (art. 46) = transfer
  niezgodny z art. 44, chyba że wyjątek doraźny (art. 49) — tu nie ma podstaw.
- Scope: treść rozmów asystenta; w trybie panelowym dodatkowo kontekst
  obiektu (SSID/hasło Wi-Fi, dane kontaktowe, treści pokoi). Hasła kont i
  identyfikatory użytkowników NIE są przesyłane.
- Środki zaradcze zastosowane: pełne ujawnienie w polityce prywatności
  (pkt 4), adnotacja w UI asystenta, brak persystencji rozmów po stronie
  serwera, minimizacja payloadu, kill-switch (usunięcie `ASSISTANT_API_KEY`
  ukrywa asystenta z UI).
- Rekomendacja docelowa: migracja na dostawcę z SCC/DPA (np. Anthropic —
  endpoint wymienia się zmienną `ASSISTANT_BASE_URL`, bez zmian kodu:
  `src/server/assistant/config.ts`).

## Zmiany listy

Przed dodaniem nowego podprocesora: (1) DPA/SCC, (2) wpis do
`rejestr-czynnosci-przetwarzania.md`, (3) aktualizacja polityki prywatności
(pkt 3) i `LEGAL_UPDATED` w `src/lib/site.ts`.
