/**
 * Static knowledge base for the PUBLIC assistant, embedded verbatim into the
 * system prompt. KEEP IN SYNC with the marketing copy in
 * src/app/(marketing)/page.tsx, /cennik/page.tsx and /kontakt/page.tsx —
 * the bot must not know more (or less) than the site says. No secrets, no
 * env values, no hotel data here.
 */

import { CONTACT_EMAIL } from "@/lib/site";

export const PUBLIC_KNOWLEDGE = `
# Czym jest Hotel Info
Hotel Info to serwis, w którym hotel nakleja kod QR w pokoju, a gość po zeskanowaniu
widzi na swoim telefonie stronę z informacjami: hasło Wi-Fi, opis pokoju, udogodnienia
i instrukcję dojazdu. Gość niczego nie instaluje — kod prowadzi na zwykłą stronę
internetową, działającą w każdej przeglądarce, także poza Wi-Fi obiektu.
Strony gości są celowo niewidoczne w Google (noindex), bo pokazują hasło Wi-Fi —
gość trafia na nie wyłącznie kodem z naklejki.

# Jak zacząć (onboarding)
1. Rejestracja konta na /rejestracja (14 dni próbnych, bez karty kredytowej).
2. Kreator tworzenia hotelu: nazwa, adres strony (slug — trwały, trafia na naklejki),
   hasło Wi-Fi, telefon, e-mail, kolor marki.
3. Dodanie pokoi (numer + nazwa; adres pokoju generuje się automatycznie).
4. Uzupełnienie treści: udogodnienia, sekcje opisów, kroki dojazdu, mapa.
5. Wydruk naklejek QR z panelu (podglądy SVG, pliki PNG i arkusz A4).
Zmiany w panelu są widoczne dla gości natychmiast. Konfiguracja zajmuje kilkanaście minut.

# Cennik
Jedna cena za cały obiekt: 49 zł miesięcznie, bez limitu pokoi i bez umowy na czas
określony. Pierwsze 14 dni za darmo, bez karty. Płatność miesięczna: BLIK lub karta;
subskrypcję można anulować w każdej chwili — kody działają do końca opłaconego okresu.
W cenie: nielimitowana liczba pokoi, treści PL + EN, centrum QR (podglądy, PNG, arkusz A4),
własny kolor marki na stronach gości, krótki adres na domenie Hotel Info, natychmiastowe
aktualizacje, automatyczne przekierowania starych adresów po zmianie nazwy pokoju
(wydrukowane naklejki działają dalej). Każdy obiekt (hotel, pensjonat, gospodarstwo)
to osobne konto z osobną subskrypcją.

# Częste pytania
- Własna domena: na razie adres na domenie Hotel Info (krótszy adres = prostszy kod QR);
  obsługa własnych domen planowana w kolejnej wersji.
- Zmiana numeru/nazwy pokoju: stary adres automatycznie przekierowuje na nowy.
- Utrzymanie: kilkanaście minut konfiguracji, później zmienia się tylko to, co się zmienia.
- Reset hasła do konta: strona /reset-hasła (reset-hasla).

# Kontakt
E-mail: ${CONTACT_EMAIL} (strona /kontakt).
`.trim();
