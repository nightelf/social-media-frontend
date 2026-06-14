import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your username, email, or phone"),
  password: z.string().min(1, "Enter your password"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const passwordlessSchema = z.object({
  identifier: z.string().min(1, "Enter your verified email or phone"),
});
export type PasswordlessValues = z.infer<typeof passwordlessSchema>;

export const registerSchema = z
  .object({
    username: z.string().min(3, "At least 3 characters").max(150),
    email: z.string().email("Enter a valid email").optional().or(z.literal("")),
    phone: z
      .string()
      .regex(/^\+?[0-9]{7,15}$/, "Enter a valid phone (e.g. +15555550123)")
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "At least 8 characters"),
  })
  .refine((d) => d.email || d.phone, {
    message: "Provide at least one of email or phone",
    path: ["email"],
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const postSchema = z.object({
  body: z.string().min(1, "Say something").max(500, "Keep it under 500 characters"),
});
export type PostValues = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  body: z.string().min(1, "Write a comment").max(500),
});
export type CommentValues = z.infer<typeof commentSchema>;
