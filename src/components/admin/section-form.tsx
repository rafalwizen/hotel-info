"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconSelect } from "@/components/admin/icon-select";
import { LocalizedInput, LocalizedTextarea } from "@/components/admin/localized";
import { SubmitButton } from "@/components/admin/submit-button";
import { sectionSchema, type SectionInput } from "@/lib/validation/section";
import type { ActionState } from "@/lib/validation/types";

export type SectionFormValues = SectionInput;

/**
 * One section editor card (title/body PL|EN, icon, visibility). Used for
 * hotel sections, room templates and room-level overrides/extras.
 */
export function SectionForm({
  defaultValues,
  onSubmit,
  onDelete,
  submitLabel = "Zapisz sekcję",
  title,
}: {
  defaultValues: SectionFormValues;
  onSubmit: (values: SectionFormValues) => Promise<ActionState>;
  onDelete?: () => Promise<ActionState>;
  submitLabel?: string;
  title?: string;
}) {
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    const result = await onSubmit(values);
    if (result?.error) toast.error(result.error);
    else toast.success("Zapisano sekcję.");
  });

  const handleDelete = onDelete
    ? async () => {
        if (!window.confirm("Usunąć tę sekcję?")) return;
        const result = await onDelete();
        if (result?.error) toast.error(result.error);
        else toast.success("Usunięto sekcję.");
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
          <LocalizedInput name="title" label="Tytuł" required />
          <LocalizedTextarea name="body" label="Treść" rows={5} />
          <div className="grid gap-4 sm:grid-cols-2">
            <IconSelect name="icon" label="Ikona" />
            <label className="flex items-center gap-2 self-end pb-1 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-(--primary)"
                {...form.register("enabled")}
              />
              Widoczna na stronie gościa
            </label>
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
