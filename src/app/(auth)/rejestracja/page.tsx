import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Rejestracja — Hotel Info" };

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zarejestruj się</CardTitle>
        <CardDescription>
          Załóż konto i w kilku krokach przygotuj strony dla swoich pokoi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Masz już konto?{" "}
        <Link href="/zaloguj" className="ml-1 text-primary underline-offset-4 hover:underline">
          Zaloguj się
        </Link>
      </CardFooter>
    </Card>
  );
}
