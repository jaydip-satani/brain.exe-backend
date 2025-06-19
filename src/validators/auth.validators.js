import z from "zod";

const UserRegisterSchema = z.object({
  email: z.string().email(),
  name: z.string().min(3),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
});

const UserloginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export { UserRegisterSchema, UserloginSchema };
