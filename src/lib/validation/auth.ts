import { z } from "zod";

/** Shared action result shape for auth forms used with useActionState. */
export type AuthActionState = { error?: string; success?: string } | undefined;

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Podaj imię (min. 2 znaki)").max(100),
  email: z.email("Podaj poprawny adres e-mail").max(255).transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków").max(100),
});

export const loginSchema = z.object({
  email: z.email("Podaj poprawny adres e-mail").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Podaj hasło"),
});

export const requestResetSchema = z.object({
  email: z.email("Podaj poprawny adres e-mail").transform((v) => v.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Hasło musi mieć min. 8 znaków").max(100),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
