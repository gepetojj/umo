import { z } from "zod";

export const planIdSchema = z.enum(["starter", "gold"]);
