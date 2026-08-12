/**
 * Logo Rivald'event — médaillon « Noir & Or ».
 *
 * Anneau doré à double filet autour d'un cercle noir profond,
 * étoile centrale or champagne et deux étoiles satellites.
 * Symbolique : excellence, guidance, événements premium.
 *
 * Tailles :
 * - sm (32px)  : header, badges
 * - md (64px)  : login, register
 * - lg (120px) : splash, loading screens
 */

import { Svg, Circle, Path, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

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
  const starSize = dimension * 0.34;

  return (
    <Svg testID={testID} width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
      <Defs>
        <SvgLinearGradient id="goldBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F2DC9B" />
          <Stop offset="0.5" stopColor="#D8B45A" />
          <Stop offset="1" stopColor="#A87F2E" />
        </SvgLinearGradient>
        <SvgLinearGradient id="noirBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#26211B" />
          <Stop offset="1" stopColor="#0A0908" />
        </SvgLinearGradient>
      </Defs>

      {withBackground && (
        <G>
          {/* Cercle principal */}
          <Circle
            cx={center}
            cy={center}
            r={center - 2}
            fill="url(#noirBody)"
            stroke="url(#goldBody)"
            strokeWidth={dimension * 0.035}
          />
          {/* Double filet intérieur */}
          <Circle
            cx={center}
            cy={center}
            r={center - dimension * 0.085}
            fill="none"
            stroke="#D8B45A"
            strokeWidth={dimension * 0.008}
            opacity={0.5}
          />
          {/* Étoiles */}
          <Star cx={center} cy={center} size={starSize} fill="url(#goldBody)" />
          <Circle cx={center} cy={center} r={starSize * 0.22} fill="#0A0908" opacity={0.65} />
          <Star
            cx={center - dimension * 0.24}
            cy={center - dimension * 0.19}
            size={starSize * 0.34}
            fill="#D8B45A"
            opacity={0.85}
          />
          <Star
            cx={center + dimension * 0.24}
            cy={center + dimension * 0.19}
            size={starSize * 0.34}
            fill="#D8B45A"
            opacity={0.85}
          />
        </G>
      )}
    </Svg>
  );
}

function Star({
  cx,
  cy,
  size,
  fill,
  opacity,
}: {
  cx: number;
  cy: number;
  size: number;
  fill: string;
  opacity?: number;
}) {
  // Étoile 5 branches
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? size : size * 0.4;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return <Path d={`M${points.join(' L')} Z`} fill={fill} opacity={opacity ?? 1} />;
}