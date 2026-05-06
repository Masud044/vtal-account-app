import { useState, useEffect } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Select from "react-select";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";

import { SectionContainer } from "@/components/SectionContainer";
import { ReceiveService } from "@/api/AccontingApi";
import { Button } from "@/components/ui/button";
import BillUploadPanelEdit from "@/components/shared/edit-bill-upload-panel";


const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ReceiveEdit = () => {
  const { voucherId } = useParams();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const today         = new Date().toISOString().split("T")[0];

  // ── Bill state ───────────────────────────────────────────────────────────────
  const [existingDocs, setExistingDocs] = useState([]); // from GLDOC table
  const [newBillFiles, setNewBillFiles] = useState([]); // local File[] to upload

  const [rows, setRows]           = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState({
    entryDate: today, invoiceNo: "", supporting: "", description: "",
    customer: "", glDate: today, ReceiveCode: "", paymentCode: "",
    creditId: null, accountId: "", particular: "", amount: "", totalAmount: 0,
  });

  // ── Fetch existing GLDOC docs for this voucher ───────────────────────────────
  useQuery({
    queryKey: ["gldocs", voucherId],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/gldoc`, {
        params: { glmaster_id: voucherId },
      });
      const docs = res.data.data || [];
      setExistingDocs(docs);
      return docs;
    },
    enabled: !!voucherId,
  });

  // ── Upload new bills ─────────────────────────────────────────────────────────
  const uploadNewBills = async () => {
    if (!newBillFiles.length) return;
    const uploads = newBillFiles.map((file) => {
      const fd = new FormData();
      fd.append("doc_file",   file);
      fd.append("GLMASTERID", voucherId);
      fd.append("CREATION_BY", "");
      return axios.post(`${url}/api/gldoc`, fd);
    });
    await Promise.allSettled(uploads);
    setNewBillFiles([]);
    // refresh existing docs
    const res = await axios.get(`${url}/api/gldoc`, { params: { glmaster_id: voucherId } });
    setExistingDocs(res.data.data || []);
  };

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/customer-type`);
      return res.data.data || [];
    },
  });

  const { data: ReceiveCodes = [] } = useQuery({
    queryKey: ["ReceiveCodes"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-code`);
      return res.data.success ? res.data.data || [] : [];
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

  const { data: voucherData } = useQuery({
    queryKey: ["voucher", voucherId],
    queryFn: async () => {
      const res = await ReceiveService.search(voucherId);
      return res.data;
    },
    enabled: !!voucherId && accounts.length > 0,
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toInputDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ── Populate form ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!voucherId || voucherData?.status !== "success") return;
    const master      = voucherData.master  || {};
    const details     = voucherData.details || {};
    const paymentCode = master.CASHACCOUNT  || "";

    const mappedRows = details
      .filter((d) => d.credit && Number(d.credit) > 0 && d.code !== paymentCode)
      .map((d) => {
        const account = accounts.find((a) => a.value === d.code);
        return {
          id: d.id, accountCode: d.code || "",
          particulars: account ? account.label : (d.codedescription || ""),
          amount: parseFloat(d.credit), creditId: d.id, isExisting: true,
        };
      });

    const total = mappedRows.reduce((s, r) => s + Number(r.amount || 0), 0);

    setForm({
      entryDate:   toInputDate(master.TRANS_DATE),
      glDate:      toInputDate(master.GL_ENTRY_DATE),
      invoiceNo:   master.VOUCHERNO    || "",
      supporting:  master.SUPPORTING   || "",
      description: master.DESCRIPTION  || "",
      customer:    master.CUSTOMER_ID  ? String(master.CUSTOMER_ID) : "",
      ReceiveCode: paymentCode,
      paymentCode: paymentCode,
      accountId: "", particular: "", amount: "", totalAmount: total,
    });
    setRows(mappedRows);
  }, [voucherId, voucherData, accounts]);

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await ReceiveService.update(payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.status === "success") {
        // Upload any new bill files after update
        await uploadNewBills();

        toast.success("Voucher updated successfully!");
        await queryClient.invalidateQueries(["unpostedVouchers"]);
        await queryClient.invalidateQueries(["voucher", voucherId]);
        setShowModal(false);
        navigate("/dashboard/receive-voucher");
      } else {
        toast.error("Error processing voucher");
        setShowModal(false);
      }
    },
    onError: () => {
      toast.error("Error submitting voucher. Please try again.");
      setShowModal(false);
    },
  });

  // ── Row handlers ─────────────────────────────────────────────────────────────
  const addRow = () => {
    if (!form.accountId || !form.amount) { toast.error("Please select account and enter amount"); return; }
    const selectedAccount = accounts.find((a) => a.value === form.accountId);
    const newRow = {
      id: Date.now(), accountCode: form.accountId,
      particulars: selectedAccount ? selectedAccount.label : form.particular,
      amount: parseFloat(form.amount), creditId: null, isExisting: false,
    };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    setForm({ ...form, accountId: "", particular: "", amount: "",
      totalAmount: updatedRows.reduce((s, r) => s + Number(r.amount), 0) });
  };

  const updateRow = (id, field, value) => {
    const updatedRows = rows.map((r) =>
      r.id === id ? { ...r, [field]: field === "amount" ? Number(value) : value } : r
    );
    setRows(updatedRows);
    setForm((p) => ({ ...p, totalAmount: updatedRows.reduce((s, r) => s + Number(r.amount || 0), 0) }));
  };

  const removeRow = (id) => {
    const updatedRows = rows.filter((r) => r.id !== id);
    setRows(updatedRows);
    setForm({ ...form, totalAmount: updatedRows.reduce((s, r) => s + Number(r.amount || 0), 0) });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.entryDate || !form.glDate || !form.description ||
        !form.paymentCode || !form.customer || rows.length === 0) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }
    if (rows.some((r) => !r.accountCode || !r.amount)) {
      toast.error("Each row must have Account Code and Amount filled.");
      return;
    }

    const firstDebitEntry = voucherData?.details?.find(
      (d) => d.code === form.paymentCode && d.debit && Number(d.debit) > 0
    );
    const creditId       = firstDebitEntry?.id || null;
    const calculatedTotal = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

    mutation.mutate({
      action:       "update",
      masterID:     Number(voucherId),
      trans_date:   form.entryDate,
      gl_date:      form.glDate,
      receive_desc: form.description,
      pcode:        form.paymentCode,
      credit_id:    creditId,
      supplierid:   String(form.customer),
      totalAmount:  Number(calculatedTotal),
      supporting:   String(form.supporting),
      DEBIT_ID:     rows.map((r) => r.creditId ? Number(r.creditId) : null),
      amount2:      rows.map((r) => Number(r.amount)),
      acode:        rows.map((r) => r.accountCode),
      CODEDESCRIPTION: rows.map((r) => { const p = r.particulars.split(" - "); return p.length > 1 ? p[1] : r.particulars; }),
      DESCRIPTION:     rows.map((r) => { const p = r.particulars.split(" - "); return p.length > 1 ? p[1] : r.particulars; }),
    });
  };

  const isSubmitting = mutation.isPending;

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SectionContainer>
      <div className="p-6 space-y-6 bg-white rounded-lg mt-4 shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">Edit Receive Voucher</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4 bg-white rounded-lg">

          {/* ── Bill Panel ── */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <BillUploadPanelEdit
              existingDocs={existingDocs}
              onDeleteDoc={(docId) => setExistingDocs((prev) => prev.filter((d) => d.ID !== docId))}
              newFiles={newBillFiles}
              onNewFiles={setNewBillFiles}
              disabled={isSubmitting}
            />
          </div>

          {/* Customer */}
          <div>
            <div className="grid grid-cols-3 px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800">Customer</label>
              <select
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full border rounded py-1 h-8 bg-white"
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.CUSTOMER_ID} value={String(c.CUSTOMER_ID)}>{c.CUSTOMER_NAME}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates / Invoice / Supporting / GL / Payment / Total */}
          <div>
            {[
              { label: "Entry Date",         type: "date",   key: "entryDate",  onChange: (v) => setForm({ ...form, entryDate: v }) },
              { label: "Invoice No",         type: "text",   key: "invoiceNo",  readOnly: true },
              { label: "No. of Supporting",  type: "number", key: "supporting", onChange: (v) => setForm({ ...form, supporting: v }) },
              { label: "GL Date",            type: "date",   key: "glDate",     onChange: (v) => setForm({ ...form, glDate: v }) },
            ].map(({ label, type, key, readOnly, onChange }) => (
              <div key={key} className="grid grid-cols-3 px-3 items-center py-2">
                <label className="font-bold text-sm text-gray-800">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  readOnly={readOnly}
                  disabled={isSubmitting}
                  onChange={(e) => onChange?.(e.target.value)}
                  className={`col-span-2 w-full border rounded py-1 ${readOnly ? "bg-gray-100" : "bg-white"}`}
                />
              </div>
            ))}

            <div className="grid grid-cols-3 px-3 items-center">
              <label className="font-bold text-sm text-gray-800">Payment Code</label>
              <select
                value={form.paymentCode}
                onChange={(e) => setForm({ ...form, paymentCode: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full rounded py-1 border bg-white"
              >
                <option value="">Select Payment</option>
                {ReceiveCodes.map((code) => (
                  <option key={code.ACCOUNT_ID} value={code.ACCOUNT_ID}>{code.ACCOUNT_NAME}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800">Total Amount</label>
              <input type="number" value={form.totalAmount.toFixed(2)} readOnly
                className="col-span-2 w-full border rounded py-1 bg-white" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 mb-4">
          <label className="font-bold text-sm text-gray-800 block mb-2 py-2 px-4 rounded-lg">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSubmitting}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* Add row */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_1fr] gap-4 rounded-lg items-center">
          <div className="grid grid-cols-3 px-3 items-center py-1">
            <label className="font-bold text-sm text-gray-800">Account ID</label>
            <Select
              options={accounts}
              className="col-span-2 border w-full rounded shadow-2xl"
              value={accounts.find((a) => a.value === form.accountId) || null}
              onChange={(s) => setForm({ ...form, accountId: s?.value || "", particular: s?.name || "" })}
              placeholder="Enter account..."
              isClearable isSearchable isDisabled={isSubmitting}
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (b) => ({ ...b, zIndex: 9999 }),
                menu: (b) => ({ ...b, backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }),
              }}
            />
          </div>
          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800">Particular</label>
            <input type="text" value={form.particular}
              onChange={(e) => setForm({ ...form, particular: e.target.value })}
              className="col-span-2 border w-full rounded py-1 bg-white" />
          </div>
          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800">Amount</label>
            <input type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={isSubmitting}
              className="col-span-1 border w-full rounded py-1 bg-white" />
          </div>
          <div className="px-4 py-2">
            <button type="button" onClick={addRow} disabled={isSubmitting}
              className="font-bold text-sm text-gray-800 cursor-pointer border px-3 py-1 rounded-lg flex items-center">
              <span className="mr-1 font-extrabold">+</span>Add
            </button>
          </div>
        </div>

        {/* Rows table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Account Code", "Particulars", "Amount", ""].map((h) => (
                  <th key={h} className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border">
                  <td className="border px-2 md:px-4 py-2 text-center"><span className="text-sm">{row.accountCode}</span></td>
                  <td className="border px-2 md:px-4 py-2">
                    <input type="text" value={row.particulars}
                      onChange={(e) => updateRow(row.id, "particulars", e.target.value)}
                      className="w-full bg-transparent outline-none" />
                  </td>
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <input type="number" value={row.amount}
                      onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                      className="w-full bg-transparent outline-none text-center" />
                  </td>
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <Button type="button" variant="ghost" size="icon"
                      onClick={() => removeRow(row.id)} disabled={isSubmitting}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length > 0 && (
                <tr className="font-semibold">
                  <td colSpan="2" className="p-2 text-right text-gray-600">Total</td>
                  <td className="border p-2 text-center">{form.totalAmount.toFixed(2)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="button" onClick={() => setShowModal(true)} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Voucher Update</h2>
            <div className="space-y-2">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>Invoice No:</strong> {form.invoiceNo}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>Customer:</strong> {customers.find((s) => String(s.CUSTOMER_ID) === form.customer)?.CUSTOMER_NAME}</p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Payment Code:</strong> {form.paymentCode}</p>

              {/* bill summary */}
              {(existingDocs.length > 0 || newBillFiles.length > 0) && (
                <div>
                  <strong>Bills:</strong>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {existingDocs.map((d) => <li key={d.ID}>Doc #{d.ID} (saved)</li>)}
                    {newBillFiles.map((f, i) => <li key={i} className="text-blue-600">{f.name} (new)</li>)}
                  </ul>
                </div>
              )}

              <h3 className="font-semibold mt-2">Accounts:</h3>
              <ul className="list-disc pl-5">
                {rows.map((row, i) => (
                  <li key={i}>{row.accountCode} - {row.particulars} - {row.amount}
                    {" "}<span className="text-xs text-gray-400">({row.isExisting ? "existing" : "new"})</span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-2">Total: {form.totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex justify-end mt-4 space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-300">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-green-500 text-white">
                {isSubmitting ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default ReceiveEdit;