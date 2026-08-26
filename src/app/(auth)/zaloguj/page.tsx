import Link from "next/link";
import { loginAction } from "@/server/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Zaloguj się — Hotel Info" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/zaloguj">) {
  const { next } = await searchParams;
  const nextPath =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/panel";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>Panel zarządzania Twoim hotelem</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm action={loginAction} nextPath={nextPath} />
      </CardContent>
      <CardFooter className="flex flex-col gap-3 text-sm">
        <div className="text-muted-foreground">
          Nie masz konta?{" "}
          <Link href="/rejestracja" className="text-primary underline-offset-4 hover:underline">
            Zarejestruj się
          </Link>
        </div>
        <div>
          <Link
            href="/reset-hasla"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Nie pamiętam hasła
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
