// src/features/authentication-v2/login-form-v2.jsx

import { useId, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthV2 } from "./use-auth-v2";
import img from "@/assets/image2.png";

export default function LoginFormV2() {
  const id = useId();
  const navigate = useNavigate();
  const { login, loginError, loginPending } = useAuthV2();
  const [showPassword, setShowPassword] = useState(false);

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   const username = e.target.username.value.trim();
  //   const password = e.target.password.value.trim();
  //   try {
  //     await login({ username, password });
  //     navigate("/dashboard");
  //   // eslint-disable-next-line no-empty, no-unused-vars
  //   } catch (_) {}
  // };

  // Login.jsx — handleSubmit বদলাও

const handleSubmit = async (e) => {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value.trim();
  try {
    const result = await login({ username, password });
    const roles = result?.data?.user?.roles || [];

    if (roles.includes("Admin")) {
      navigate("/dashboard");        // Admin → dashboard
    } else if (roles.includes("Inventory")) {
      navigate("/dashboard/welcome");          // Inventory → welcome page
    } else {
      navigate("/unauthorized");      // fallback
    }
  } catch (_) {}
};

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
          <h2 className="text-lg font-semibold">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Username */}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-username`}>Username</Label>
          <Input
            id={`${id}-username`}
            name="username"
            type="text"
            placeholder="your_username"
            autoComplete="username"
            required
            disabled={loginPending}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-password`}>Password</Label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loginPending}
              className="pr-10"
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
        </div>

        {/* Error */}
        {loginError && (
          <p className="text-sm text-destructive">{loginError.message}</p>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={loginPending}>
          {loginPending ? "Signing in…" : "Sign in"}
        </Button>

        {/* Register link */}
        {/* <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Create account
          </Link>
        </p> */}
      </form>
    </div>
  );
}