import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateChartOfAccount, useChartOfAccounts } from "./queries";

const formSchema = z.object({
  accountId:     z.string().min(1, "Account ID is required").max(10),
  accountName:   z.string().min(1, "Account Name is required").max(50),
  firstLevelId:  z.string().optional(),
  secondLevelId: z.string().optional(),
  thirdLevelId:  z.string().optional(),
  enabled:       z.string(),
  lastLevel:     z.string(),
});

// deepest selected value becomes PARENT_ACCOUNT_ID
function deriveParent(data) {
  if (data.thirdLevelId)  return { parentAccountId: data.thirdLevelId,  lebel: 4 };
  if (data.secondLevelId) return { parentAccountId: data.secondLevelId, lebel: 3 };
  if (data.firstLevelId)  return { parentAccountId: data.firstLevelId,  lebel: 2 };
  return { parentAccountId: "0", lebel: 1 };
}

// Pre-fill: find which level option matches current PARENT_ACCOUNT_ID
// resolveInitialLevels — ACCOUNT_ID দিয়ে match করে row ID return করবে
function resolveInitialLevels(allAccounts, parentAccountId) {
  if (!parentAccountId || parentAccountId === "0") {
    return { firstLevelId: "", secondLevelId: "", thirdLevelId: "" };
  }

  // parent_account_id stores the ACCOUNT_ID string → find the row
  const parent = allAccounts.find((a) => a.ACCOUNT_ID === parentAccountId);
  if (!parent) return { firstLevelId: "", secondLevelId: "", thirdLevelId: "" };

  const lvl = Number(parent.LEBEL);
  const rowId = String(parent.ID); // ← row PK, same as Add sheet

  if (lvl === 1) return { firstLevelId: rowId, secondLevelId: "", thirdLevelId: "" };
  if (lvl === 2) return { firstLevelId: "", secondLevelId: rowId, thirdLevelId: "" };
  if (lvl === 3) return { firstLevelId: "", secondLevelId: "", thirdLevelId: rowId };
  return { firstLevelId: "", secondLevelId: "", thirdLevelId: "" };
}

export default function UpdateChartSheet({ open, onOpenChange, showConfirmation, account }) {
  const updateMutation = useUpdateChartOfAccount();
  const { data: allAccounts = [] } = useChartOfAccounts();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountId: "", accountName: "",
      firstLevelId: "", secondLevelId: "", thirdLevelId: "",
      enabled: "1", lastLevel: "0",
    },
  });

  const { formState: { isDirty } } = form;

  // Each dropdown independent — filtered only by LEBEL
  const level1Options = useMemo(
    () => allAccounts.filter((a) => Number(a.LEBEL) === 1),
    [allAccounts]
  );
  const level2Options = useMemo(
    () => allAccounts.filter((a) => Number(a.LEBEL) === 2),
    [allAccounts]
  );
  const level3Options = useMemo(
    () => allAccounts.filter((a) => Number(a.LEBEL) === 3),
    [allAccounts]
  );

  // Pre-fill when account prop changes
  useEffect(() => {
    if (account && allAccounts.length > 0) {
      const { firstLevelId, secondLevelId, thirdLevelId } =
        resolveInitialLevels(allAccounts, account.PARENT_ACCOUNT_ID);

      form.reset({
        accountId:     account.ACCOUNT_ID    || "",
        accountName:   account.ACCOUNT_NAME  || "",
        firstLevelId,
        secondLevelId,
        thirdLevelId,
        enabled:       account.ENABLED   != null ? String(account.ENABLED)   : "1",
        lastLevel:     account.LASTLEVEL != null ? String(account.LASTLEVEL) : "0",
      });
    }
  }, [account, allAccounts]);

  const onSubmit = async (data) => {
    if (!account?.ID) { toast.error("Account ID is missing."); return; }
    const { parentAccountId, lebel } = deriveParent(data);
    try {
      await updateMutation.mutateAsync({
        id: account.ID,
        data: {
          account_id:        data.accountId,
          account_name:      data.accountName,
          account_type:      account.ACCOUNT_TYPE ?? 0,
          is_parent:         account.IS_PARENT    ?? 0,
          parent_account_id: parentAccountId,
          lebel,
          lastlevel:         Number(data.lastLevel),
          enabled:           Number(data.enabled),
        },
      });
      toast.success("Account updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update account. Please try again.");
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
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="sm:max-w-xl w-full flex flex-col gap-0 p-0 z-105">

        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Update Account</SheetTitle>
              <SheetDescription>Editing: {account?.ACCOUNT_NAME}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Account Name */}
              <FormField control={form.control} name="accountName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account name" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Three independent level selects */}
              <div className="grid grid-cols-3 gap-4">

                <FormField control={form.control} name="firstLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Level <span className="text-destructive">*</span></FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select First Level" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level1Options.map((a) => (
                          <SelectItem key={a.ACCOUNT_ID} value={a.ACCOUNT_ID}>
                            {a.ACCOUNT_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="secondLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Level</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Second Level" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level2Options.map((a) => (
                          <SelectItem key={a.ACCOUNT_ID} value={a.ACCOUNT_ID}>
                            {a.ACCOUNT_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="thirdLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Third Level</FormLabel>
                    <Select disabled={isSubmitting} onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select Third Level" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level3Options.map((a) => (
                          <SelectItem key={a.ACCOUNT_ID} value={a.ACCOUNT_ID}>
                            {a.ACCOUNT_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

              </div>

              {/* Enabled + Last Level */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="enabled" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <RadioGroup disabled={isSubmitting} onValueChange={field.onChange} value={field.value} className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="1" id="upd-en-yes" />
                          <label htmlFor="upd-en-yes" className="text-sm cursor-pointer">Yes</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="0" id="upd-en-no" />
                          <label htmlFor="upd-en-no" className="text-sm cursor-pointer">No</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="lastLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Level</FormLabel>
                    <FormControl>
                      <RadioGroup disabled={isSubmitting} onValueChange={field.onChange} value={field.value} className="flex items-center gap-6 pt-1">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="1" id="upd-ll-yes" />
                          <label htmlFor="upd-ll-yes" className="text-sm cursor-pointer">Yes</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="0" id="upd-ll-no" />
                          <label htmlFor="upd-ll-no" className="text-sm cursor-pointer">No</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating...</> : "Update Account"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}