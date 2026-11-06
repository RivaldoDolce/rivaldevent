/**
 * Icones de la TabBar -- basees sur lucide-react-native.
 *
 * Lucide est deja utilise dans le reste de l'app (pages profil, etc.)
 * et s'affiche de maniere fiable contrairement aux SVG custom.
 *
 * Mapping :
 * - HomeIcon    -> Home
 * - ExploreIcon -> Search
 * - TicketIcon  -> Ticket
 * - ProfileIcon -> User
 * - SellIcon    -> PlusCircle
 */

import { Home, Search, Ticket, User, PlusCircle } from 'lucide-react-native';

interface IconProps {
  readonly color: string;
  readonly size: number;
}

export function HomeIcon({ color, size }: IconProps) {
  return <Home color={color} size={size} strokeWidth={1.5} />;
}

export function ExploreIcon({ color, size }: IconProps) {
  return <Search color={color} size={size} strokeWidth={1.5} />;
}

export function TicketIcon({ color, size }: IconProps) {
  return <Ticket color={color} size={size} strokeWidth={1.5} />;
}

export function ProfileIcon({ color, size }: IconProps) {
  return <User color={color} size={size} strokeWidth={1.5} />;
}

export function SellIcon({ color, size }: IconProps) {
  return <PlusCircle color={color} size={size} strokeWidth={1.5} />;
}

// Type helper pour les composants d'icone
export type IconComponent = React.ComponentType<IconProps>;