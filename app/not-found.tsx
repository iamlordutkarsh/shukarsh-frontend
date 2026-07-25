import { FloatingDecor } from "../components/motion/FloatingDecor";
import { ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { NoResultsArt } from "../components/ui/KawaiiArt";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="relative py-20">
      <FloatingDecor className="opacity-60" />
      <div className="section-shell relative">
        <EmptyState
          art={<NoResultsArt />}
          title="We looked everywhere"
          description="That page has wandered off. Try the shop, or search for what you had in mind."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href="/products" size="lg">
                Browse the shop
              </ButtonLink>
              <ButtonLink href="/" variant="secondary" size="lg">
                Back home
              </ButtonLink>
            </div>
          }
          className="mx-auto max-w-xl"
        />
      </div>
    </div>
  );
}
