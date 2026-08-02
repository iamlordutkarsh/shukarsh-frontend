import { Quote, Star } from "lucide-react";
import { testimonials } from "../../lib/testimonials";
import { RevealGroup, RevealItem } from "../motion/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

export function Testimonials() {
  return (
    <section className="relative py-8 sm:py-10">
      <div className="section-shell">
        <SectionHeading
          eyebrow="Kind words"
          title="Loved by soft-hearted maximalists"
          description="A few notes from people who let us into their kitchens, wardrobes and manicures."
        />

        <RevealGroup className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {testimonials.map((testimonial) => (
            <RevealItem key={testimonial.name} className="h-full">
              <figure className="flex h-full flex-col gap-4 rounded-4xl bg-surface/85 p-6 shadow-soft transition-transform duration-500 ease-[var(--ease-soft)] hover:-translate-y-1.5 hairline">
                <Quote className="h-6 w-6 text-lavender-300" strokeWidth={2.2} />
                <blockquote className="flex-1 text-sm leading-relaxed text-ink-700">“{testimonial.quote}”</blockquote>
                <div className="flex items-center gap-0.5" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className={
                        index < testimonial.rating ? "h-3.5 w-3.5 text-peach-400" : "h-3.5 w-3.5 text-lavender-200"
                      }
                      strokeWidth={2.4}
                      fill="currentColor"
                    />
                  ))}
                </div>
                <figcaption className="text-xs font-semibold text-muted">
                  {testimonial.name} · {testimonial.location}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
