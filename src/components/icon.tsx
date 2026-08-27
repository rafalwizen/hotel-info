import {
  Ban,
  Bath,
  BedDouble,
  Check,
  Clock,
  Coffee,
  Info,
  KeyRound,
  MapPin,
  Phone,
  Shirt,
  Snowflake,
  SquareParking,
  Tv,
  Utensils,
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
