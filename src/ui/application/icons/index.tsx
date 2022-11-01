import { forwardRef, HTMLAttributes } from 'react';

export type IconProps = {
  icon: string;
  color?: string;
  size?: string | number;
  fontSize?: string | number;
} & HTMLAttributes<SVGSVGElement>;

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  (
    { icon, size = 'auto', style, color = 'currentColor', fontSize, ...props },
    ref
  ) => {
    return (
      <svg
        ref={ref}
        {...props}
        data-src={`/assets/icons/${icon ?? 'close'}.svg`}
        color={color}
        width={size == 'auto' ? undefined : size}
        height={size == 'auto' ? undefined : size}
        style={{ ...style, fontSize }}
      />
    );
  }
);

export default Icon;
