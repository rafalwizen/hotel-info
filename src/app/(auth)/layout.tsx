import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hotel Info",
  description: "Panel zarządzania treścią dla hoteli",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-2xl font-semibold tracking-tight">
          Hotel<span className="text-primary">Info</span>
        </span>
        <p className="text-sm text-muted-foreground">
          Informacje o pokoju prosto na telefon gościa
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
