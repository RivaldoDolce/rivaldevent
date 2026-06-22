/**
 * Barrel export du design system.
 *
 * Usage :
 *   import { Button, Input, Card, Badge } from '@/components/ui';
 *
 * Au lieu de :
 *   import { Button } from '@/components/ui/Button';
 *   import { Input } from '@/components/ui/Input';
 *   ...
 */

export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Skeleton } from './Skeleton';
export { BottomSheet } from './BottomSheet';
export { TabBar } from './TabBar';
export { Header } from './Header';
export { LoadingScreen } from './LoadingScreen';
export { EmptyState } from './EmptyState';

// Re-export des types
export type { BadgeProps } from './Badge';
