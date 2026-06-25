import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().trim().min(1).max(100),
  accessCode: z.string().min(1).max(100),
});

export const signUpStaff = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signUpSchema.parse(data))
  .handler(async ({ data }) => {
    const expected = process.env.STAFF_ACCESS_CODE;
    if (!expected || data.accessCode.trim() !== expected) {
      throw new Error("Invalid staff access code");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });
