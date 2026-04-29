import { z } from "zod";

import { BoxSchema } from "./primitives";

export const REPEAT_RULE_LIMITS = {
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 365,
  MIN_DELAY_DAYS: 1,
  MAX_DELAY_DAYS: 365,
  MIN_ADVANCE_DAYS: 0,
  MAX_ADVANCE_DAYS: 90,
  MIN_ISO_WEEKDAY: 1,
  MAX_ISO_WEEKDAY: 7,
  MIN_DAY_OF_MONTH: 1,
  MAX_DAY_OF_MONTH: 31,
  MIN_MONTH: 1,
  MAX_MONTH: 12,
} as const;

const WeekdaySchema = z
  .number()
  .int()
  .min(REPEAT_RULE_LIMITS.MIN_ISO_WEEKDAY)
  .max(REPEAT_RULE_LIMITS.MAX_ISO_WEEKDAY);

const MonthAndDaySchema = z.object({
  month: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_MONTH)
    .max(REPEAT_RULE_LIMITS.MAX_MONTH),
  day: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_DAY_OF_MONTH)
    .max(REPEAT_RULE_LIMITS.MAX_DAY_OF_MONTH),
});

const FixedRepeatRuleSchema = z.object({
  type: z.literal("fixed"),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_INTERVAL)
    .max(REPEAT_RULE_LIMITS.MAX_INTERVAL),
  weekdays: z.array(WeekdaySchema).min(1).optional(),
  day_of_month: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_DAY_OF_MONTH)
    .max(REPEAT_RULE_LIMITS.MAX_DAY_OF_MONTH)
    .optional(),
  month_and_day: MonthAndDaySchema.optional(),
  target_box: BoxSchema,
  advance_days: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_ADVANCE_DAYS)
    .max(REPEAT_RULE_LIMITS.MAX_ADVANCE_DAYS),
});

const AfterCompletionRepeatRuleSchema = z.object({
  type: z.literal("after_completion"),
  delay_days: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_DELAY_DAYS)
    .max(REPEAT_RULE_LIMITS.MAX_DELAY_DAYS),
  target_box: BoxSchema,
  advance_days: z
    .number()
    .int()
    .min(REPEAT_RULE_LIMITS.MIN_ADVANCE_DAYS)
    .max(REPEAT_RULE_LIMITS.MAX_ADVANCE_DAYS),
});

export const RepeatRuleSchema = z.discriminatedUnion("type", [
  FixedRepeatRuleSchema,
  AfterCompletionRepeatRuleSchema,
]);

export type RepeatRule = z.infer<typeof RepeatRuleSchema>;
