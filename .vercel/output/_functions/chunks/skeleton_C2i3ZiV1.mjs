import { jsx } from 'react/jsx-runtime';
import { a as cn } from './button_3jlkDYpB.mjs';

function Skeleton({
  className,
  ...props
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn("animate-pulse rounded-md bg-muted", className),
      ...props
    }
  );
}

export { Skeleton as S };
