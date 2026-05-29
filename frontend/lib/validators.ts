import { z } from "zod";
import { isValidMoroccanPhone } from "@/lib/phone";

export const checkoutSchema = z.object({
  fullName: z.string().min(3, "دخلي الاسم الكامل"),
  phone: z.string().refine(isValidMoroccanPhone, "دخلي رقم هاتف مغربي صحيح"),
  city: z.string().min(2, "دخلي المدينة"),
  address: z.string().min(5, "دخلي العنوان كامل"),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;
