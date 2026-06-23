/**
 * Logo Rivald'event - cercle gold avec 3 etoiles.
 *
 * Design : minimaliste, symbolique (etoiles = excellence, guidance).
 * Reutilise sur splash, login, register, onboarding.
 *
 * Tailles :
 * - sm (32px)  : header, badges
 * - md (64px)  : login, register
 * - lg (120px) : splash
 */

import { Svg, Circle, Path } from 'react-native-svg';

import { colors } from '@/lib/constants';

interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly withBackground?: boolean;
  readonly testID?: string;
}

const SIZE_PX: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 32,
  md: 64,
  lg: 120,
};

export function Logo({ size = 'md', withBackground = true, testID }: LogoProps) {
  const dimension = SIZE_PX[size];
  const center = dimension / 2;
  const starSize = dimension * 0.15;

  return (
    <Svg testID={testID} width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
      {withBackground && (
        <Circle cx={center} cy={center} r={center - 2} fill={colors.gold} stroke={colors.gold} strokeWidth={1.5} />
      )}

      {/* Etoile centrale (grande) */}
      <Star cx={center} cy={center} size={starSize * 1.4} fill={colors.terracotta} />

      {/* Etoile haut-gauche */}
      <Star cx={center - dimension * 0.22} cy={center - dimension * 0.18} size={starSize * 0.7} fill={colors.terracotta} />

      {/* Etoile bas-droite */}
      <Star cx={center + dimension * 0.22} cy={center + dimension * 0.18} size={starSize * 0.7} fill={colors.terracotta} />
    </Svg>
  );
}

function Star({ cx, cy, size, fill }: { cx: number; cy: number; size: number; fill: string }) {
  // Etoile 5 branches
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? size : size * 0.4;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return <Path d={`M${points.join(' L')} Z`} fill={fill} />;
}