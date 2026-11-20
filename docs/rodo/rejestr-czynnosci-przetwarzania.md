# Rejestr czynności przetwarzania danych osobowych

Wewnętrzny dokument zgodności (RODO art. 30 ust. 1–2). Administrator: stałe
`OPERATOR_*` w `src/lib/site.ts`. Ostatnia aktualizacja: 2026-11-20.

| # | Czynność | Cel | Podstawa (art. 6 RODO) | Kategorie osób | Kategorie danych | Odbiorcy | Transfer poza EOG | Retencja |
|---|----------|-----|------------------------|----------------|-------------------|----------|-------------------|----------|
| 1 | Konto użytkownika (panel) | zawarcie/realizacja umowy, uwierzytelnianie | lit. b | hotelarze (użytkownicy panelu) | imię, e-mail, hash bcrypt hasła, timestamp akceptacji regulaminu | Neon (UE) | nie | do usunięcia konta |
| 2 | Reset hasła | bezpieczne odzyskanie dostępu | lit. f | hotelarze | e-mail, hash SHA-256 tokenu | Neon (UE), Resend (USA, SCC) | tak (Resend) | 1 h / do użycia |
| 3 | Treści obiektu na stronach gości | świadczenie usługi (strony QR) | lit. b — hotel jest administratorem, operator jest podmiotem przetwarzającym | goście hotelowi (odbiorcy treści) | dane kontaktowe obiektu, SSID/hasło Wi-Fi, treści pokoi | Neon (UE), Vercel (USA, DPA) | tak (Vercel — hosting) | do usunięcia konta hotelu |
| 4 | Zdjęcia przewodników dojazdu | wyświetlanie na stronach gości | lit. b — jw. | — (brak danych osobowych poza przypadkowymi) | pliki graficzne | Vercel Blob (USA, DPA) | tak | do usunięcia kroku/konta |
| 5 | Asystent AI — tryb publiczny | odpowiedzi na pytania o serwis | lit. f | odwiedzający stronę marketingową | treść wiadomości czatu | z.ai (Chiny, **bez adekwatności/SCC** — patrz lista podprocesorów) | tak | brak zapisu serwerowego; localStorage klienta, max 30 wiad. |
| 6 | Asystent AI — tryb panelu | pomoc w zarządzaniu danymi obiektu | lit. b, lit. f | hotelarze | treść rozmowy + kontekst obiektu (nazwa, kontakty, SSID/hasło Wi-Fi, treści pokoi) | z.ai (Chiny, **bez adekwatności/SCC**) | tak | brak zapisu serwerowego; sessionStorage klienta, max 30 wiad. |
| 7 | Rate limiting (logowanie, reset, asystent publiczny) | ochrona przed nadużyciami | lit. f | hotelarze, odwiedzający | adres IP | — | nie | ≤ 15 min, tylko pamięć procesu |
| 8 | Logi platformy (Vercel) | diagnostyka, bezpieczeństwo | lit. f | hotelarze, odwiedzający | adresy IP, metadane żądań (bez treści haseł/tokenów — dev-fallback e-maila loguje tylko metadane) | Vercel (USA, DPA) | tak | wg polityki Vercel (dni) |

## Uwagi

- **Dual role**: w wierszach 1–2 operatorem-administratorem jest właściciel
  serwisu; w wierszach 3–4 administratorem jest hotel, a serwis działa jako
  podmiot przetwarzający na jego polecenie (regulamin §4 ust. 2).
- **Asystent (wiersze 5–6)**: transfer do z.ai bez instrumentu z art. 46 RODO —
  wyjątek świadomy, ujawniony w polityce prywatności (pkt 4) i w UI asystenta.
  Środki minimalizujące: brak identyfikatorów użytkownika w payloadzie,
  temperature 0, limit 16 wiad./24 000 znaków, kill-switch
  `ASSISTANT_ENABLED="false"` (asystent aktualnie wyłączony tą flagą).
- **Art. 30 ust. 5**: dokument udostępniany na żądanie organu nadzorczego
  (UODO).
- Nie prowadzimy zautomatyzowanego podejmowania decyzji (art. 22) ani
  profilowania; nie przetwarzamy danych szczególnych kategorii (art. 9).
