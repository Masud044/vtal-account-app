import { useEffect, useState } from "react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-toastify";
import { format } from "date-fns";
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
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/DatePicker";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  PackageCheck, Plus, Trash2, ChevronsUpDown, Check,
  CheckCheck, CheckCircle2,
} from "lucide-react";
import {
  useUpdateGRN,
  useStores,
  useAllItems,
  useGRNById,
  useUOMList,
  useApproveDetailGRN,
  useApproveAllGRN,
} from "./queries";

/* ─── Constants ──────────────────────────────────────────────────────────── */
const REV_TYPE_OPTIONS  = ["PURCHASE", "RETURN", "TRANSFER", "ADJUSTMENT"];
const RECV_TYPE_OPTIONS = ["DIRECT", "INDIRECT", "CROSS_DOCK"];
const ITEM_TYPE_OPTIONS = [
  { value: "1", label: "Raw Material" },
  { value: "2", label: "Finished Goods" },
  { value: "3", label: "Spare Parts" },
  { value: "4", label: "Consumable" },
];

const emptyDetail = () => ({
  TID: undefined, GRNLINE: undefined, ITEMID: undefined, REVQTY: "",
  STOREID: undefined, UOM: "", COST: "", UNIT_PRICE: "",
  SELLING_UNIT_PRICE: "", REVTYPE: "PURCHASE", STORERECVTYPE: "DIRECT",
  ITEMTYPE: "", CHALLAN_NO: "", PONO: "", _status: 1,
});

/* ─── Map raw DB row → form values (includes TID + _status for approve) ─── */
const mapDetailToForm = (d) => ({
  TID:                d.TID     ?? undefined,          // ← needed for per-row approve
  GRNLINE:            d.GRNLINE ?? undefined,
  ITEMID:             d.ITEMID  ? Number(d.ITEMID)  : undefined,
  REVQTY:             d.REVQTY  ?? "",
  STOREID:            d.STOREID ? Number(d.STOREID) : undefined,
  UOM:                d.UOM     || "",
  COST:               d.COST               ?? "",
  UNIT_PRICE:         d.UNIT_PRICE         ?? "",
  SELLING_UNIT_PRICE: d.SELLING_UNIT_PRICE ?? "",
  REVTYPE:            d.REVTYPE       || "PURCHASE",
  STORERECVTYPE:      d.STORERECVTYPE || "DIRECT",
  ITEMTYPE:           d.ITEMTYPE != null ? String(d.ITEMTYPE) : "",
  CHALLAN_NO:         d.CHALLAN_NO || "",
  PONO:               d.PONO       || "",
  _status:            d.STATUS ?? 1,                   // ← 1 = Pending, 2 = Approved
});

/* ─── Zod ────────────────────────────────────────────────────────────────── */
const detailSchema = z.object({
  TID:                z.number().optional(),
  GRNLINE:            z.number().optional(),
  ITEMID:             z.number({ required_error: "Item required" }),
  REVQTY:             z.coerce.number({ invalid_type_error: "Number required" }).positive("Must be > 0"),
  STOREID:            z.coerce.number({ required_error: "Store required" }),
  UOM:                z.string().optional(),
  COST:               z.coerce.number().min(0).default(0),
  UNIT_PRICE:         z.coerce.number().min(0).default(0),
  SELLING_UNIT_PRICE: z.coerce.number().min(0).default(0),
  REVTYPE:            z.string().optional(),
  STORERECVTYPE:      z.string().optional(),
  ITEMTYPE:           z.string().optional(),
  CHALLAN_NO:         z.string().optional(),
  PONO:               z.string().optional(),
  _status:            z.number().optional(),
});

const formSchema = z.object({
  GRNDATE:   z.string().min(1, "Date required"),
  GRNNO:     z.string().optional(),
  CHALLANNO: z.string().optional(),
  PONO:      z.string().optional(),
  details:   z.array(detailSchema).min(1, "At least one item required"),
});

/* ─── TinySelect ─────────────────────────────────────────────────────────── */
function TinySelect({ control, name, options, placeholder, disabled }) {
  return (
    <FormField control={control} name={name}
      render={({ field }) => (
        <FormItem className="space-y-0">
          <Select
            disabled={disabled}
            onValueChange={field.onChange}
            value={field.value != null ? String(field.value) : ""}
          >
            <FormControl>
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="z-[200]">
              {options.map((o) => (
                <SelectItem
                  key={typeof o === "string" ? o : o.value}
                  value={typeof o === "string" ? o : o.value}
                  className="text-xs"
                >
                  {typeof o === "string" ? o : o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage className="text-[10px]" />
        </FormItem>
      )}
    />
  );
}

/* ─── Item Row ────────────────────────────────────────────────────────────── */
function ItemRow({
  index, control, onRemove,
  stores, allItems, allItemsLoading, uomList,
  isApproved, detailTid, masterTid, onApproved,
}) {
  const [itemOpen, setItemOpen]     = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const form                        = useFormContext();
  const approveDetailMutation       = useApproveDetailGRN();

  const selectedItemId = form.watch(`details.${index}.ITEMID`);
  const filteredItems  = (allItems || []).filter((it) =>
    it.NAME?.toLowerCase().includes(itemSearch.toLowerCase())
  );
  const selectedItem = (allItems || []).find((it) => it.ITEM_ID === selectedItemId);

  const handleItemSelect = (it) => {
    form.setValue(`details.${index}.ITEMID`, it.ITEM_ID, { shouldDirty: true });
    form.setValue(`details.${index}.UOM`, it.UNIT || "", { shouldDirty: true });
    setItemOpen(false);
    setItemSearch("");
  };

  // ── Approve this single row ──────────────────────────────────────────────
  const handleApproveRow = async () => {
    if (!detailTid || !masterTid) return;
    try {
      await approveDetailMutation.mutateAsync({ masterTid, detailTid });
      toast.success("Item approved — stock updated.");
      if (onApproved) onApproved();
    } catch (err) {
      toast.error(err?.message || "Failed to approve item.");
    }
  };

  return (
    <tr className={cn(
      "border-b border-border last:border-0 transition-colors group",
      isApproved ? "opacity-60 bg-muted/10" : "hover:bg-muted/30"
    )}>
      {/* # */}
      <td className="px-2 py-2 text-center align-middle w-8">
        <span className="text-[11px] text-muted-foreground/60 font-mono font-semibold">
          {String(index + 1).padStart(2, "0")}
        </span>
      </td>

      {/* Item */}
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.ITEMID`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <Popover open={itemOpen} onOpenChange={setItemOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" disabled={isApproved}
                      className={cn("w-full justify-between font-normal text-xs h-8", !field.value && "text-muted-foreground")}
                    >
                      <span className="truncate max-w-[160px]">
                        {selectedItem
                          ? selectedItem.NAME
                          : field.value
                          ? (allItemsLoading ? "Loading…" : `Item #${field.value}`)
                          : "Select item…"}
                      </span>
                      {!isApproved && <ChevronsUpDown className="ml-1 h-3 w-3 opacity-50 shrink-0" />}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput placeholder="Search item…" value={itemSearch} onValueChange={setItemSearch} className="text-xs h-9" />
                    <CommandList>
                      {allItemsLoading && (
                        <div className="flex items-center justify-center py-4"><Spinner className="h-4 w-4" /></div>
                      )}
                      {!allItemsLoading && filteredItems.length === 0 && (
                        <CommandEmpty className="text-xs">{itemSearch ? `"${itemSearch}" not found` : "No items"}</CommandEmpty>
                      )}
                      <CommandGroup>
                        {filteredItems.map((it) => (
                          <CommandItem key={it.ITEM_ID} value={String(it.ITEM_ID)} onSelect={() => handleItemSelect(it)}>
                            <Check className={cn("mr-2 h-3.5 w-3.5", field.value === it.ITEM_ID ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium truncate">{it.NAME}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {it.ITEM_ID}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage className="text-[10px] mt-0.5" />
            </FormItem>
          )}
        />
      </td>

      {/* Store */}
      <td className="px-1 py-2 align-middle">
        <TinySelect control={control} name={`details.${index}.STOREID`} disabled={isApproved}
          options={stores.map((s) => ({ value: String(s.STORE_ID), label: s.STORE_NAME }))}
          placeholder="Select store…"
        />
      </td>

      {/* Rev Qty */}
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.REVQTY`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl className="w-20">
                <Input type="number" min={0} step="1" placeholder="0" disabled={isApproved}
                  className="h-8 text-xs text-center" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage className="text-[10px]" />
            </FormItem>
          )}
        />
      </td>

      {/* UOM */}
      <td className="px-1 py-2 align-middle">
        <TinySelect control={control} name={`details.${index}.UOM`} disabled={isApproved}
          options={uomList.map((u) => ({ value: u.NAME.trim(), label: u.NAME.trim() }))}
          placeholder="UOM…"
        />
      </td>

      {/* Cost */}
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.COST`}
          render={({ field }) => (
            <FormItem className="w-20">
              <FormControl>
                <Input type="number" min={0} step="0.01" placeholder="0.00" disabled={isApproved}
                  className="h-8 text-xs text-right" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* Unit Price */}
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.UNIT_PRICE`}
          render={({ field }) => (
            <FormItem className="w-20">
              <FormControl>
                <Input type="number" min={0} step="0.01" placeholder="0.00" disabled={isApproved}
                  className="h-8 text-xs text-right" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* Selling Price */}
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.SELLING_UNIT_PRICE`}
          render={({ field }) => (
            <FormItem className="w-20">
              <FormControl>
                <Input type="number" min={0} step="0.01" placeholder="0.00" disabled={isApproved}
                  className="h-8 text-xs text-right" {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />
      </td>

      <td className="px-1 py-2 align-middle">
        <TinySelect control={control} name={`details.${index}.REVTYPE`}       disabled={isApproved} options={REV_TYPE_OPTIONS}  placeholder="Rev type…" />
      </td>
      <td className="px-1 py-2 align-middle">
        <TinySelect control={control} name={`details.${index}.STORERECVTYPE`} disabled={isApproved} options={RECV_TYPE_OPTIONS} placeholder="Recv type…" />
      </td>
      <td className="px-1 py-2 align-middle">
        <TinySelect control={control} name={`details.${index}.ITEMTYPE`}      disabled={isApproved} options={ITEM_TYPE_OPTIONS} placeholder="Item type…" />
      </td>

      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.PONO`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl><Input placeholder="PO-XXXX" disabled={isApproved} className="h-8 text-xs" {...field} value={field.value || ""} /></FormControl>
            </FormItem>
          )}
        />
      </td>
      <td className="px-1 py-2 align-middle">
        <FormField control={control} name={`details.${index}.CHALLAN_NO`}
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormControl><Input placeholder="CH-XXXX" disabled={isApproved} className="h-8 text-xs" {...field} value={field.value || ""} /></FormControl>
            </FormItem>
          )}
        />
      </td>

      {/* Status badge */}
      <td className="px-2 py-2 align-middle text-center">
        {isApproved ? (
          <Badge className="text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-300 dark:border-green-800 hover:bg-green-100">
            Approved
          </Badge>
        ) : (
          <Badge className="text-[10px] font-semibold uppercase tracking-wide bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800 hover:bg-yellow-100">
            Pending
          </Badge>
        )}
      </td>

      {/* Approve action */}
      <td className="px-2 py-2 align-middle text-center">
        {isApproved ? (
          <CheckCircle2 className="h-4 w-4 text-green-500/50 mx-auto" />
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
            onClick={handleApproveRow}
            disabled={approveDetailMutation.isPending}
            title="Approve this item — stock will be updated"
          >
            {approveDetailMutation.isPending
              ? <Spinner className="h-3 w-3" />
              : <Check className="h-3.5 w-3.5" />
            }
          </Button>
        )}
      </td>

      {/* Remove — blocked for approved rows */}
      <td className="px-2 py-2 align-middle text-center">
        <Button type="button" variant="ghost" size="icon" disabled={isApproved}
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function UpdateGRNSheet({ open, onOpenChange, showConfirmation, grnTid }) {
  const updateMutation    = useUpdateGRN();
  const approveAllMutation = useApproveAllGRN();

  const { data: stores = [] }                                = useStores();
  const { data: allItems = [], isFetching: allItemsLoading } = useAllItems();
  const { data: grnData, isLoading: grnLoading, refetch: refetchGRN } = useGRNById(grnTid);
  const { data: uomList = [] }                               = useUOMList();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { GRNDATE: "", GRNNO: "", CHALLANNO: "", PONO: "", details: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "details" });
  const { formState: { isDirty } }  = form;

  // ── Populate form when GRN data loads ────────────────────────────────────
  useEffect(() => {
    if (!open || !grnData?.master) return;
    const m = grnData.master;
    const detailValues =
      grnData.details?.length > 0
        ? grnData.details.map(mapDetailToForm)
        : [emptyDetail()];

    const timer = setTimeout(() => {
      form.reset({
        GRNDATE:   m.GRNDATE   || "",
        GRNNO:     m.GRNNO     || "",
        CHALLANNO: m.CHALLANNO || "",
        PONO:      m.PONO != null ? String(m.PONO) : "",
        details:   detailValues,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [open, grnData]);

  const isFormLoading = open && (grnLoading || !grnData?.master);

  // pending count — drives the "Approve all" button visibility
  const pendingCount = (grnData?.details || []).filter((d) => d.STATUS === 1).length;

  // ── Approve all ──────────────────────────────────────────────────────────
  const handleApproveAll = async () => {
    if (!grnTid) return;
    const confirmed = await showConfirmation?.({
      title: "Approve all pending items?",
      description: `This will approve all ${pendingCount} pending item(s) in GRN #${grnTid}. Stock will be updated immediately. This cannot be undone.`,
      confirmText: "Approve all",
      cancelText: "Cancel",
      variant: "default",
    });
    if (!confirmed) return;
    try {
      await approveAllMutation.mutateAsync(grnTid);
      toast.success("All pending items approved — stock updated.");
      refetchGRN();
    } catch (err) {
      toast.error(err?.message || "Failed to approve.");
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    try {
      const payload = {
        master: {
          GRNDATE:   data.GRNDATE,
          GRNNO:     data.GRNNO     || null,
          CHALLANNO: data.CHALLANNO || null,
          PONO:      data.PONO      || null,
          USERID:    grnData?.master?.USERID || 1,
        },
        // Only send PENDING rows for update — approved rows are skipped by backend too
        details: data.details
          .filter((d) => d._status !== 2)
          .map((d) => ({
            TID:                d.TID,
            GRNLINE:            d.GRNLINE,
            ITEMID:             d.ITEMID,
            REVQTY:             d.REVQTY,
            STOREID:            d.STOREID            || null,
            UOM:                d.UOM                || null,
            COST:               d.COST               || 0,
            UNIT_PRICE:         d.UNIT_PRICE         || 0,
            SELLING_UNIT_PRICE: d.SELLING_UNIT_PRICE || 0,
            REVTYPE:            d.REVTYPE       || null,
            STORERECVTYPE:      d.STORERECVTYPE || null,
            ITEMTYPE:           d.ITEMTYPE      || null,
            CHALLAN_NO:         d.CHALLAN_NO    || data.CHALLANNO || null,
            PONO:               d.PONO          || data.PONO      || null,
            GRNDATE:            data.GRNDATE,
          })),
      };
      await updateMutation.mutateAsync({ tid: grnTid, data: payload });
      toast.success("GRN updated successfully!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update GRN.");
    }
  };

  const handleCancel = async () => {
    if (isDirty && showConfirmation) {
      const ok = await showConfirmation({
        title: "Discard changes?",
        description: "You have unsaved changes. Are you sure you want to close?",
        confirmText: "Discard", cancelText: "Keep Editing", variant: "destructive",
      });
      if (!ok) return;
    }
    onOpenChange(false);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) handleCancel(); }}>
      <SheetContent className="!w-screen !h-screen !max-w-none flex flex-col gap-0 p-0 rounded-none z-105">

        {/* ── Header ── */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0 bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold">GRN Form</SheetTitle>
                <SheetDescription className="text-xs mt-0.5">
                  Edit GRN #{grnTid}
                  {grnData?.master?.GRNNO && (
                    <span className="ml-1.5 text-foreground/70">· {grnData.master.GRNNO}</span>
                  )}
                </SheetDescription>
              </div>
            </div>

            {/* Approve all pending button */}
            {pendingCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                onClick={handleApproveAll}
                disabled={approveAllMutation.isPending}
              >
                {approveAllMutation.isPending
                  ? <Spinner className="h-3.5 w-3.5" />
                  : <CheckCheck className="h-3.5 w-3.5" />
                }
                Approve all pending ({pendingCount})
              </Button>
            )}
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            {isFormLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="h-8 w-8" />
                  <span className="text-xs text-muted-foreground">Loading GRN data…</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* ── Header fields ── */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="inline-block w-1 h-3.5 bg-primary rounded-full" />Header
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="GRNDATE" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          GRN Date <span className="text-destructive normal-case">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker className="w-full" placeholder="Select date" disabled={isSubmitting}
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="GRNNO" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">GRN No.</FormLabel>
                        <FormControl><Input placeholder="GRN-XXXX" disabled={isSubmitting} {...field} value={field.value || ""} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="CHALLANNO" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Challan No.</FormLabel>
                        <FormControl><Input placeholder="CH-XXXX" disabled={isSubmitting} {...field} value={field.value || ""} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="PONO" render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">PO No.</FormLabel>
                        <FormControl><Input placeholder="PO-XXXX" disabled={isSubmitting} {...field} value={field.value || ""} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <Separator />

                {/* ── Line items ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <span className="inline-block w-1 h-3.5 bg-primary rounded-full" />
                        Line Items
                      </p>
                      <Badge variant="secondary" className="text-xs h-5 px-1.5 rounded-sm">{fields.length}</Badge>
                      {pendingCount > 0 && (
                        <Badge variant="outline" className="text-xs h-5 px-1.5 rounded-sm text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800">
                          {pendingCount} pending
                        </Badge>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => append(emptyDetail())} className="h-7 text-xs gap-1.5">
                      <Plus className="h-3.5 w-3.5" />Add Item
                    </Button>
                  </div>

                  <div className="rounded-md border border-border overflow-x-auto">
                    <table className="border-collapse text-sm" style={{ minWidth: "1600px", width: "100%" }}>
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center w-8">#</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"190px"}}>Item Name</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{minWidth:"150px"}}>Store</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{width:"80px"}}>Rev Qty</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{width:"80px"}}>UOM</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{width:"88px"}}>Cost</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right" style={{width:"92px"}}>Unit Price</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right" style={{width:"96px"}}>Selling Price</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"120px"}}>Rev Type</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"120px"}}>Recv Type</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"120px"}}>Item Type</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"110px"}}>PO No</th>
                          <th className="px-1 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left" style={{minWidth:"110px"}}>Challan No</th>
                          {/* ── New approve columns ── */}
                          <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{width:"90px"}}>Status</th>
                          <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center" style={{width:"60px"}}>Action</th>
                          <th className="px-2 py-2.5 w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, index) => {
                          const rawStatus = form.getValues(`details.${index}._status`);
                          const isApproved = rawStatus === 2;
                          const detailTid  = form.getValues(`details.${index}.TID`);
                          return (
                            <ItemRow
                              key={field.id}
                              index={index}
                              control={form.control}
                              stores={stores}
                              allItems={allItems}
                              allItemsLoading={allItemsLoading}
                              uomList={uomList}
                              isApproved={isApproved}
                              detailTid={detailTid}
                              masterTid={grnTid}
                              onApproved={refetchGRN}
                              onRemove={() => !isApproved && fields.length > 1 && remove(index)}
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isFormLoading}>
                {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Updating…</> : "Update GRN"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}