const PRESS =
  "transition-transform duration-150 ease-press active:scale-97 motion-reduce:transition-none motion-reduce:active:scale-100";

export const OUTLINE_BUTTON = `cc-outline h-12 cursor-pointer rounded-xs border border-line bg-transparent px-4 text-sm/6 text-ink lg:h-10 ${PRESS}`;
export const FILLED_BUTTON = `h-12 cursor-pointer rounded-xs bg-button px-4 text-sm/6 text-button-label lg:h-10 ${PRESS}`;

export const ICON_BUTTON = `cc-outline inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-xs border border-line bg-transparent text-ink lg:size-10 ${PRESS}`;
