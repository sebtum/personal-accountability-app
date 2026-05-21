"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={pending}
    >
      {pending ? "Wird gelöscht…" : "Löschen"}
    </Button>
  );
}

export function DeleteForm({
  action,
  confirmMessage,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  children?: React.ReactNode;
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(confirmMessage)) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={handleSubmit}>
      {children}
      <DeleteSubmitButton />
    </form>
  );
}
