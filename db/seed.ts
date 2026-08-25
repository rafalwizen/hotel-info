/**
 * Development seed: demo owner + hotel with rooms, amenities, sections
 * (including one template override) and a slug redirect.
 * Usage: npm run db:seed  (wipes existing data first — dev tool only)
 */
import { db, pool } from "../src/db";
import {
  amenities,
  hotelSections,
  hotels,
  memberships,
  roomAmenities,
  roomRedirects,
  roomSections,
  rooms,
  users,
} from "../src/db/schema";
import bcrypt from "bcryptjs";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  console.log("Wiping existing data...");
  // FK-safe order: children first.
  await db.delete(roomAmenities);
  await db.delete(roomSections);
  await db.delete(roomRedirects);
  await db.delete(rooms);
  await db.delete(amenities);
  await db.delete(hotelSections);
  await db.delete(memberships);
  await db.delete(hotels);
  await db.delete(users);

  const [user] = await db
    .insert(users)
    .values({
      email: "demo@hotelinfo.test",
      passwordHash: await bcrypt.hash("demo1234", 12),
      name: "Jan Demo",
    })
    .returning();

  const [hotel] = await db
    .insert(hotels)
    .values({
      slug: "willa-mazury",
      name: { pl: "Willa Mazury", en: "Mazury Villa" },
      brandColor: "#0f766e",
      wifiSsid: "WillaMazury-Gosc",
      wifiPassword: "mazury2026",
      checkinFrom: "15:00",
      checkoutUntil: "11:00",
      phone: "+48 600 100 200",
      email: "recepcja@willamazury.test",
      addressLine: "ul. Jeziorana 12, 11-500 Wilkasy",
    })
    .returning();

  await db.insert(memberships).values({
    userId: user.id,
    hotelId: hotel.id,
    role: "OWNER",
  });

  const amenityRows = await db
    .insert(amenities)
    .values([
      { hotelId: hotel.id, icon: "wifi", label: { pl: "Wi-Fi", en: "Wi-Fi" }, sortOrder: 0 },
      { hotelId: hotel.id, icon: "air-vent", label: { pl: "Klimatyzacja", en: "Air conditioning" }, sortOrder: 1 },
      { hotelId: hotel.id, icon: "tv", label: { pl: "Telewizor 43\"", en: '43" TV' }, sortOrder: 2 },
      { hotelId: hotel.id, icon: "coffee", label: { pl: "Czajnik", en: "Kettle" }, sortOrder: 3 },
      { hotelId: hotel.id, icon: "lock", label: { pl: "Sejf", en: "Safe" }, sortOrder: 4 },
      { hotelId: hotel.id, icon: "shower-head", label: { pl: "Prysznic", en: "Shower" }, sortOrder: 5 },
      { hotelId: hotel.id, icon: "fridge", label: { pl: "Lodówka", en: "Fridge" }, sortOrder: 6 },
      { hotelId: hotel.id, icon: "dog", label: { pl: "Zwierzęta dozwolone", en: "Pets allowed" }, sortOrder: 7 },
    ])
    .returning();
  const amenityByIcon = Object.fromEntries(amenityRows.map((a) => [a.icon, a.id]));

  const roomRows = await db
    .insert(rooms)
    .values([
      {
        hotelId: hotel.id,
        number: "101",
        slug: "101",
        name: { pl: "Pokój Standard", en: "Standard Room" },
        floor: 1,
        maxGuests: 2,
        sortOrder: 0,
      },
      {
        hotelId: hotel.id,
        number: "102",
        slug: "102",
        name: { pl: "Pokój Standard z balkonem", en: "Standard Room with Balcony" },
        floor: 1,
        maxGuests: 2,
        sortOrder: 1,
      },
      {
        hotelId: hotel.id,
        number: "201",
        slug: "apartament",
        name: { pl: "Apartament Mazury", en: "Mazury Suite" },
        floor: 2,
        maxGuests: 4,
        sortOrder: 2,
      },
    ])
    .returning();
  const [r101, r102, r201] = roomRows;

  await db.insert(roomAmenities).values([
    ...[r101, r102].flatMap((r) => [
      { roomId: r.id, amenityId: amenityByIcon["wifi"] },
      { roomId: r.id, amenityId: amenityByIcon["tv"] },
      { roomId: r.id, amenityId: amenityByIcon["coffee"] },
      { roomId: r.id, amenityId: amenityByIcon["shower-head"] },
    ]),
    ...[
      "wifi",
      "air-vent",
      "tv",
      "coffee",
      "lock",
      "shower-head",
      "fridge",
      "dog",
    ].map((icon) => ({ roomId: r201.id, amenityId: amenityByIcon[icon] })),
  ]);

  await db.insert(hotelSections).values([
    {
      hotelId: hotel.id,
      title: { pl: "Recepcja", en: "Reception" },
      body: {
        pl: "Recepcja czynna codziennie 8:00–20:00. Po godzinie 20:00 prosimy o kontakt telefoniczny.",
        en: "Reception is open daily 8:00–20:00. After 20:00 please call us.",
      },
      icon: "bell-ring",
      sortOrder: 0,
    },
    {
      hotelId: hotel.id,
      title: { pl: "Śniadania", en: "Breakfast" },
      body: {
        pl: "Śniadania serwujemy 8:00–10:30 w jadalni na parterze. Wstępnie prosimy zgłaszać do 21:00 dnia poprzedniego.",
        en: "Breakfast is served 8:00–10:30 in the dining room on the ground floor. Please order by 21:00 the day before.",
      },
      icon: "croissant",
      sortOrder: 1,
    },
    {
      hotelId: hotel.id,
      title: { pl: "Parking", en: "Parking" },
      body: {
        pl: "Niezamykany parking znajduje się przed budynkiem. Miejsca nie są numerowane — prosimy parkować wzdłuż żywopłotu.",
        en: "Unfenced parking is in front of the building. Spots are unassigned — please park along the hedge.",
      },
      icon: "car",
      sortOrder: 2,
    },
  ]);

  // Hotel-wide room templates ("write once, applies to all rooms")
  const templateRows = await db
    .insert(roomSections)
    .values([
      {
        hotelId: hotel.id,
        roomId: null,
        title: { pl: "Telewizor", en: "Television" },
        body: {
          pl: "Pilot leży przy telewizorze. Lista kanałów pojawia się po wciśnięciu przycisku LIST. TV działa również jako monitor — kabel HDMI leży w szufladzie biurka.",
          en: "The remote is next to the TV. The channel list appears after pressing the LIST button. The TV also works as a monitor — an HDMI cable is in the desk drawer.",
        },
        icon: "tv",
        sortOrder: 0,
      },
      {
        hotelId: hotel.id,
        roomId: null,
        title: { pl: "Klimatyzacja", en: "Air conditioning" },
        body: {
          pl: "Klimatyzację steruje pilot ścienny przy drzwiach balkonowych. Rekomendowana temperatura to 21–23°C. Prosimy wyłączać przy otwartych oknach.",
          en: "The AC is controlled by the wall remote next to the balcony door. Recommended temperature is 21–23°C. Please switch it off when windows are open.",
        },
        icon: "air-vent",
        sortOrder: 1,
      },
      {
        hotelId: hotel.id,
        roomId: null,
        title: { pl: "Cisza nocna", en: "Quiet hours" },
        body: {
          pl: "Prosimy o zachowanie ciszy w godzinach 22:00–7:00 — na piętrze słychać wszystko :)",
          en: "Please keep quiet between 22:00 and 7:00 — everything is audible upstairs :)",
        },
        icon: "moon",
        sortOrder: 2,
      },
    ])
    .returning();
  const acTemplate = templateRows[1];

  // Room-only extra + template override for the suite
  await db.insert(roomSections).values([
    {
      hotelId: hotel.id,
      roomId: r201.id,
      basedOnId: acTemplate.id,
      title: { pl: "Klimatyzacja", en: "Air conditioning" },
      body: {
        pl: "Apartament ma dwie jednostki klimatyzacji — sypialnia i salon mają osobne piloty przy drzwiach. W salonym unit'cie dodatkowo działa tryb grzania.",
        en: "The suite has two AC units — the bedroom and the living room have separate remotes by the doors. The living room unit also supports heating mode.",
      },
      icon: "air-vent",
      sortOrder: 0,
    },
    {
      hotelId: hotel.id,
      roomId: r201.id,
      basedOnId: null,
      title: { pl: "Jacuzzi na tarasie", en: "Terrace jacuzzi" },
      body: {
        pl: "Jacuzzi nagrzewa się ok. 40 minut. Prosimy nie używać olejków ani pianki — psują filtr. Wyłącznik timera jest w szafce przy wejściu na taras.",
        en: "The jacuzzi takes about 40 minutes to heat up. Please do not use oils or foam — they damage the filter. The timer switch is in the cabinet by the terrace entrance.",
      },
      icon: "waves",
      sortOrder: 1,
    },
  ]);

  // Simulate an old slug rename so redirect logic can be verified
  await db.insert(roomRedirects).values({
    hotelId: hotel.id,
    roomId: r201.id,
    oldSlug: "201",
  });

  console.log("Seed complete:");
  console.log("  owner:  demo@hotelinfo.test / demo1234");
  console.log(`  hotel:  ${hotel.slug} (${hotel.id})`);
  console.log("  rooms:  101, 102, apartament (old slug '201' redirects)");
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
