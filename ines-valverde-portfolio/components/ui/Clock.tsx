"use client";

import { useEffect, useState } from "react";

/** Live local time for a given IANA time zone, e.g. "09:41 AM". */
export default function Clock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const text = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone })
    : "00:00 AM";

  return <time suppressHydrationWarning>{text}</time>;
}
