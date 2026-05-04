// src\features\users\permission\update-permission-dialog.jsx

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useCreatePermission, useDeletePermission, useModulesForSelect } from "./queries";

const formSchema = z.object({
  moduleId: z.string().min(1, "Module is required"),
  permissionCode: z
    .string()
    .min(1, "Permission code is required")
    .max(100, "Permission code cannot exceed 100 characters"),
  permissionName: z
    .string()
    .min(1, "Permission name is required")
    .max(100, "Permission name cannot exceed 100 characters"),
  description: z.string().max(255, "Description cannot exceed 255 characters").optional(),
});

export default function UpdatePermissionDialog({
  open,
  onOpenChange,
  showConfirmation,
  permission,
}) {
  const deletePermissionMutation = useDeletePermission();
  const createPermissionMutation = useCreatePermission();
  const { data: modules = [], isLoading: isLoadingModules } = useModulesForSelect();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleId: "",
      permissionCode: "",
      permissionName: "",
      description: "",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (permission) {
      form.reset({
        moduleId: permission.MODULE_ID ? String(permission.MODULE_ID) : "",
        permissionCode: permission.PERMISSION_CODE || "",
        permissionName: permission.PERMISSION_NAME || "",
        description: permission.DESCRIPTION || "",
      });
    }
  }, [permission]);

  const onSubmit = async (data) => {
    if (!permission?.ID) {
      toast.error("Permission ID is missing");
      return;
    }

    try {
      // Delete old, create new (API has no PUT for permissions)
      await deletePermissionMutation.mutateAsync(permission.ID);
      await createPermissionMutation.mutateAsync({
        MODULE_ID: parseInt(data.moduleId),
        PERMISSION_CODE: data.permissionCode,
        PERMISSION_NAME: data.permissionName,
        DESCRIPTION: data.description || null,
      });

      toast.success("Permission updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update permission. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description:
          "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });

      if (!confirmed) return;
    }

    form.reset();
    onOpenChange(false);
  };

  const isSubmitting =
    deletePermissionMutation.isPending || createPermissionMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Permission</DialogTitle>
              <DialogDescription>
                Edit permission details for "{permission?.PERMISSION_NAME}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Module <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingModules || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={isLoadingModules ? "Loading modules..." : "Select a module"}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.ID} value={String(module.ID)}>
                          {module.MODULE_NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissionCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Permission Code <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. HR_VIEW_EMPLOYEE"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissionName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Permission Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. View Employee"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this permission..."
                      className="resize-none"
                      rows={3}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Updating...
                  </>
                ) : (
                  "Update Permission"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}