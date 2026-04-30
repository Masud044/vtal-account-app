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
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const Payment = () => {
  const { voucherId } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 80, behavior: "smooth" });
  }, [voucherId]);

  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [rows, setRows] = useState([
    {
      id: "dummy",
      accountCode: "",
      particulars: "",
      amount: 0,
      debitId: null,
      creditId: null,
      isNew: false,
    },
  ]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    entryDate: today,
    invoiceNo: "",
    supporting: "",
    description: "",
    supplier: "",
    glDate: today,
    paymentCode: "",
    creditId: null,
    accountId: "",
    particular: "",
    amount: "",
    totalAmount: 0,
  });

  // ---------- FETCH HELPERS ----------
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/supplier-type`);
      return res.data.data || [];
    },
  });

  const { data: PaymentCodes = [] } = useQuery({
    queryKey: ["paymentCodes"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-code`);
      return res.data.success === true ? res.data.data || [] : [];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-account-code`);
      if (res.data.success === true) {
        return res.data.data.map((acc) => ({
          value: acc.ACCOUNT_ID,
          label: `${acc.ACCOUNT_ID} - ${acc.ACCOUNT_NAME}`,
          name: acc.ACCOUNT_NAME,
        }));
      }
      return [];
    },
  });

  // ---------- FETCH VOUCHER IF EDIT ----------
  const { data: voucherData } = useQuery({
    queryKey: ["voucher", voucherId],
    queryFn: async () => {
      const res = await PaymentService.search(voucherId);
      return res.data;
    },
    enabled: !!voucherId && accounts.length > 0,
  });

  const toInputDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (voucherId && voucherData?.status === "success" && accounts.length > 0) {
      const master = voucherData.master || {};
      const details = voucherData.details || [];

      const creditEntry = details.find((d) => d.CREDIT && Number(d.CREDIT) > 0);

      const mappedRows = details
        .filter((d) => d.DEBIT && Number(d.DEBIT) > 0)
        .map((d, i) => {
          const account = accounts.find((acc) => acc.value === d.CODE);
          return {
            id: d.ID || `${d.CODE}-${i}`,
            accountCode: d.CODE,
            particulars: d.CODEDESCRIPTION || (account ? account.label : ""),
            amount: parseFloat(d.DEBIT),
            debitId: d.ID,
            creditId: null,
            isNew: false,
          };
        });

      const total = mappedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

      setForm((prev) => ({
        ...prev,
        entryDate: toInputDate(master.TRANS_DATE),
        glDate: toInputDate(master.GL_ENTRY_DATE),
        invoiceNo: master.VOUCHERNO || "",
        supporting: master.SUPPORTING || "",
        description: master.DESCRIPTION || "",
        supplier: master.CUSTOMER_ID || "",
        paymentCode: master.CASHACCOUNT || "",
        creditId: creditEntry ? creditEntry.ID : null,
        accountId: "",
        particular: "",
        amount: "",
        totalAmount: total,
      }));

      setRows(mappedRows);
    }
  }, [voucherData, accounts, voucherId]);

  // ---------- MUTATION ----------
  const mutation = useMutation({
    mutationFn: async ({ isNew, payload }) => {
      const res = isNew
        ? await PaymentService.insert(payload)
        : await PaymentService.update(payload);
      return res.data;
    },
    onSuccess: async (data, variables) => {
      if (data.status === "success") {
        toast.success(
          variables.isNew ? "Voucher created successfully!" : "Voucher updated successfully!"
        );
        if (variables.isNew) {
          setForm({
            entryDate: today,
            invoiceNo: "",
            supporting: "",
            description: "",
            supplier: "",
            glDate: today,
            paymentCode: "",
            creditId: null,
            accountId: "",
            particular: "",
            amount: "",
            totalAmount: 0,
          });
          setRows([]);
        } else {
          await queryClient.invalidateQueries(["voucher", voucherId]);
          setTimeout(() => queryClient.refetchQueries(["voucher", voucherId]), 500);
        }
        queryClient.invalidateQueries(["unpostedVouchers"]);
      } else {
        toast.error("Error processing voucher.");
      }
    },
    onError: () => {
      toast.error("Error submitting voucher. Please try again.");
    },
    onSettled: () => {
      setShowModal(false);
    },
  });

  // ---------- HANDLERS ----------
  const addRow = () => {
    if (!form.accountId || !form.amount) {
      toast.error("Please select account and enter amount");
      return;
    }
    const account = accounts.find((acc) => acc.value === form.accountId);
    const newRow = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      accountCode: form.accountId,
      particulars: form.particular || (account ? account.label : ""),
      amount: parseFloat(form.amount),
      debitId: null,
      creditId: null,
      isNew: true,
    };
    const updatedRows =
      rows.length === 1 && rows[0].id === "dummy" ? [newRow] : [...rows, newRow];
    const total = updatedRows.reduce((sum, r) => sum + Number(r.amount), 0);
    setRows(updatedRows);
    setForm({ ...form, accountId: "", particular: "", amount: "", totalAmount: total });
  };

  const updateRow = (id, field, value) => {
    const updatedRows = rows.map((row) => {
      if (row.id !== id) return row;
      const updatedRow = { ...row };
      if (field === "amount") {
        updatedRow.amount = Number(value) || 0;
      } else if (field === "accountCode") {
        updatedRow.accountCode = value;
        const account = accounts.find((acc) => acc.value === value);
        if (account) updatedRow.particulars = account.label;
      } else if (field === "particulars") {
        updatedRow.particulars = value;
      }
      return updatedRow;
    });
    const total = updatedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    setRows(updatedRows);
    setForm((prev) => ({ ...prev, totalAmount: total }));
  };

  const removeRow = (id) => {
    const updatedRows = rows.filter((r) => r.id !== id);
    const total = updatedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    setRows(updatedRows);
    setForm({ ...form, totalAmount: total });
  };

  const handleSubmit = () => {
    setMessage("");
    const isNew = !voucherId;

    if (
      isNew &&
      (!form.entryDate || !form.glDate || !form.description ||
        !form.paymentCode || !form.supplier || rows.length === 0)
    ) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }

    if (rows.some((row) => !row.accountCode || !row.particulars)) {
      toast.error("Each row must have Account Code and Particular filled.");
      return;
    }

    let payload = {};
    if (isNew) {
      payload = {
        trans_date: form.entryDate,
        gl_date: form.glDate,
        receive_desc: form.description,
        supporting: String(form.supporting),
        receive: form.paymentCode,
        supplierid: form.supplier,
        user_id: "1",
        totalAmount: String(form.totalAmount),
        accountID: rows.map((r) => r.accountCode),
        amount2: rows.map((r) => String(r.amount || 0)),
      };
    } else {
      const existingRows = rows.filter((r) => !r.isNew);
      const newRows = rows.filter((r) => r.isNew);
      payload = {
        masterID: Number(voucherId),
        trans_date: form.entryDate,
        gl_date: form.glDate,
        receive_desc: form.description,
        pcode: form.paymentCode,
        credit_id: form.creditId,
        supplierid: form.supplier,
        totalAmount: Number(form.totalAmount),
        supporting: String(form.supporting),
      };
      if (existingRows.length > 0) {
        payload.DEBIT_ID = existingRows.map((r) => Number(r.debitId));
        payload.acode = existingRows.map((r) => r.accountCode);
        payload.amount2 = existingRows.map((r) => Number(r.amount));
        payload.CODEDESCRIPTION = existingRows.map((r) => r.particulars);
        payload.DESCRIPTION = existingRows.map((r) => r.particulars);
      }
      if (newRows.length > 0) {
        payload.NEW_ACODE = newRows.map((r) => r.accountCode);
        payload.NEW_AMOUNT = newRows.map((r) => Number(r.amount));
        payload.NEW_CODEDESCRIPTION = newRows.map((r) => r.particulars);
        payload.NEW_DESCRIPTION = newRows.map((r) => r.particulars);
      }
    }

    mutation.mutate({ isNew, payload });
  };

  return (
    <SectionContainer>
      <div className="space-y-4">
        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            {message && (
              <p className="text-center text-destructive font-medium">{message}</p>
            )}

            {/* ── Top 3-column grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_1fr] gap-4">

              {/* Bill placeholder */}
              <div className="bg-muted border rounded-lg flex items-center justify-center">
                <h1 className="text-center py-10 text-sm text-muted-foreground">
                  this is bill
                </h1>
              </div>

              {/* Supplier */}
              <div >
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">Supplier</Label>
                  <div className="col-span-2">
                    <ShadSelect
                      value={form.supplier}
                      onValueChange={(val) => setForm({ ...form, supplier: val })}
                    >
                      <SelectTrigger className="h-8 ">
                        <SelectValue placeholder="Select Supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((sup) => (
                          <SelectItem key={sup.SUPPLIER_ID} value={sup.SUPPLIER_ID} className="text-xs">
                            {sup.SUPPLIER_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                  </div>
                </div>
              </div>

              {/* Payment fields */}
              <div className=" space-y-0.5">

                {/* Entry Date */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">Entry Date</Label>
                  <div className="col-span-2">
                    <Input
                      type="date"
                      value={form.entryDate}
                      onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Invoice No */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">Invoice No</Label>
                  <div className="col-span-2">
                    <Input
                      type="text"
                      value={form.invoiceNo}
                      onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                      disabled={!voucherId}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* No. of Supporting */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">No. of Supporting</Label>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={form.supporting}
                      onChange={(e) => setForm({ ...form, supporting: e.target.value })}
                      className="h-8 text-xs w-40"
                    />
                  </div>
                </div>

                {/* GL Date */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">GL Date</Label>
                  <div className="col-span-2">
                    <Input
                      type="date"
                      value={form.glDate}
                      onChange={(e) => setForm({ ...form, glDate: e.target.value })}
                   
                    />
                  </div>
                </div>

                {/* Payment Code */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground ">Payment Code</Label>
                  <div className="col-span-2">
                    <ShadSelect
                      value={form.paymentCode}
                      onValueChange={(val) => setForm({ ...form, paymentCode: val })}
                    >
                      <SelectTrigger className="h-8 ">
                        <SelectValue placeholder="Select payment" />
                      </SelectTrigger>
                      <SelectContent>
                        {PaymentCodes.map((code) => (
                          <SelectItem key={code.ACCOUNT_ID} value={code.ACCOUNT_ID} >
                            {code.ACCOUNT_NAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </ShadSelect>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="grid grid-cols-3 items-center gap-2 py-1.5 px-3">
                  <Label className=" font-medium text-muted-foreground">Total Amount</Label>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={form.totalAmount.toFixed(2)}
                      readOnly
                      className="h-8 text-xs bg-muted/40"
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Description */}
            <div className="opacity-60 space-y-1">
              <Label className=" font-medium text-muted-foreground px-1">
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Add Row Section */}
            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_auto] opacity-60 gap-4 items-end">

              {/* Account ID */}
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="text-sm font-medium ">Account ID</Label>
                <div className="col-span-2">
                  <Select
                    options={accounts}
                    value={accounts.find((acc) => acc.value === form.accountId) || null}
                    onChange={(selected) =>
                      setForm({
                        ...form,
                        accountId: selected ? selected.value : "",
                        particular: selected ? selected.name : "",
                      })
                    }
                    placeholder="Enter account..."
                    isClearable
                    isSearchable
                    menuPortalTarget={document.body}
                    // styles={{
                    //   menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    //   control: (base) => ({
                    //     ...base,
                    //     minHeight: "36px",
                    //     height: "36px",
                    //     fontSize: "12px",
                    //     borderColor: "hsl(var(--border))",
                    //     borderRadius: "calc(var(--radius) - 2px)",
                    //     boxShadow: "none",
                    //     "&:hover": { borderColor: "hsl(var(--ring))" },
                    //   }),
                    //   valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                    //   input: (base) => ({ ...base, margin: 0, padding: 0 }),
                    //   indicatorsContainer: (base) => ({ ...base, height: "36px" }),
                    //   menu: (base) => ({
                    //     ...base,
                    //     backgroundColor: "white",
                    //     border: "1px solid hsl(var(--border))",
                    //     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    //     fontSize: "12px",
                    //   }),
                    // }}
                  />
                </div>
              </div>

              {/* Particular */}
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="text-sm font-medium text-muted-foreground">Particular</Label>
                <Input
                  type="text"
                  value={form.particular}
                  readOnly
                  className="col-span-2 h-8 text-xs bg-muted/40"
                />
              </div>

              {/* Amount */}
              <div className="grid grid-cols-3 items-center gap-2 px-3">
                <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="col-span-2 h-8 text-xs"
                />
              </div>

              {/* Add Button */}
              <div className="px-4 pb-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <span className="font-extrabold text-base leading-none">+</span>
                  Add
                </Button>
              </div>
            </div>

            {/* Rows Table */}
            <div className="overflow-x-auto rounded-lg border">
              <Table className="text-xs md:text-sm opacity-80">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-center font-medium">Account Code</TableHead>
                    <TableHead className="text-center font-medium">Particulars</TableHead>
                    <TableHead className="text-center font-medium">Amount</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className={row.isNew ? "bg-green-50 hover:bg-green-100" : ""}
                    >
                      <TableCell className="px-2 md:px-4 py-2">
                        <Input
                          type="number"
                          value={row.accountCode}
                          onChange={(e) => updateRow(row.id, "accountCode", e.target.value)}
                          // className="h-7 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs p-0"
                          placeholder="Enter accountCode..."
                        />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2">
                        <Input
                          type="text"
                          value={row.particulars}
                          onChange={(e) => updateRow(row.id, "particulars", e.target.value)}
                          // className="h-7 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs p-0"
                          placeholder="Enter particulars..."
                        />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 text-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.amount}
                          onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                          // className="h-7 bg-transparent border-none shadow-none focus-visible:ring-0 text-xs text-center p-0"
                          placeholder="0.00"
                        />
                      </TableCell>
                      <TableCell className="px-2 md:px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          // className="h-7 w-7 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4 " />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length > 0 && (
                    <TableRow className="font-semibold bg-muted/30">
                      <TableCell colSpan={2} className="p-2 text-right text-muted-foreground text-xs">
                        Total
                      </TableCell>
                      <TableCell className="p-2 text-center text-xs border-l">
                        {form.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowModal(true)}>
                {mutation.isPending ? "Submitting..." : voucherId ? "Update" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <PaymentTable />

        {/* Confirm Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="w-11/12 md:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Confirm Voucher Submission</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>Invoice No:</strong> {form.invoiceNo}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p>
                <strong>Supplier:</strong>{" "}
                {suppliers.find((s) => s.SUPPLIER_ID === form.supplier)?.SUPPLIER_NAME}
              </p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Payment Code:</strong> {form.paymentCode}</p>

              <p className="font-semibold pt-1">Accounts:</p>
              <ul className="list-disc pl-5 space-y-1">
                {rows.map((row, index) => (
                  <li key={index} className={row.isNew ? "text-black" : ""}>
                    {row.accountCode} — {row.particulars} — {row.amount}
                    {row.isNew}
                  </li>
                ))}
              </ul>

              <p className="font-semibold pt-1">
                Total: {form.totalAmount.toFixed(2)}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={mutation.isPending}>
                {mutation.isPending ? "Submitting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SectionContainer>
  );
};

export default Payment;