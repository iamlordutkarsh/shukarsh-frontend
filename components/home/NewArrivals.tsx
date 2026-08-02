import { ArrowRight } from "lucide-react";
import { getProducts } from "../../lib/api";
import { RevealGroup, RevealItem } from "../motion/Reveal";
import { ProductCard } from "../product/ProductCard";
import { ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { OopsArt } from "../ui/KawaiiArt";
import { SectionHeading } from "../ui/SectionHeading";

export async function NewArrivals() {
  const products = await getProducts({ limit: 8 })
    .then((data) => data.products)
    .catch(() => []);

  return (
    <section className="section-shell py-8 sm:py-10">
      <SectionHeading
        align="left"
        eyebrow="Fresh in"
        title="Just landed"
        description="The newest pieces, still warm from the unboxing."
        action={
          <ButtonLink href="/products" variant="secondary" className="shrink-0">
            View all
            <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
          </ButtonLink>
        }
      />

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            art={<OopsArt />}
            title="Our shelves are restocking"
            description="The catalogue is taking a moment to load. Try again in a few seconds."
            action={<ButtonLink href="/products">Browse the shop</ButtonLink>}
          />
        ) : (
          <RevealGroup className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" stagger={0.06}>
            {products.map((product, index) => (
              <RevealItem key={product.id} className="h-full">
                <ProductCard product={product} priority={index < 2} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </section>
  );
}
