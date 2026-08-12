/**
 * Logo Rivald'event — médaillon « Noir & Or ».
 *
 * Cercle noir profond à double filet doré, avec le logo officiel de l'app
 * (app-logo-icon.svg) recoloré dans un dégradé or champagne (gradient
 * « goldBody » défini dans le SVG source).
 *
 * Tailles :
 * - sm (32px)   : header, badges
 * - md (64px)   : login, register
 * - xlg (108px) : login, register (grand cercle, logo bien visible)
 * - lg (120px)  : splash, loading screens
 */

import { Svg, Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

import AppLogoIcon from '@/assets/icons/app-logo-icon.svg';

interface LogoProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xlg';
  readonly withBackground?: boolean;
  readonly testID?: string;
}

const SIZE_PX: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 32,
  md: 64,
  lg: 120,
  xlg: 108,
};

/**
 * Dimensions du logo dans le médaillon.
 * Le viewBox source est 1016×792 (format paysage) : on garde ce ratio.
 */
function logoDimensions(dimension: number): { width: number; height: number } {
  const width = Math.round(dimension * 0.6);
  const height = Math.round(width * (792 / 1016));
  return { width, height };
}

export function Logo({ size = 'md', withBackground = true, testID }: LogoProps) {
  const dimension = SIZE_PX[size];
  const center = dimension / 2;
  const { width, height } = logoDimensions(dimension);

  return (
    <Svg testID={testID} width={dimension} height={dimension} viewBox={`0 0 ${dimension} ${dimension}`}>
      <Defs>
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
            stroke="#D8B45A"
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
          {/* Logo officiel recoloré en or */}
          <G x={center - width / 2} y={center - height / 2}>
            <AppLogoIcon width={width} height={height} />
          </G>
        </G>
      )}
    </Svg>
  );
}