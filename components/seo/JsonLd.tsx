/**
 * Renders structured data for search engines.
 *
 * JSON.stringify cannot produce a literal `</script>`, but it will happily pass
 * through a `<` sitting in a product name, and inside a script tag that is enough
 * to start writing markup. Escaping it costs nothing and means a product called
 * "5 < 6" cannot put anything on the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
