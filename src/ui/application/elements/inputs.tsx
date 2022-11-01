import { v } from '@api/util';
import {
  SelectProps,
  Select as S,
  TextInput as T,
  TextInputProps,
} from '@mantine/core';
import { useSettings } from '../../../os';

export const Select = (props: SelectProps) => {
  const store = useSettings();
  const timing = store.get('timing', 1);

  return (
    <S
      withinPortal
      transition="scale-y"
      transitionDuration={200 / timing}
      maxDropdownHeight={innerHeight - 90}
      transitionTimingFunction="ease-out"
      styles={(e) => ({
        input: {
          color: 'white',
          width: v(props.width ?? 120),
          height: v(props.height ?? 36),
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          paddingInline: v(12),
          borderRadius: v(4),
          background: '#80808060',
          fontSize: v(13),
        },
        dropdown: {
          color: 'white',
          background: '#212121',
          border: 'none',
          fontSize: v(13),
          maxHeight: 'calc(100vh - 90px)',
        },

        itemsWrapper: {
          maxHeight: 'calc(100vh - 90px)',
        },

        item: {
          height: v(36),
          fontSize: v(13),
          display: 'flex',
          alignItems: 'center',
          paddingInline: v(12),
          color: 'white',
          position: 'relative',
          background: 'none !important',
          '&::before': {
            position: 'absolute',
            content: '""',
            inset: `${v(2)} ${v(2)} ${v(2)} ${v(2)}`,
            borderRadius: v(4),
          },
          '&[data-selected]': {
            '&::before': {
              background: '#80808060',
            },
            '&::after': {
              content: "''",
              background: e.colors.blue[5],
              borderRadius: 999,
              position: 'absolute',
              marginBlock: 'auto',
              top: '50%',
              left: v(4),
              height: v(14),
              width: v(3),
              transform: 'translateY(-50%)',
            },
          },
          '&[data-hovered,data-selected]::before': {
            background: '#80808060',
          },
          '&[data-hovered]:before': {
            background: '#80808050',
          },
        },
      })}
      {...props}
    />
  );
};

export const Input = (props: TextInputProps) => {
  return (
    <T
      {...props}
      styles={(e) => ({
        input: {
          color: 'white',
          width: v(props.width ?? 120),
          height: v(props.height ?? 36),
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          paddingInline: v(12),
          borderRadius: v(4),
          background: '#80808060',
          fontSize: v(13),
          '&::placeholder': {
            color: 'whitesmoke',
          },
        },
      })}
    />
  );
};
