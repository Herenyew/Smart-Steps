import { z } from "zod";

export const chatMessageSchema = z.strictObject({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(500),
});

export const chatRequestSchema = z.strictObject({
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export const planActivitySchema = z.strictObject({
  title: z.string().trim().min(2).max(60),
  description: z.string().trim().min(5).max(160),
  points: z.number().int().min(5).max(20),
  icon: z.string().trim().min(1).max(8),
  kind: z.enum(["manual", "walk", "run", "strength", "hydration"]),
});

export const wellnessPlanSchema = z.strictObject({
  summary: z.string().trim().min(10).max(500),
  activities: z.array(planActivitySchema).min(4).max(8),
  safetyNotice: z.string().trim().min(10).max(300),
});

export const chatResponseSchema = z
  .strictObject({
    message: z.string().trim().min(1).max(2000),
    planComplete: z.boolean(),
    plan: wellnessPlanSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.planComplete && !value.plan) {
      context.addIssue({
        code: "custom",
        path: ["plan"],
        message: "A completed response must include a plan.",
      });
    }
    if (!value.planComplete && value.plan) {
      context.addIssue({
        code: "custom",
        path: ["plan"],
        message: "An incomplete response must not include a plan.",
      });
    }
  });

export const providerResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        content: z.string().min(1),
      }),
    })
  ).min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type WellnessPlan = z.infer<typeof wellnessPlanSchema>;
