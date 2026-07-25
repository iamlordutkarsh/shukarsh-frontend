"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, Trash2, UploadCloud } from "lucide-react";
import { useId, useRef, useState } from "react";
import { deleteProductImage, uploadProductImages } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { inputClass, labelClass } from "./FormField";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

function move(urls: string[], from: number, to: number) {
  if (to < 0 || to >= urls.length) return urls;
  const next = [...urls];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ImageUploader({ value, onChange, maxFiles = 8 }: ImageUploaderProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const remaining = Math.max(0, maxFiles - value.length);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (!token) {
      toast({ title: "Session expired", description: "Sign in again to upload images.", tone: "error" });
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) {
      toast({ title: "Image limit reached", description: `Up to ${maxFiles} images per product.`, tone: "error" });
      return;
    }

    setUploading(true);
    try {
      const { urls } = await uploadProductImages(token, files);
      onChange([...value, ...urls]);
      toast({
        title: urls.length === 1 ? "Image uploaded" : `${urls.length} images uploaded`,
        description: "Drag the arrows to reorder. The first image is the cover.",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Please try again in a moment.",
        tone: "error",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = async (index: number) => {
    const url = value[index];
    onChange(value.filter((_, position) => position !== index));

    if (token && url.includes("/storage/v1/object/public/")) {
      try {
        await deleteProductImage(token, url);
      } catch {
        // The product no longer references it; a stray object is harmless.
      }
    }
  };

  const addManualUrl = () => {
    const url = manualUrl.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      toast({ title: "That does not look like a URL", description: "Start with https://", tone: "error" });
      return;
    }

    if (value.includes(url)) {
      toast({ title: "Already added", description: "That image is already on this product.", tone: "error" });
      return;
    }

    onChange([...value, url]);
    setManualUrl("");
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-9 text-center transition-colors duration-200",
          dragActive ? "border-lavender-400 bg-lavender-50" : "border-line-strong bg-surface-soft"
        )}
      >
        <span
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl transition-colors",
            dragActive ? "bg-lavender-200 text-lavender-700" : "bg-lavender-100 text-lavender-600"
          )}
        >
          <UploadCloud className="h-6 w-6" strokeWidth={2.2} />
        </span>

        <div>
          <p className="text-sm font-semibold text-ink">Drop images here</p>
          <p className="mt-1 text-xs text-muted">
            JPEG, PNG, WebP or AVIF up to 5 MB each. {remaining} slot{remaining === 1 ? "" : "s"} left.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={uploading}
          disabled={remaining === 0}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Choose files"}
        </Button>

        <input
          ref={inputRef}
          id={`${uid}-files`}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files)}
        />
      </div>

      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, index) => (
            <li
              key={url}
              className="group relative overflow-hidden rounded-3xl bg-lavender-50 shadow-soft ring-1 ring-line"
            >
              <div className="relative aspect-square">
                <Image src={url} alt="" fill unoptimized sizes="200px" className="object-cover" />
              </div>

              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-ink-900/85 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white">
                  Cover
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-ink-900/70 to-transparent p-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onChange(move(value, index, index - 1))}
                  disabled={index === 0}
                  aria-label="Move image earlier"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(move(value, index, 0))}
                  disabled={index === 0}
                  aria-label="Make cover image"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white disabled:opacity-40"
                >
                  <Star className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(move(value, index, index + 1))}
                  disabled={index === value.length - 1}
                  aria-label="Move image later"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink transition-colors hover:bg-white disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => void removeAt(index)}
                  aria-label="Remove image"
                  className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-blush-600 transition-colors hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length === 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-surface-soft px-4 py-3 text-xs text-muted">
          <ImagePlus className="h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.2} />
          No images yet. Products without images show a pastel tile on the storefront.
        </p>
      )}

      <div className="space-y-2">
        <label htmlFor={`${uid}-manual`} className={labelClass}>
          Or paste an image URL
        </label>
        <div className="flex gap-2">
          <input
            id={`${uid}-manual`}
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addManualUrl();
              }
            }}
            placeholder="https://images.unsplash.com/photo-..."
            className={cn(inputClass, "font-mono text-xs")}
          />
          <Button type="button" variant="secondary" size="md" onClick={addManualUrl} disabled={remaining === 0}>
            <Link2 className="h-4 w-4" strokeWidth={2.4} />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
