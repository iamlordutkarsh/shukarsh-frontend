"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { OopsArt } from "../components/ui/KawaiiArt";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="section-shell py-20">
      <EmptyState
        art={<OopsArt />}
        title="Something wobbled"
        description="That page did not load properly. Give it another try, or head back to the shop."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset} size="lg">
              <RefreshCcw className="h-4 w-4" strokeWidth={2.4} />
              Try again
            </Button>
            <ButtonLink href="/" variant="secondary" size="lg">
              Back home
            </ButtonLink>
          </div>
        }
        className="mx-auto max-w-xl"
      />
    </div>
  );
}
