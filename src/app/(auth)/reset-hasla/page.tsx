import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RequestResetForm } from "./request-reset-form";
import { NewPasswordForm } from "./new-password-form";

export const metadata = { title: "Reset hasła — Hotel Info" };

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-hasla">) {
  const { token } = await searchParams;
  const hasToken = typeof token === "string" && token.length >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasToken ? "Nowe hasło" : "Reset hasła"}</CardTitle>
        <CardDescription>
          {hasToken
            ? "Ustaw nowe hasło do swojego konta Hotel Info"
            : "Podaj adres e-mail — wyślemy link do zmiany hasła"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasToken ? <NewPasswordForm token={token} /> : <RequestResetForm />}
      </CardContent>
    </Card>
  );
}
