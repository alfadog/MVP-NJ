'use client';

import { useMemo, type HTMLAttributes, type RefObject } from 'react';

import { useInputController } from '@/core/input';
import type { InputOptions, NormalizedInputEvent } from '@/core/input';

export interface InputSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  options?: InputOptions;
  onTap?: (event: NormalizedInputEvent) => void;
  onSwipe?: (event: NormalizedInputEvent) => void;
  onLongPress?: (event: NormalizedInputEvent) => void;
}

export function InputSurface({
  options,
  onTap,
  onSwipe,
  onLongPress,
  style,
  children,
  ...rest
}: InputSurfaceProps) {
  const { ref } = useInputController(options, { onTap, onSwipe, onLongPress });

  const composedStyle = useMemo(() => ({ touchAction: 'manipulation', ...style }), [style]);

  return (
    <div ref={ref as RefObject<HTMLDivElement>} style={composedStyle} {...rest}>
      {children}
    </div>
  );
}
