// src/features/authentication-v2/register-form-v2.jsx

import { useId, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRegisterV2 } from "./queries"; // ← নিচে queries.js এ যোগ করতে হবে
import img from "@/assets/image2.png";

// ── Schema ────────────────────────────────────────────────────────────────────
const formSchema = z
  .object({
    username:    z.string().min(3, "Username must be at least 3 characters"),
    employee_id: z.string().min(1, "Employee ID is required"),
    password:    z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role_name:   z.string().min(1, "Role is required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Component ─────────────────────────────────────────────────────────────────
export default function RegisterFormV2() {
  const id = useId();
  const navigate = useNavigate();
  const registerMutation = useRegisterV2();

  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "", employee_id: "", password: "",
      confirmPassword: "", role_name: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await registerMutation.mutateAsync({
        username:    data.username,
        password:    data.password,
        employee_id: Number(data.employee_id),
        role_name:   data.role_name,
      });
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Registration failed. Please try again.");
    }
  };

  const isSubmitting = registerMutation.isPending;

  return (
    <div className="max-w-sm mx-auto">

      {/* Logo & Header */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <img
          src={img}
          alt="Logo"
          width={170}
          height={170}
          className="object-contain"
        />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Fill in the details below to register.
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Username */}
          <FormField control={form.control} name="username" render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  id={`${id}-username`}
                  placeholder="your_username"
                  autoComplete="username"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Employee ID */}
          <FormField control={form.control} name="employee_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <Input
                  id={`${id}-employee_id`}
                  placeholder="e.g. 1001"
                  type="number"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Role */}
          <FormField control={form.control} name="role_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Input
                  id={`${id}-role_name`}
                  placeholder="e.g. ADMIN, USER"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Password */}
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`${id}-password`}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Confirm Password */}
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`${id}-confirmPassword`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="pr-10"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create Account"}
          </Button>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}