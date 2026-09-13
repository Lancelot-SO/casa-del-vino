import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * The design expresses hover and focus as extra inline style declarations
 * (`style-hover` / `style-focus`). These hooks reproduce that: spread the
 * returned handlers onto the element and merge `style` with the overrides.
 */
export function useHover(): { hovered: boolean; hoverProps: { onMouseEnter: () => void; onMouseLeave: () => void } } {
  const [hovered, setHovered] = useState(false);
  const hoverProps = useMemo(
    () => ({ onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }),
    [],
  );
  return { hovered, hoverProps };
}

export function useFocus(): { focused: boolean; focusProps: { onFocus: () => void; onBlur: () => void } } {
  const [focused, setFocused] = useState(false);
  const focusProps = useMemo(() => ({ onFocus: () => setFocused(true), onBlur: () => setFocused(false) }), []);
  return { focused, focusProps };
}

export const merge = (base: CSSProperties, ...overrides: (CSSProperties | false | null | undefined)[]): CSSProperties =>
  Object.assign({}, base, ...overrides.filter(Boolean));
