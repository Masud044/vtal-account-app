import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import { Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateCustomer } from "./queries";

const formSchema = z.object({
  customerName:  z.string().min(1, "Customer name is required").max(200),
  contactPerson: z.string().max(100).optional(),
  phone:         z.string().max(50).optional(),
  mobile:        z.string().max(50).optional(),
  email:         z.string().email("Invalid email").optional().or(z.literal("")),
  address:       z.string().max(500).optional(),
  remarks:       z.string().max(500).optional(),
  status:        z.string().min(1, "Status is required"),
});

export default function UpdateCustomerSheet({ open, onOpenChange, showConfirmation, customer }) {
  const updateMutation = useUpdateCustomer();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "", contactPerson: "", phone: "", mobile: "",
      email: "", address: "", remarks: "", status: "1",
    },
  });

  const { formState: { isDirty } } = form;

  useEffect(() => {
    if (customer) {
      form.reset({
        customerName:  customer.CUSTOMER_NAME   || "",
        contactPerson: customer.CONTACT_PERSON  || "",
        phone:         customer.PHONE           || "",
        mobile:        customer.MOBILE          || "",
        email:         customer.EMAIL           || "",
        address:       customer.ADDRESS         || "",
        remarks:       customer.REMARKS         || "",
        status:        customer.STATUS != null ? String(customer.STATUS) : "1",
      });
    }
  }, [customer]);

  const onSubmit = async (data) => {
    if (!customer?.CUSTOMER_ID) { toast.error("Customer ID is missing."); return; }
    try {
      await updateMutation.mutateAsync({
        customerId: customer.CUSTOMER_ID,
        data: {
          CUSTOMER_NAME:  data.customerName,
          CONTACT_PERSON: data.contactPerson || null,
          PHONE:          data.phone         || null,
          MOBILE:         data.mobile        || null,
          EMAIL:          data.email         || null,
          ADDRESS:        data.address       || null,
          REMARKS:        data.remarks       || null,
          STATUS:         Number(data.status),
        },
      });
      toast.success("Customer updated successfully!");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update customer. Please try again.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const confirmed = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close without saving?",
        confirmText: "Discard",
        cancelText: "Keep Editing",
        variant: "destructive",
      });
      if (!confirmed) return;
    }
    form.reset();
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0 z-105">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Update Customer</SheetTitle>
              <SheetDescription>Editing customer #{customer?.CUSTOMER_ID}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Customer Name */}
              <FormField control={form.control} name="customerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Customer name" disabled={isSubmitting} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Contact Person + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input placeholder="Contact person" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="Phone number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Mobile + Email */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="mobile" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile</FormLabel>
                    <FormControl><Input placeholder="Mobile number" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@example.com" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Address */}
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Customer address" className="resize-none" rows={2} disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Remarks + Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="remarks" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl><Input placeholder="Optional remarks" disabled={isSubmitting} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent className="z-110">
                        <SelectItem value="1">Active</SelectItem>
                        <SelectItem value="0">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating...</> : "Update Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}