"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_PACKAGING } from "../lib/packaging";
import { AttributeDefinition, Category, DetailBlock, Product, ProductSpec } from "../lib/types";
import { getCategoryAttributes, type ColourInput } from "../lib/api";
import { cn, discountPercent, formatPrice, round2 } from "../lib/utils";
import { Button, ButtonLink } from "./ui/Button";
import { useToast } from "./ui/Toast";
import { FormCard, FormField, inputClass, textareaClass } from "./admin/FormField";
import { ImageUploader } from "./admin/ImageUploader";
import { CategoryPicker } from "./admin/CategoryPicker";
import { OptionsChooser } from "./admin/OptionsChooser";
import { AttributeFields, answersFromProduct, type AttributeAnswers } from "./admin/AttributeFields";
import { SpecEditor } from "./admin/SpecEditor";
import { DetailsEditor } from "./admin/DetailsEditor";

interface ProductFormProps {
  categories: Category[];
  product?: Product;
  /**
   * Handed the definitions as well as the answers, because turning one into the
   * API's shape needs to know each question's kind, and only this component ever
   * fetched them.
   *
   * Null when those questions could not be read, which means the answers in
   * `data` are not trustworthy and must be left alone rather than sent.
   */
  onSubmit: (data: FormData, definitions: AttributeDefinition[] | null) => Promise<string | void>;
  submitLabel: string;
}

export interface FormData {
  name: string;
  slug: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: string;
  lowStockThreshold: string;
  images: string[];
  categoryId: string;
  isActive: boolean;
  weightKg: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  hsn: string;
  gstRate: string;
  costPrice: string;
  specs: ProductSpec[];
  details: DetailBlock[];
  countryOfOrigin: string;
  manufacturerName: string;
  manufacturerAddr: string;
  manufacturerPin: string;
  /** Keyed by the definition's key, so it survives the category changing. */
  attributes: AttributeAnswers;
  /**
   * Only used while creating. On an existing product the matrix editor below the
   * form owns these, because it can also show stock and per-cell prices.
   */
  colours: ColourInput[];
  sizes: string[];
}

/** Straight from the shared defaults, so the form and the list cannot disagree. */
const PARCEL_DEFAULTS = {
  weightKg: String(DEFAULT_PACKAGING.weightKg),
  lengthCm: String(DEFAULT_PACKAGING.lengthCm),
  breadthCm: String(DEFAULT_PACKAGING.breadthCm),
  heightCm: String(DEFAULT_PACKAGING.heightCm),
};

/** The slabs GST actually uses. Same list the API validates against. */
const GST_RATES = ["0", "0.25", "3", "5", "12", "18", "28"];

export default function ProductForm({ categories, product, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const uid = useId();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price ? String(product.price) : "",
    comparePrice: product?.comparePrice ? String(product.comparePrice) : "",
    stock: product?.stock ? String(product.stock) : "",
    lowStockThreshold: product?.lowStockThreshold != null ? String(product.lowStockThreshold) : "5",
    images: product?.images ?? [],
    categoryId: product?.categoryId || "",
    isActive: product?.isActive ?? true,
    weightKg: product?.weightKg != null ? String(product.weightKg) : PARCEL_DEFAULTS.weightKg,
    lengthCm: product?.lengthCm != null ? String(product.lengthCm) : PARCEL_DEFAULTS.lengthCm,
    breadthCm: product?.breadthCm != null ? String(product.breadthCm) : PARCEL_DEFAULTS.breadthCm,
    heightCm: product?.heightCm != null ? String(product.heightCm) : PARCEL_DEFAULTS.heightCm,
    hsn: product?.hsn || "",
    gstRate: product?.gstRate != null ? String(product.gstRate) : "5",
    costPrice: product?.costPrice != null ? String(product.costPrice) : "",
    specs: product?.specs ?? [],
    details: product?.details ?? [],
    countryOfOrigin: product?.countryOfOrigin || "",
    manufacturerName: product?.manufacturerName || "",
    manufacturerAddr: product?.manufacturerAddr || "",
    manufacturerPin: product?.manufacturerPin || "",
    attributes: answersFromProduct(product?.attributes),
    colours: [],
    sizes: [],
  });

  /**
   * What the chosen category asks for.
   *
   * Refetched whenever the category changes, because that is the whole point: the
   * form below is generated from this. The answers themselves are keyed by the
   * question's key and deliberately not cleared, so a product moved between two
   * categories that both ask for a fabric keeps the fabric it already had.
   */
  const [fetched, setFetched] = useState<{
    categoryId: string;
    attributes: AttributeDefinition[];
    failed?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!form.categoryId) return;

    const categoryId = form.categoryId;
    let live = true;

    getCategoryAttributes(categoryId)
      .then((data) => {
        if (live) setFetched({ categoryId, attributes: data.attributes });
      })
      // A category whose questions will not load must not block the save. The
      // API checks them again anyway, and it is the one that decides.
      .catch(() => {
        // Recorded as a failure rather than as "no questions", so a save from
        // here declines to touch the answers instead of wiping them.
        if (live) setFetched({ categoryId, attributes: [], failed: true });
      });

    return () => {
      live = false;
    };
  }, [form.categoryId]);

  // Which category the answer belongs to is carried with it, so switching
  // categories cannot briefly draw the old one's questions against the new one's
  // name. That also means neither of these needs resetting in the effect.
  const failedAttributes = fetched?.failed === true;
  const forThisCategory = fetched?.categoryId === form.categoryId;
  const definitions = forThisCategory ? fetched!.attributes : [];
  const loadingAttributes = Boolean(form.categoryId) && !forThisCategory;

  /**
   * Whether the questions are actually known.
   *
   * An empty `definitions` is ambiguous: it means "this category asks nothing"
   * and "the fetch has not landed, or failed" alike. The payload is built from
   * it, and the API reads an empty answer list as "answers nothing" — so saving
   * from the unknown state silently deleted every stored answer. Nothing is sent
   * unless the questions were genuinely read.
   */
  const answersKnown = Boolean(form.categoryId) && forThisCategory && !failedAttributes;

  /** Its total is derived once it has options, so the form must not offer it. */
  const sellsByOption = (product?.variants.length ?? 0) > 0;

  const priceNumber = Number(form.price);
  const pricePreview = form.price.trim() && Number.isFinite(priceNumber) ? formatPrice(priceNumber) : null;

  /**
   * The price is the MRP, so this pulls apart what is already inside it. Mirrors
   * computeTax on the server: round the tax and derive the rest by subtraction,
   * so the parts always add back up to exactly the price.
   */
  const breakdown = (() => {
    const rate = Number(form.gstRate);
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) return null;
    if (!Number.isFinite(rate) || rate < 0) return null;

    const price = round2(priceNumber);
    const tax = rate > 0 ? round2(price - price / (1 + rate / 100)) : 0;
    const half = round2(tax / 2);

    const taxable = round2(price - tax);

    /**
     * Margin is measured against the taxable value rather than the price,
     * because the GST inside the price is collected on the government's behalf
     * and was never ours. Cost is held net of GST for the mirror-image reason:
     * input tax credit gives back the tax paid to a supplier.
     */
    const cost = Number(form.costPrice);
    const margin =
      form.costPrice.trim() && Number.isFinite(cost) && cost >= 0
        ? {
            cost: round2(cost),
            amount: round2(taxable - cost),
            percent: taxable > 0 ? Math.round(((taxable - cost) / taxable) * 1000) / 10 : 0,
          }
        : null;

    const compare = Number(form.comparePrice);
    // The storefront badge comes from this helper, so the preview has to as
    // well, or the admin is shown a percentage the shopper never sees.
    const savingPercent = discountPercent(price, compare);
    const saving =
      savingPercent !== null ? { amount: round2(compare - price), percent: savingPercent } : null;

    return { price, rate, tax, half, taxable, margin, saving };
  })();

  const volumetricKg = (() => {
    const volume = Number(form.lengthCm) * Number(form.breadthCm) * Number(form.heightCm);
    if (!Number.isFinite(volume) || volume <= 0) return null;
    return (volume / 5000).toFixed(2);
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // A handler may say where to go next. Creating a product with colours
       // lands on that product rather than the list, because its stock is now
       // zero until each colour is counted in, and the list cannot do that.
      const next = await onSubmit(form, answersKnown ? definitions : null);
      toast({
        title: submitLabel.startsWith("Create") ? "Product created" : "Product updated",
        description: `${form.name} is live in the catalogue.`,
        tone: "success",
      });
      router.push(typeof next === "string" ? next : "/admin/products");
    } catch (err) {
      toast({
        title: "Could not save product",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <FormCard title="The basics" description="Name and slug shape how shoppers find this piece.">
        <FormField label="Name" htmlFor={`${uid}-name`}>
          <input
            id={`${uid}-name`}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Cloud Bunny Tote"
            className={inputClass}
          />
        </FormField>

        <FormField label="Slug" htmlFor={`${uid}-slug`} hint="Lowercase words joined by hyphens, e.g. cloud-bunny-tote.">
          <input
            id={`${uid}-slug`}
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="cloud-bunny-tote"
            className={inputClass}
          />
        </FormField>

        <FormField label="Description" htmlFor={`${uid}-description`}>
          <textarea
            id={`${uid}-description`}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            placeholder="Tell the little story behind this piece..."
            className={textareaClass}
          />
        </FormField>
      </FormCard>

      {/* Above the rest, because it decides what the rest of the form asks for.
          A category chosen last is a form filled in twice. */}
      <FormCard
        title="Category"
        description="Pick the most specific one that fits. It decides which details this product is asked for."
      >
        <CategoryPicker
          categories={categories}
          value={form.categoryId || null}
          onChange={(categoryId) => setForm({ ...form, categoryId })}
        />
      </FormCard>

      <FormCard
        title="Product details"
        description="What this category asks about every product filed under it."
      >
        <AttributeFields
          definitions={definitions}
          answers={form.attributes}
          onChange={(attributes) => setForm({ ...form, attributes })}
          loading={loadingAttributes}
        />
      </FormCard>

      {/* Only while creating. Once the product exists, the matrix editor under
          the form owns the colours: it can show stock and per-cell prices, which
          nothing can do before there is a product to hang them on. */}
      {!product && (
        <FormCard
          title="Colours & sizes"
          description="What this comes in. Every colour crossed with every size becomes something to buy."
        >
          <OptionsChooser
            colours={form.colours}
            sizes={form.sizes}
            onColours={(colours) => setForm({ ...form, colours })}
            onSizes={(sizes) => setForm({ ...form, sizes })}
          />
        </FormCard>
      )}

      <FormCard
        title="Compliance"
        description="Required on the label of anything packaged and sold online in India."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Country of origin" htmlFor={`${uid}-origin`}>
            <input
              id={`${uid}-origin`}
              value={form.countryOfOrigin}
              onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })}
              placeholder="India"
              className={inputClass}
            />
          </FormField>
          <FormField label="Manufacturer / packer" htmlFor={`${uid}-maker`}>
            <input
              id={`${uid}-maker`}
              value={form.manufacturerName}
              onChange={(e) => setForm({ ...form, manufacturerName: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Address"
            htmlFor={`${uid}-maker-address`}
            className="sm:col-span-2"
            hint="An address a customer could actually write to."
          >
            <input
              id={`${uid}-maker-address`}
              value={form.manufacturerAddr}
              onChange={(e) => setForm({ ...form, manufacturerAddr: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Pincode" htmlFor={`${uid}-maker-pin`}>
            <input
              id={`${uid}-maker-pin`}
              value={form.manufacturerPin}
              onChange={(e) => setForm({ ...form, manufacturerPin: e.target.value })}
              inputMode="numeric"
              maxLength={6}
              placeholder="243001"
              className={inputClass}
            />
          </FormField>
        </div>
      </FormCard>

      <FormCard title="Inventory" description="Stock and shelf placement.">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Withheld once a product has options, because its total is only
              their sum by then. Leaving the box here is what let a shop type 22
              against a product whose every colour and size held nothing, and see
              "in stock" beside a sold out button. */}
          {sellsByOption ? (
            <div className="rounded-2xl bg-surface-soft px-4 py-3.5 sm:col-span-2">
              <p className="text-sm font-semibold text-ink">Stock lives on each colour and size</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                This product has {product?.variants.length} option
                {product?.variants.length === 1 ? "" : "s"}, so its total is whatever they add up to.
                Add units to each one under <span className="font-semibold text-ink">Colours &amp; sizes</span>{" "}
                below.
              </p>
            </div>
          ) : (
            <FormField
              label="Stock"
              htmlFor={`${uid}-stock`}
              hint={
                product
                  ? "Saving this records a recount. To add a delivery, use the stock badge on the products list instead: it adds to whatever is there now."
                  : undefined
              }
            >
              <input
                id={`${uid}-stock`}
                required
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className={inputClass}
              />
            </FormField>
          )}
          <FormField
            label="Reorder at"
            htmlFor={`${uid}-threshold`}
            hint="Below this it shows as running low, here and in the daily email."
          >
            <input
              id={`${uid}-threshold`}
              type="number"
              min="0"
              step="1"
              value={form.lowStockThreshold}
              onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="flex items-start gap-3 rounded-2xl bg-surface-soft px-4 py-3.5">
          <input
            id={`${uid}-active`}
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="mt-0.5 h-4 w-4 rounded-md"
          />
          <span>
            <label htmlFor={`${uid}-active`} className="block text-sm font-semibold text-ink">
              Active
            </label>
            <span className="mt-0.5 block text-xs text-muted">Inactive products stay hidden from the storefront.</span>
          </span>
        </div>
      </FormCard>

      <FormCard
        title="Shipping"
        description="Couriers price on the packed parcel, so measure the box you actually post."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Weight (kg)"
            htmlFor={`${uid}-weight`}
            hint={volumetricKg ? `Volumetric weight of this box is ${volumetricKg} kg.` : undefined}
          >
            <input
              id={`${uid}-weight`}
              required
              type="number"
              min="0.01"
              max="50"
              step="0.01"
              value={form.weightKg}
              onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="HSN code" htmlFor={`${uid}-hsn`} hint="Optional. Printed on the shipping invoice.">
            <input
              id={`${uid}-hsn`}
              value={form.hsn}
              onChange={(e) => setForm({ ...form, hsn: e.target.value })}
              placeholder="61091000"
              maxLength={10}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <FormField label="Length (cm)" htmlFor={`${uid}-length`}>
            <input
              id={`${uid}-length`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.lengthCm}
              onChange={(e) => setForm({ ...form, lengthCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Breadth (cm)" htmlFor={`${uid}-breadth`}>
            <input
              id={`${uid}-breadth`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.breadthCm}
              onChange={(e) => setForm({ ...form, breadthCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField label="Height (cm)" htmlFor={`${uid}-height`}>
            <input
              id={`${uid}-height`}
              required
              type="number"
              min="1"
              max="200"
              step="1"
              value={form.heightCm}
              onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>
      </FormCard>

      <FormCard
        title="Pricing"
        description="The price is what the customer pays. GST is already inside it, not added at checkout."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Price" htmlFor={`${uid}-price`} hint={pricePreview ? `Shows as ${pricePreview}` : undefined}>
            <input
              id={`${uid}-price`}
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Compare price"
            htmlFor={`${uid}-compare-price`}
            hint="Optional. Renders as a strike-through."
          >
            <input
              id={`${uid}-compare-price`}
              type="number"
              min="0"
              step="0.01"
              value={form.comparePrice}
              onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="GST rate" htmlFor={`${uid}-gst`} hint="The slab this product falls under.">
            <select
              id={`${uid}-gst`}
              value={form.gstRate}
              onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
              className={inputClass}
            >
              {GST_RATES.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}%
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Cost price"
            htmlFor={`${uid}-cost`}
            hint="What you pay for it, before GST. Never shown to customers."
          >
            <input
              id={`${uid}-cost`}
              type="number"
              min="0"
              step="0.01"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              placeholder="Optional"
              className={inputClass}
            />
          </FormField>
        </div>

        {breakdown && (
          <div className="rounded-2xl bg-surface-soft px-4 py-3.5">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
              What ₹{breakdown.price.toLocaleString("en-IN")} breaks down to
            </p>

            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">You keep</dt>
                <dd className="font-semibold text-ink">{formatPrice(breakdown.taxable)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">GST at {breakdown.rate}%</dt>
                <dd className="font-semibold text-ink">{formatPrice(breakdown.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-1.5">
                <dt className="font-semibold text-ink">Customer pays</dt>
                <dd className="font-bold text-ink">{formatPrice(breakdown.price)}</dd>
              </div>

              {breakdown.margin && (
                <>
                  <div className="flex justify-between pt-1.5">
                    <dt className="text-muted">Cost</dt>
                    <dd className="font-semibold text-ink">−{formatPrice(breakdown.margin.cost)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-1.5">
                    <dt className="font-semibold text-ink">Margin</dt>
                    <dd
                      className={cn(
                        "font-bold",
                        breakdown.margin.amount > 0 ? "text-mint-400" : "text-rose-500"
                      )}
                    >
                      {formatPrice(breakdown.margin.amount)}
                      <span className="ml-1.5 text-xs font-semibold">
                        {breakdown.margin.percent}%
                      </span>
                    </dd>
                  </div>
                </>
              )}
            </dl>

            {breakdown.margin && breakdown.margin.amount <= 0 && (
              <p className="mt-3 text-xs font-semibold leading-relaxed text-rose-500">
                This sells at a loss before you have paid for delivery or the payment gateway.
              </p>
            )}

            {breakdown.tax > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                That GST splits into CGST {formatPrice(breakdown.half)} + SGST{" "}
                {formatPrice(breakdown.tax - breakdown.half)} for a buyer in your own state, or goes out
                as IGST {formatPrice(breakdown.tax)} to anywhere else. Either way the customer pays the
                same.
              </p>
            )}

            {breakdown.saving && (
              <p className="mt-2 text-xs font-semibold text-mint-400">
                Shown as {breakdown.saving.percent}% off, saving {formatPrice(breakdown.saving.amount)}.
              </p>
            )}
          </div>
        )}
      </FormCard>

      <FormCard
        title="Product details"
        description="The spec table under the product. Dimensions, weight and category are listed for you; this is for what only you know."
      >
        <SpecEditor value={form.specs} onChange={(specs) => setForm({ ...form, specs })} />
      </FormCard>

      <FormCard
        title="More about it"
        description="The longer copy, in sections. Shown below the buy button, under its own headings."
      >
        <DetailsEditor value={form.details} onChange={(details) => setForm({ ...form, details })} />
      </FormCard>

      <FormCard title="Media" description="Upload photos or paste links. The first image becomes the cover.">
        <ImageUploader value={form.images} onChange={(images) => setForm({ ...form, images })} />
      </FormCard>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <ButtonLink href="/admin/products" variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
