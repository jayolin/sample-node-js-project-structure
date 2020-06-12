import BaseJoi from "joi";
import JoiDateExtention from "joi-date-extensions";
const Joi = BaseJoi.extend(JoiDateExtention);

export const SampleSchema = Joi.object({
  sample_field: Joi
    .string()
    .trim()
    .required()
});
