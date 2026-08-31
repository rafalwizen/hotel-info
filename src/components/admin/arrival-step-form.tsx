"use client";

import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LocalizedInput, LocalizedTextarea } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { uploadArrivalPhotoAction } from "@/server/actions/arrival";
import { arrivalStepSchema, type ArrivalStepInput } from "@/lib/validation/arrival";
import type { ActionState } from "@/lib/validation/types";

export type ArrivalStepFormValues = ArrivalStepInput & { photoUrl: string | null };

/** Client-side downscale: max 1600px JPEG q0.85 keeps blob uploads tiny. */
async function downscaleImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.type === "image/jpeg") return file;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  if (!blob) return file;
  return new File([blob], "photo.jpg", { type: "image/jpeg" });
}

/**
 * One arrival guide step card: title/body PL|EN + an optional photo
 * (uploaded to Vercel Blob immediately, URL saved with the step).
 */
export function ArrivalStepForm({
  defaultValues,
  onSubmit,
  onDelete,
  submitLabel = "Zapisz krok",
  title,
}: {
  defaultValues: ArrivalStepFormValues;
  onSubmit: (values: ArrivalStepFormValues) => Promise<ActionState>;
  onDelete?: () => Promise<ActionState>;
  submitLabel?: string;
  title?: string;
}) {
  const form = useForm<ArrivalStepInput>({
    resolver: zodResolver(arrivalStepSchema),
    defaultValues,
  });
  // Photo URL lives outside RHF: the schema does not model it and the
  // upload happens the moment a file is picked, not on submit.
  const [photoUrl, setPhotoUrl] = useState<string | null>(defaultValues.photoUrl);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const downscaled = await downscaleImage(file);
      const formData = new FormData();
      formData.append("file", downscaled);
      const result = await uploadArrivalPhotoAction(formData);
      if (result.error || !result.url) {
        toast.error(result.error ?? "Nie udało się wysłać zdjęcia.");
      } else {
        setPhotoUrl(result.url);
      }
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit({ ...values, photoUrl });
    if (result?.error) toast.error(result.error);
    else toast.success("Zapisano krok.");
  });

  const handleDelete = onDelete
    ? async () => {
        if (!window.confirm("Usunąć ten krok?")) return;
        const result = await onDelete();
        if (result?.error) toast.error(result.error);
        else toast.success("Usunięto krok.");
      }
    : undefined;

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <LocalizedInput name="title" label="Tytuł kroku" placeholderPl="np. Brama na kod" required />
            <LocalizedTextarea name="body" label="Opis" rows={3} />

            <div className="space-y-1.5">
              <span className="text-sm font-medium">Zdjęcie (opcjonalne)</span>
              {photoUrl ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Podgląd zdjęcia kroku"
                    className="h-28 rounded-md border object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    aria-label="Usuń zdjęcie"
                    className="absolute -top-2 -right-2 rounded-full"
                    onClick={() => setPhotoUrl(null)}
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInput.current?.click()}
                  >
                    {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
                    {uploading ? "Wysyłam…" : "Dodaj zdjęcie"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Pokaż dokładnie, gdzie skręcić: skrzynka kluczy, wejście od podwórza.
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <SubmitButton>{submitLabel}</SubmitButton>
              {handleDelete && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  Usuń
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
