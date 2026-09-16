import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { merge, useFocus, useHover } from '../../hooks/useHover';

/** `all: unset` plus a pointer, the reset every button in the design starts from. */
export const BTN_RESET: CSSProperties = { all: 'unset', cursor: 'pointer' };

type BoxProps = HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'span' | 'section' | 'aside' | 'nav' | 'header' | 'footer' | 'li';
  hoverStyle?: CSSProperties;
  children?: ReactNode;
};

/** A div (or other block tag) that merges extra declarations while hovered. */
export function Box({ as = 'div', hoverStyle, style, ...rest }: BoxProps) {
  const { hovered, hoverProps } = useHover();
  const Tag = as as 'div';
  const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    hoverProps.onMouseEnter();
    rest.onMouseEnter?.(e);
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    hoverProps.onMouseLeave();
    rest.onMouseLeave?.(e);
  };
  return (
    <Tag
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={merge(style || {}, hoverStyle && hovered ? hoverStyle : null)}
    />
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  hoverStyle?: CSSProperties;
  /** Opt out of `all: unset` for the rare button that wants native styling. */
  bare?: boolean;
};

/** A button carrying the design's `all: unset` reset plus its hover declarations. */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn(
  { hoverStyle, style, bare, ...rest },
  ref,
) {
  const { hovered, hoverProps } = useHover();
  const onMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    hoverProps.onMouseEnter();
    rest.onMouseEnter?.(e);
  };
  const onMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    hoverProps.onMouseLeave();
    rest.onMouseLeave?.(e);
  };
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={merge(bare ? {} : BTN_RESET, style || {}, hoverStyle && hovered ? hoverStyle : null)}
    />
  );
});

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { focusStyle?: CSSProperties };

/** An input that takes on its focus declarations while focused. */
export const Input = forwardRef<HTMLInputElement, FieldProps>(function Input({ focusStyle, style, ...rest }, ref) {
  const { focused, focusProps } = useFocus();
  return (
    <input
      ref={ref}
      {...rest}
      onFocus={(e) => {
        focusProps.onFocus();
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        focusProps.onBlur();
        rest.onBlur?.(e);
      }}
      style={merge(style || {}, focusStyle && focused ? focusStyle : null)}
    />
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { focusStyle?: CSSProperties };

export function Textarea({ focusStyle, style, ...rest }: AreaProps) {
  const { focused, focusProps } = useFocus();
  return (
    <textarea
      {...rest}
      onFocus={(e) => {
        focusProps.onFocus();
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        focusProps.onBlur();
        rest.onBlur?.(e);
      }}
      style={merge(style || {}, focusStyle && focused ? focusStyle : null)}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { focusStyle?: CSSProperties };

export function Select({ focusStyle, style, ...rest }: SelectProps) {
  const { focused, focusProps } = useFocus();
  return (
    <select
      {...rest}
      onFocus={(e) => {
        focusProps.onFocus();
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        focusProps.onBlur();
        rest.onBlur?.(e);
      }}
      style={merge(style || {}, focusStyle && focused ? focusStyle : null)}
    />
  );
}
