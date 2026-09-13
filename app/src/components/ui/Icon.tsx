import type { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  viewBox?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/** The Lucide-style stroked icon every glyph in the design is drawn with. */
export function Icon({
  size = 16,
  width,
  height,
  stroke = 'currentColor',
  fill = 'none',
  strokeWidth = 1.8,
  viewBox = '0 0 24 24',
  style,
  children,
}: IconProps) {
  return (
    <svg
      width={width ?? size}
      height={height ?? size}
      viewBox={viewBox}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  );
}

/** Shorthand for the single-path icons held in the ICON / ING_ICON maps. */
export function PathIcon({ d, ...rest }: Omit<IconProps, 'children'> & { d: string }) {
  return (
    <Icon {...rest}>
      <path d={d} />
    </Icon>
  );
}
