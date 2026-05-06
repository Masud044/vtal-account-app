import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";

import { SectionContainer } from "@/components/SectionContainer";
import { PaymentService } from "@/api/AccontingApi";
import PaymentTable from "../components/PaymentTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select as ShadSelect, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import BillUploadPanelEdit from "@/components/shared/edit-bill-upload-panel";
import BillUploadPanel from "@/components/shared/bill-upload-panel";

// Bill panels


const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Payment = () => {
  const { voucherId } = useParams();
  const isEdit = !!voucherId;

  useEffect(() => { window.scrollTo({ top: 80, behavior: "smooth" }); }, [voucherId]);

  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  // ── Bill state ──────────────────────────────────────────────────────────────
  const [newBillFiles,  setNewBillFiles]  = useState([]);   // create mode
  const [existingDocs,  setExistingDocs]  = useState([]);   // edit mode

  const [rows, setRows] = useState([
    { id: "dummy", accountCode: "", particulars: "", amount: 0, debitId: null, creditId: null, isNew: false },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    entryDate: today, invoiceNo: "", supporting: "", description: "",
    supplier: "", glDate: today, paymentCode: "", creditId: null,
    accountId: "", particular: "", amount: "", totalAmount: 0,
  });

  // ── Fetch existing docs in edit mode ────────────────────────────────────────
  useQuery({
    queryKey: ["gldocs", voucherId],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/gldoc`, { params: { glmaster_id: voucherId } });
      const docs = res.data.data || [];
      setExistingDocs(docs);
      return docs;
    },
    enabled: isEdit,
  });

  // ── Upload helper ────────────────────────────────────────────────────────────
  const uploadBills = async (glMasterId) => {
    if (!newBillFiles.length || !glMasterId) return;
    await Promise.allSettled(
      newBillFiles.map((file) => {
        const fd = new FormData();
        fd.append("doc_file", file);
        fd.append("GLMASTERID", glMasterId);
        return axios.post(`${url}/api/gldoc`, fd);
      })
    );
    setNewBillFiles([]);
  };

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await axios.get(`${url}/api/supplier-type`)).data.data || [],
  });
  const { data: PaymentCodes = [] } = useQuery({
    queryKey: ["paymentCodes"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-code`);
      return res.data.success ? res.data.data || [] : [];
    },
  });
  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/account-code`);
      return res.data.success === 1
        ? res.data.data.map((a) => ({ value: a.ACCOUNT_ID, label: `${a.ACCOUNT_ID} - ${a.ACCOUNT_NAME}`, name: a.ACCOUNT_NAME }))
        : [];
    },
  });
  const { data: voucherData } = useQuery({
    queryKey: ["voucher", voucherId],
    queryFn: async () => (await PaymentService.search(voucherId)).data,
    enabled: isEdit && accounts.length > 0,
  });

  const toInputDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return isNaN(d) ? "" : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  useEffect(() => {
    if (!isEdit || voucherData?.status !== "success" || !accounts.length) return;
    const master  = voucherData.master  || {};
    const details = voucherData.details || [];
    const creditEntry = details.find((d) => d.CREDIT && Number(d.CREDIT) > 0);
    const mappedRows  = details
      .filter((d) => d.DEBIT && Number(d.DEBIT) > 0)
      .map((d, i) => {
        const account = accounts.find((a) => a.value === d.CODE);
        return { id: d.ID || `${d.CODE}-${i}`, accountCode: d.CODE,
          particulars: d.CODEDESCRIPTION || (account ? account.label : ""),
          amount: parseFloat(d.DEBIT), debitId: d.ID, creditId: null, isNew: false };
      });
    const total = mappedRows.reduce((s, r) => s + Number(r.amount || 0), 0);
    setForm((p) => ({
      ...p,
      entryDate: toInputDate(master.TRANS_DATE),
      glDate: toInputDate(master.GL_ENTRY_DATE),
      invoiceNo: master.VOUCHERNO || "", supporting: master.SUPPORTING || "",
      description: master.DESCRIPTION || "",
      supplier: master.CUSTOMER_ID || "", paymentCode: master.CASHACCOUNT || "",
      creditId: creditEntry ? creditEntry.ID : null, totalAmount: total,
    }));
    setRows(mappedRows);
  }, [voucherData, accounts, voucherId]);

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async ({ isNew, payload }) => {
      const res = isNew ? await PaymentService.insert(payload) : await PaymentService.update(payload);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      if (data.status === "success") {
        toast.success(variables.isNew ? "Voucher created!" : "Voucher updated!");
        // upload bills
        if (variables.isNew) {
          await uploadBills(data.masterID || data.id);
          setForm({ entryDate: today, invoiceNo: "", supporting: "", description: "",
            supplier: "", glDate: today, paymentCode: "", creditId: null,
            accountId: "", particular: "", amount: "", totalAmount: 0 });
          setRows([]);
        } else {
          await uploadBills(voucherId);
          await queryClient.invalidateQueries(["voucher", voucherId]);
          await queryClient.invalidateQueries(["gldocs", voucherId]);
        }
        queryClient.invalidateQueries(["unpostedVouchers"]);
      } else {
        toast.error("Error processing voucher.");
      }
      setShowModal(false);
    },
    onError: () => { toast.error("Error submitting voucher."); setShowModal(false); },
  });

  // ── Row handlers ─────────────────────────────────────────────────────────────
  const addRow = () => {
    if (!form.accountId || !form.amount) { toast.error("Please select account and enter amount"); return; }
    const account = accounts.find((a) => a.value === form.accountId);
    const newRow = { id: `new-${Date.now()}`, accountCode: form.accountId,
      particulars: form.particular || (account?.label || ""), amount: parseFloat(form.amount),
      debitId: null, creditId: null, isNew: true };
    const updated = rows.length === 1 && rows[0].id === "dummy" ? [newRow] : [...rows, newRow];
    setRows(updated);
    setForm({ ...form, accountId: "", particular: "", amount: "",
      totalAmount: updated.reduce((s, r) => s + Number(r.amount), 0) });
  };
  const updateRow = (id, field, value) => {
    const updated = rows.map((r) => r.id !== id ? r : {
      ...r, [field]: field === "amount" ? Number(value)||0 : value,
      ...(field === "accountCode" ? { particulars: accounts.find((a) => a.value === value)?.label || r.particulars } : {}),
    });
    setRows(updated);
    setForm((p) => ({ ...p, totalAmount: updated.reduce((s, r) => s + Number(r.amount||0), 0) }));
  };
  const removeRow = (id) => {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    setForm({ ...form, totalAmount: updated.reduce((s, r) => s + Number(r.amount||0), 0) });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.entryDate || !form.glDate || !form.paymentCode || !form.supplier || rows.length === 0) {
      toast.error("Please fill all required fields and add at least one row."); return;
    }
    if (rows.some((r) => !r.accountCode || !r.particulars)) {
      toast.error("Each row must have Account Code and Particular filled."); return;
    }
    let payload;
    if (!isEdit) {
      payload = { trans_date: form.entryDate, gl_date: form.glDate, receive_desc: form.description,
        supporting: String(form.supporting), receive: form.paymentCode, supplierid: form.supplier,
        user_id: "1", totalAmount: String(form.totalAmount),
        accountID: rows.map((r) => r.accountCode), amount2: rows.map((r) => String(r.amount||0)) };
    } else {
      const existing = rows.filter((r) => !r.isNew);
      const newRows  = rows.filter((r) => r.isNew);
      payload = { masterID: Number(voucherId), trans_date: form.entryDate, gl_date: form.glDate,
        receive_desc: form.description, pcode: form.paymentCode, credit_id: form.creditId,
        supplierid: form.supplier, totalAmount: Number(form.totalAmount), supporting: String(form.supporting),
        ...(existing.length ? { DEBIT_ID: existing.map((r) => Number(r.debitId)),
          acode: existing.map((r) => r.accountCode), amount2: existing.map((r) => Number(r.amount)),
          CODEDESCRIPTION: existing.map((r) => r.particulars), DESCRIPTION: existing.map((r) => r.particulars) } : {}),
        ...(newRows.length ? { NEW_ACODE: newRows.map((r) => r.accountCode),
          NEW_AMOUNT: newRows.map((r) => Number(r.amount)),
          NEW_CODEDESCRIPTION: newRows.map((r) => r.particulars),
          NEW_DESCRIPTION: newRows.map((r) => r.particulars) } : {}),
      };
    }
    mutation.mutate({ isNew: !isEdit, payload });
  };

  const isSubmitting = mutation.isPending;

  return (
    <SectionContainer>
      <div className="space-y-4">
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">

            {/* Top grid */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4">

              {/* Bill panel */}
              <div className="border rounded-lg p-3 bg-gray-50">
                {isEdit ? (
                  <BillUploadPanelEdit
                    existingDocs={existingDocs}
                    onDeleteDoc={(id) => setExistingDocs((p) => p.filter((d) => d.ID !== id))}
                    newFiles={newBillFiles}
                    onNewFiles={setNewBillFiles}
                    disabled={isSubmitting}
                  />
                ) : (
                  <BillUploadPanel files={newBillFiles} onChange={setNewBillFiles} disabled={isSubmitting} />
                )}
              </div>

              {/* Supplier */}
              <div>
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className="font-bold text-gray-800 text-sm">Supplier</Label>
                  <div className="col-span-2">
                    <ShadSelect value={form.supplier} onValueChange={(v) => setForm({ ...form, supplier: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select Supplier" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.SUPPLIER_ID} value={s.SUPPLIER_ID}>{s.SUPPLIER_NAME}</SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-0.5">
                {[
                  { label: "Entry Date",        type: "date",   key: "entryDate" },
                  { label: "Invoice No",         type: "text",   key: "invoiceNo", disabled: !isEdit },
                  { label: "No. of Supporting",  type: "number", key: "supporting", className: "h-8 text-xs w-40" },
                  { label: "GL Date",            type: "date",   key: "glDate" },
                ].map(({ label, type, key, disabled, className }) => (
                  <div key={key} className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                    <Label className="font-bold text-gray-800 text-sm">{label}</Label>
                    <div className="col-span-2">
                      <Input type={type} value={form[key]} disabled={disabled || isSubmitting}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className={className || "h-8 text-xs"} />
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className="font-bold text-gray-800 text-sm">Payment Code</Label>
                  <div className="col-span-2">
                    <ShadSelect value={form.paymentCode} onValueChange={(v) => setForm({ ...form, paymentCode: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Select payment" /></SelectTrigger>
                      <SelectContent>
                        {PaymentCodes.map((c) => (
                          <SelectItem key={c.ACCOUNT_ID} value={c.ACCOUNT_ID}>{c.ACCOUNT_NAME}</SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                  </div>
                </div>

                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className="font-bold text-gray-800 text-sm">Total Amount</Label>
                  <div className="col-span-2">
                    <Input type="number" value={form.totalAmount.toFixed(2)} readOnly className="h-8 text-xs bg-muted/40" />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="font-bold text-gray-800 text-sm px-1">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none" rows={3} disabled={isSubmitting} />
            </div>

            {/* Add row inputs */}
            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_auto] gap-4 items-end">
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="font-bold text-gray-800 text-sm">Account ID</Label>
                <div className="col-span-2">
                  <Select options={accounts}
                    value={accounts.find((a) => a.value === form.accountId) || null}
                    onChange={(s) => setForm({ ...form, accountId: s?.value||"", particular: s?.name||"" })}
                    placeholder="Enter account..." isClearable isSearchable isDisabled={isSubmitting}
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: (b) => ({ ...b, zIndex: 9999 }) }} />
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="font-bold text-gray-800 text-sm">Particular</Label>
                <Input type="text" value={form.particular} readOnly className="col-span-2 h-8 text-xs bg-muted/40" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="font-bold text-gray-800 text-sm">Amount</Label>
                <Input type="number" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  disabled={isSubmitting} className="col-span-2 h-8 text-xs" />
              </div>
              <div className="px-4 pb-1">
                <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={isSubmitting}>
                  <span className="font-extrabold text-base mr-1">+</span>Add
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border">
              <Table className="text-xs md:text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {["Account Code", "Particulars", "Amount", ""].map((h) => (
                      <TableHead key={h} className="text-center font-bold text-gray-800 text-sm">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} className={row.isNew ? "bg-green-50" : ""}>
                      <TableCell className="px-2 md:px-4 py-2">
                        <Input value={row.accountCode} onChange={(e) => updateRow(row.id, "accountCode", e.target.value)} />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2">
                        <Input value={row.particulars} onChange={(e) => updateRow(row.id, "particulars", e.target.value)} />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2">
                        <Input type="number" step="0.01" value={row.amount}
                          onChange={(e) => updateRow(row.id, "amount", e.target.value)} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={isSubmitting}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length > 0 && (
                    <TableRow className="font-semibold bg-muted/30">
                      <TableCell colSpan={2} className="p-2 text-right text-muted-foreground text-xs">Total</TableCell>
                      <TableCell className="p-2 text-center border-l text-xs">{form.totalAmount.toFixed(2)}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowModal(true)} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : isEdit ? "Update" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <PaymentTable />

        {/* Confirm Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="w-11/12 md:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Confirm Voucher Submission</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>Supplier:</strong> {suppliers.find((s) => s.SUPPLIER_ID === form.supplier)?.SUPPLIER_NAME}</p>
              <p><strong>Payment Code:</strong> {form.paymentCode}</p>
              {(existingDocs.length > 0 || newBillFiles.length > 0) && (
                <div>
                  <strong>Bills:</strong>
                  <ul className="list-disc pl-5 text-gray-600">
                    {existingDocs.map((d) => <li key={d.ID}>Doc #{d.ID} (saved)</li>)}
                    {newBillFiles.map((f, i) => <li key={i} className="text-blue-600">{f.name} (new)</li>)}
                  </ul>
                </div>
              )}
              <p className="font-semibold">Accounts:</p>
              <ul className="list-disc pl-5">
                {rows.map((r, i) => <li key={i}>{r.accountCode} — {r.particulars} — {r.amount}</li>)}
              </ul>
              <p className="font-semibold">Total: {form.totalAmount.toFixed(2)}</p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionContainer>
  );
};

export default Payment;