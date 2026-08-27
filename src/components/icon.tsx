import {
  AirVent,
  Ban,
  Bath,
  BedDouble,
  BellRing,
  Car,
  Check,
  Clock,
  Coffee,
  Croissant,
  Dog,
  Info,
  KeyRound,
  Lock,
  MapPin,
  Moon,
  Phone,
  Refrigerator,
  Shirt,
  ShowerHead,
  Snowflake,
  SquareParking,
  Tv,
  Utensils,
  Waves,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon catalog shared by admin pickers and guest pages (values stored in DB
 * `icon` columns). Unknown names fall back to Info.
 */
const ICONS: Record<string, LucideIcon> = {
  info: Info,
  wifi: Wifi,
  tv: Tv,
  snowflake: Snowflake,
  key: KeyRound,
  bed: BedDouble,
  bath: Bath,
  coffee: Coffee,
  utensils: Utensils,
  parking: SquareParking,
  phone: Phone,
  clock: Clock,
  "map-pin": MapPin,
  shirt: Shirt,
  check: Check,
  "no-symbols": Ban,
  "air-vent": AirVent,
  lock: Lock,
  "shower-head": ShowerHead,
  fridge: Refrigerator,
  dog: Dog,
  "bell-ring": BellRing,
  croissant: Croissant,
  car: Car,
  moon: Moon,
  waves: Waves,
};

export function SectionIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Component = ICONS[name] ?? Info;
  return <Component className={className} aria-hidden />;
}
