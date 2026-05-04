import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useChangePassword } from "./queries";

const formSchema = z
  .object({
    newPassword:     z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ChangePasswordDialog({ open, onOpenChange, user }) {
  const changePasswordMutation = useChangePassword();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (open) form.reset({ newPassword: "", confirmPassword: "" });
  }, [open]);

  const onSubmit = async (data) => {
    if (!user?.ID) return toast.error("User ID is missing");
    try {
      await changePasswordMutation.mutateAsync({ id: user.ID, newPassword: data.newPassword });
      toast.success("Password changed successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to change password.");
    }
  };

  const isSubmitting = changePasswordMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Set new password for "{user?.USERNAME}"</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField control={form.control} name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 6 characters" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Re-enter password" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 text-white border-0">
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Changing...</> : "Change Password"}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}