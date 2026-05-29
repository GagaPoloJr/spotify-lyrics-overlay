import { useEffect, useState, useCallback } from "react";

export const useScrollTop = (ref: React.RefObject<HTMLElement | null>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isAtTop, setIsAtTop] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleScroll = () => {
      const top = element.scrollTop;
      setScrollTop(top);
      setIsAtTop(top < 10);
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [ref]);

  const scrollToTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    const element = ref.current;
    if (!element) return;

    element.scrollTo({
      top: 0,
      behavior,
    });
  }, [ref]);

  return {
    scrollTop,
    isAtTop,
    scrollToTop,
  };
};
