import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUpdateChartOfAccount, useChartOfAccounts } from "./queries";

// ── Schema ────────────────────────────────────────────────────────────────────
const formSchema = z.object({
  accountName:   z.string().min(1, "Account Name is required").max(50),
  firstLevelId:  z.string().optional(),
  secondLevelId: z.string().optional(),
  thirdLevelId:  z.string().optional(),
  enabled:       z.string(),
  lastLevel:     z.string(),
});

const defaultValues = {
  accountName:   "",
  firstLevelId:  "",
  secondLevelId: "",
  thirdLevelId:  "",
  enabled:       "1",
  lastLevel:     "0",
};

// ── Helper — walk up the tree to fill all three level IDs ─────────────────────
function resolveInitialLevels(allAccounts, parentAccountId) {
  if (!parentAccountId || parentAccountId === "0") {
    return { firstLevelId: "", secondLevelId: "", thirdLevelId: "" };
  }

  const result = { firstLevelId: "", secondLevelId: "", thirdLevelId: "" };
  let current  = allAccounts.find((a) => a.ACCOUNT_ID === parentAccountId);

  while (current) {
    const lvl   = Number(current.LEBEL);
    const rowId = String(current.ID);

    if (lvl === 1) { result.firstLevelId  = rowId; break; }
    if (lvl === 2)   result.secondLevelId = rowId;
    if (lvl === 3)   result.thirdLevelId  = rowId;

    current = allAccounts.find((a) => a.ACCOUNT_ID === current.PARENT_ACCOUNT_ID);
  }

  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function UpdateChartSheet({ open, onOpenChange, showConfirmation, account }) {
  const updateMutation = useUpdateChartOfAccount();
  const { data: allAccounts = [] } = useChartOfAccounts();

  const form = useForm({ resolver: zodResolver(formSchema), defaultValues });
  const { formState: { isDirty } } = form;

  // Watch selected IDs for cascading filter
  const firstLevelId  = form.watch("firstLevelId");
  const secondLevelId = form.watch("secondLevelId");

  // ── Cascading dropdown options ─────────────────────────────────────────────
  const level1Options = useMemo(
    () => allAccounts.filter((a) => Number(a.LEBEL) === 1),
    [allAccounts]
  );

  const level2Options = useMemo(() => {
    if (!firstLevelId) return [];
    const parent = allAccounts.find((a) => String(a.ID) === firstLevelId);
    if (!parent) return [];
    return allAccounts.filter(
      (a) => Number(a.LEBEL) === 2 && a.PARENT_ACCOUNT_ID === parent.ACCOUNT_ID
    );
  }, [allAccounts, firstLevelId]);

  const level3Options = useMemo(() => {
    if (!secondLevelId) return [];
    const parent = allAccounts.find((a) => String(a.ID) === secondLevelId);
    if (!parent) return [];
    return allAccounts.filter(
      (a) => Number(a.LEBEL) === 3 && a.PARENT_ACCOUNT_ID === parent.ACCOUNT_ID
    );
  }, [allAccounts, secondLevelId]);

  // ── Auto-fill when account prop arrives ──────────────────────────────────
  useEffect(() => {
    if (account && allAccounts.length > 0) {
      const { firstLevelId, secondLevelId, thirdLevelId } =
        resolveInitialLevels(allAccounts, account.PARENT_ACCOUNT_ID);

      form.reset({
        accountName:   account.ACCOUNT_NAME  || "",
        firstLevelId,
        secondLevelId,
        thirdLevelId,
        enabled:   account.ENABLED   != null ? String(account.ENABLED)   : "1",
        lastLevel: account.LASTLEVEL != null ? String(account.LASTLEVEL) : "0",
      });
    }
  }, [account, allAccounts]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    if (!account?.ID) { toast.error("Account ID is missing."); return; }

    const payload = {
      account_name: data.accountName,
      lastlevel:    Number(data.lastLevel),
      enabled:      Number(data.enabled),
    };

    if (data.thirdLevelId)       payload.drop_3 = data.thirdLevelId;
    else if (data.secondLevelId) payload.drop_2 = data.secondLevelId;
    else if (data.firstLevelId)  payload.drop_1 = data.firstLevelId;

    try {
      await updateMutation.mutateAsync({ id: account.ID, data: payload });
      toast.success("Account updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update account. Please try again.");
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────
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

  // ── Render ────────────────────────────────────────────────────────────────
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

              {/* Level Selects */}
              <div className="grid grid-cols-2 gap-4">

                {/* First Level */}
                <FormField control={form.control} name="firstLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Level</FormLabel>
                    <Select
                      disabled={isSubmitting}
                      value={field.value || ""}
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("secondLevelId", "");
                        form.setValue("thirdLevelId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level1Options.map((a) => (
                          <SelectItem key={a.ID} value={String(a.ID)}>
                            {String(a.ACCOUNT_NAME).trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Second Level — disabled until L1 selected */}
                <FormField control={form.control} name="secondLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Level</FormLabel>
                    <Select
                      disabled={isSubmitting || !firstLevelId}
                      value={field.value || ""}
                      onValueChange={(val) => {
                        field.onChange(val);
                        form.setValue("thirdLevelId", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={firstLevelId ? "Select" : "Select L1 first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level2Options.map((a) => (
                          <SelectItem key={a.ID} value={String(a.ID)}>
                            {String(a.ACCOUNT_NAME).trim()}
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

                 {/* Third Level — disabled until L2 selected */}
                <FormField control={form.control} name="thirdLevelId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Third Level</FormLabel>
                    <Select
                      disabled={isSubmitting || !secondLevelId}
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={secondLevelId ? "Select" : "Select L2 first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-106">
                        {level3Options.map((a) => (
                          <SelectItem key={a.ID} value={String(a.ID)}>
                            {String(a.ACCOUNT_NAME).trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
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

             
              </div>
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

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? <><Spinner className="mr-2 h-4 w-4" />Updating...</>
                  : "Update Account"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}