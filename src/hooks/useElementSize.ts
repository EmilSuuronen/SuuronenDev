import { useEffect, useState } from "react";
import type { RefObject } from "react";

import type { Size } from "../types/desktop";

export function useElementSize<T extends HTMLElement>(elementRef: RefObject<T | null>) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elementRef]);

  return size;
}
