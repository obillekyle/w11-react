import { HTMLAttributes } from 'react';

export type IconProps = {
  icon: string;
  color?: string;
  size?: string | number;
  fontSize?: string | number;
} & HTMLAttributes<SVGSVGElement>;

export const Icon = ({
  icon,
  size = 'auto',
  style,
  color = 'currentColor',
  fontSize,
  ...props
}: IconProps) => {
  <svg
    {...props}
    data-src={`/assets/icons/${icon ?? 'f'}.svg`}
    color={color}
    width={size}
    height={size}
    style={{ ...style, fontSize }}
  />;
};

export default Icon;
