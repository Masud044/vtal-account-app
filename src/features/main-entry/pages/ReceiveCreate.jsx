import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Select from "react-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { SectionContainer } from "@/components/SectionContainer";
import { ReceiveService } from "@/api/AccontingApi";
import { Button } from "@/components/ui/button";
import BillUploadPanel from "@/components/shared/bill-upload-panel";


const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ReceiveCreate = () => {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const today        = new Date().toISOString().split("T")[0];

  // ── Bill files (local state before submit) ───────────────────────────────────
  const [billFiles, setBillFiles] = useState([]);

  const [rows, setRows] = useState([
    { id: "dummy", accountCode: "", particulars: "", amount: 0 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    entryDate: today,
    invoiceNo: "",
    supporting: "",
    description: "",
    customer: "",
    glDate: today,
    ReceiveCode: "",
    accountId: "",
    particular: "",
    amount: "",
    totalAmount: 0,
  });

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

  // ── Upload bills helper (called after voucher is created) ────────────────────
  const uploadBills = async (glMasterId) => {
    if (!billFiles.length || !glMasterId) return;
    const uploads = billFiles.map((file) => {
      const fd = new FormData();
      fd.append("doc_file",    file);
      fd.append("GLMASTERID",  glMasterId);
      fd.append("CREATION_BY", ""); // set logged-in user id here
      return axios.post(`${url}/api/gldoc`, fd);
    });
    await Promise.allSettled(uploads); // don't block voucher success if upload fails
  };

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await ReceiveService.insert(payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.status === "success") {
        // Upload bills with the new GLMASTER ID returned from backend
       await uploadBills(data.masterID);

        toast.success("Voucher created successfully!");
        setBillFiles([]);
        setForm({
          entryDate: today, invoiceNo: "", supporting: "", description: "",
          customer: "", glDate: today, ReceiveCode: "", accountId: "",
          particular: "", amount: "", totalAmount: 0,
        });
        setRows([{ id: "dummy", accountCode: "", particulars: "", amount: 0 }]);
        queryClient.invalidateQueries(["unpostedVouchers"]);
        navigate("/dashboard/receive-voucher");
      } else {
        toast.error("Error processing voucher");
      }
    },
    onError:    () => toast.error("Error submitting voucher. Please try again."),
    onSettled:  () => setShowModal(false),
  });

  // ── Row handlers ─────────────────────────────────────────────────────────────
  const addRow = () => {
    if (!form.accountId || !form.amount) return;
    const newRow = {
      id: Date.now(),
      accountCode: form.accountId,
      particulars: form.particular,
      amount: parseFloat(form.amount),
    };
    const updatedRows = rows.length === 1 && rows[0].id === "dummy"
      ? [newRow]
      : [...rows, newRow];
    setRows(updatedRows);
    setForm({
      ...form,
      accountId: "", particular: "", amount: "",
      totalAmount: updatedRows.reduce((s, r) => s + Number(r.amount), 0),
    });
  };

  const removeRow = (id) => {
    const updatedRows = rows.filter((r) => r.id !== id);
    setRows(updatedRows);
    setForm({ ...form, totalAmount: updatedRows.reduce((s, r) => s + Number(r.amount || 0), 0) });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.entryDate || !form.glDate || !form.description ||
        !form.ReceiveCode || !form.customer ||
        rows.length === 0 || rows[0].id === "dummy") {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }
    if (rows.some((r) => !r.accountCode || !r.particulars)) {
      toast.error("Each row must have Account Code and Particular filled.");
      return;
    }

    mutation.mutate({
      trans_date:    form.entryDate,
      gl_date:       form.glDate,
      receive_desc:  form.description,
      supporting:    String(form.supporting),
      receive:       form.ReceiveCode,
      supplierid:    String(form.customer),
      totalAmount:   Number(form.totalAmount),
      accountID:     rows.map((r) => r.accountCode),
      amount2:       rows.map((r) => Number(r.amount || 0)),
    });
  };

  const isSubmitting = mutation.isPending;

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SectionContainer>
      <div className="p-2 space-y-6 bg-white rounded-lg mt-4 shadow-md">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">Create Receive Voucher</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
        </div>

        {/* ── Top section: Bill panel + form fields ── */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4 bg-white rounded-lg">

          {/* ── Bill Upload Panel ── */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <BillUploadPanel
              files={billFiles}
              onChange={setBillFiles}
              disabled={isSubmitting}
            />
          </div>

          {/* ── Customer ── */}
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
                  <option key={c.CUSTOMER_ID} value={String(c.CUSTOMER_ID)}>
                    {c.CUSTOMER_NAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Date / Invoice / Supporting / GL Date / Receive Code / Total ── */}
          <div>
            {[
              {
                label: "Entry Date", type: "date", key: "entryDate",
                props: { value: form.entryDate, onChange: (e) => setForm({ ...form, entryDate: e.target.value }) },
              },
              {
                label: "Invoice No", type: "text", key: "invoiceNo",
                props: { value: form.invoiceNo, disabled: true },
              },
              {
                label: "No. of Supporting", type: "number", key: "supporting",
                props: { value: form.supporting, onChange: (e) => setForm({ ...form, supporting: e.target.value }), className: "border-collapse w-40 border rounded py-1 bg-white" },
              },
              {
                label: "GL Date", type: "date", key: "glDate",
                props: { value: form.glDate, onChange: (e) => setForm({ ...form, glDate: e.target.value }) },
              },
            ].map(({ label, type, key, props }) => (
              <div key={key} className="grid grid-cols-3 px-3 items-center py-2">
                <label className="font-bold text-sm text-gray-800">{label}</label>
                <input
                  type={type}
                  {...props}
                  disabled={isSubmitting || props.disabled}
                  className={props.className || "col-span-2 w-full border rounded py-1 bg-white"}
                />
              </div>
            ))}

            <div className="grid grid-cols-3 px-3 items-center">
              <label className="font-bold text-sm text-gray-800">Receive Code</label>
              <select
                value={form.ReceiveCode}
                onChange={(e) => setForm({ ...form, ReceiveCode: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full rounded py-1 border bg-white"
              >
                <option value="">Select Receive</option>
                {ReceiveCodes.map((code) => (
                  <option key={code.ACCOUNT_ID} value={code.ACCOUNT_ID}>
                    {code.ACCOUNT_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800">Total Amount</label>
              <input
                type="number"
                value={form.totalAmount.toFixed(2)}
                readOnly
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="mt-4 mb-4">
          <label className="font-bold text-sm text-gray-800 block mb-2 py-2 px-4 rounded-lg">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSubmitting}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* ── Add row inputs ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_1fr] gap-4 rounded-lg items-center">
          <div className="grid grid-cols-3 px-3 items-center py-1">
            <label className="font-bold text-sm text-gray-800">Account ID</label>
            <Select
              options={accounts}
              className="col-span-2 border w-full rounded shadow-2xl"
              value={accounts.find((a) => a.value === form.accountId) || null}
              onChange={(s) => setForm({ ...form, accountId: s?.value || "", particular: s?.name || "" })}
              placeholder="Enter account..."
              isClearable
              isSearchable
              isDisabled={isSubmitting}
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (b) => ({ ...b, zIndex: 9999 }),
                menu: (b) => ({ ...b, backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }),
              }}
            />
          </div>

          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800">Particular</label>
            <input type="text" value={form.particular} readOnly className="col-span-2 border w-full rounded py-1 bg-white" />
          </div>

          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800">Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={isSubmitting}
              className="col-span-1 border w-full rounded py-1 bg-white"
            />
          </div>

          <div className="px-4 py-2">
            <button
              type="button"
              onClick={addRow}
              disabled={isSubmitting}
              className="cursor-pointer border px-3 py-1 rounded-lg flex items-center font-bold text-sm text-gray-800"
            >
              <span className="mr-1 font-extrabold">+</span>Add
            </button>
          </div>
        </div>

        {/* ── Rows table ── */}
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
                  <td className="border px-2 md:px-4 py-2">{row.accountCode}</td>
                  <td className="border px-2 md:px-4 py-2">{row.particulars}</td>
                  <td className="border px-2 md:px-4 py-2 text-center">{Number(row.amount).toFixed(2)}</td>
                  <td className="border px-2 md:px-4 py-2 text-center">
                    {row.id !== "dummy" && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} disabled={isSubmitting}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length > 0 && rows[0].id !== "dummy" && (
                <tr className="font-semibold">
                  <td colSpan="2" className="p-2 text-right font-bold text-sm text-gray-800">Total</td>
                  <td className="border p-2 text-center">{form.totalAmount.toFixed(2)}</td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => setShowModal(true)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create"}
          </Button>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Voucher Submission</h2>
            <div className="space-y-2">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>Customer:</strong> {customers.find((s) => s.CUSTOMER_ID === form.customer)?.CUSTOMER_NAME}</p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Receive Code:</strong> {form.ReceiveCode}</p>

              {billFiles.length > 0 && (
                <div>
                  <strong>Bills ({billFiles.length}):</strong>
                  <ul className="list-disc pl-5 text-sm text-gray-600">
                    {billFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              )}

              <h3 className="font-semibold mt-2">Accounts:</h3>
              <ul className="list-disc pl-5">
                {rows.filter((r) => r.id !== "dummy").map((row, i) => (
                  <li key={i}>{row.accountCode} - {row.particulars} - {row.amount}</li>
                ))}
              </ul>
              <p className="font-semibold mt-2">Total: {form.totalAmount.toFixed(2)}</p>
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-300">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-green-500 text-white"
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default ReceiveCreate;