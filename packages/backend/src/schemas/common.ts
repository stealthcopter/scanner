import { z } from "zod";

export const SeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);
export const ScanAggressivitySchema = z.enum(["low", "medium", "high"]);
export const CheckTypeSchema = z.enum(["passive", "active"]);
export const IdSchema = z.string().min(1);
