"use client"

import { useEffect, useState } from "react";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window?.innerWidth || 1280 : 1280,
    height: typeof window !== "undefined" ? window?.innerHeight || 720 : 720,
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function changeWindowSize() {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 200);
    }

    window.addEventListener("resize", changeWindowSize);

    return () => {
      window.removeEventListener("resize", changeWindowSize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
}