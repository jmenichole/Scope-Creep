import { z } from 'zod';

export const projectSchema = z.object({
  clientName: z.string().min(1),
  freelancerName: z.string().min(1),
  scope: z.string().min(1),
  budget: z.coerce.number().nonnegative(),
});

export const analyzeSchema = z.object({
  projectId: z.string().uuid(),
  sender: z.enum(['client', 'freelancer']),
  message: z.string().min(1),
});
