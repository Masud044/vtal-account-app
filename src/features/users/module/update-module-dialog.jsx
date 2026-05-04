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
import { LayoutGrid } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateModule } from "./queries";

const formSchema = z.object({
  moduleName: z
    .string()
    .min(1, "Module name is required")
    .max(100, "Module name cannot exceed 100 characters"),
  description: z.string().max(255, "Description cannot exceed 255 characters").optional(),
  sequenceNo: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), { message: "Sequence must be a number" }),
});

export default function UpdateModuleDialog({
  open,
  onOpenChange,
  showConfirmation,
  module,
}) {
  const updateModuleMutation = useUpdateModule();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleName: "",
      description: "",
      sequenceNo: "",
    },
  });

  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    if (module) {
      form.reset({
        moduleName: module.MODULE_NAME || "",
        description: module.DESCRIPTION || "",
        sequenceNo: module.SEQUENCE_NO != null ? String(module.SEQUENCE_NO) : "",
      });
    }
  }, [module]);

  const onSubmit = async (data) => {
    if (!module?.ID) {
      toast.error("Module ID is missing");
      return;
    }

    try {
      await updateModuleMutation.mutateAsync({
        id: module.ID,
        data: {
          MODULE_NAME: data.moduleName,
          DESCRIPTION: data.description || null,
          SEQUENCE_NO: data.sequenceNo ? parseInt(data.sequenceNo) : null,
        },
      });

      toast.success("Module updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update module. Please try again.");
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

  const isSubmitting = updateModuleMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleCancel();
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Update Module</DialogTitle>
              <DialogDescription>
                Edit module details for "{module?.MODULE_NAME}"
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-5">
            <FormField
              control={form.control}
              name="moduleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Module Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. HR Management"
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
              name="sequenceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence No.</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 1"
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
                      placeholder="Brief description of this module..."
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
                  "Update Module"
                )}
              </Button>
            </DialogFooter>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}