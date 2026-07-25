import { Marquee } from "../motion/Marquee";
import { announcements } from "../../lib/nav";

export function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-lavender-500 via-lavender-500 to-blush-400 text-white">
      <Marquee duration="34s" className="py-2">
        {announcements.map((item) => (
          <span key={item} className="flex items-center">
            <span className="px-6 text-[0.6875rem] font-bold uppercase tracking-[0.18em]">{item}</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-white/60" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
