import { useState } from "react";
import { ArrowLeft, Trash2, Users, X } from "lucide-react";
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

// ── Customer default form ────────────────────────────────────────────────────
const customerDefault = {
  customerName: "", contactPerson: "", phone: "", mobile: "",
  email: "", address: "", remarks: "", status: "1",
};

const ReceiveCreate = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const today       = new Date().toISOString().split("T")[0];

  // ── Bill files ───────────────────────────────────────────────────────────────
  const [billFiles, setBillFiles] = useState([]);

  const [rows, setRows] = useState([
    { id: "dummy", accountCode: "", particulars: "", amount: 0 },
  ]);

  const [showModal,        setShowModal]        = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm,      setCustomerForm]      = useState(customerDefault);
  const [customerErrors,    setCustomerErrors]    = useState({});

  const [form, setForm] = useState({
    entryDate: today, invoiceNo: "", supporting: "", description: "",
    customer: "", glDate: today, ReceiveCode: "",
    accountId: "", particular: "", amount: "", totalAmount: 0, inv_type: "",
  });

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => (await axios.get(`${url}/api/customer-type`)).data.data || [],
  });

  const { data: ReceiveCodes = [] } = useQuery({
    queryKey: ["ReceiveCodes"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-code`);
      return res.data.success ? res.data.data || [] : [];
    },
  });

  const { data: invTypes = [] } = useQuery({
  queryKey: ["invTypes"],
  queryFn: async () => {
    const res = await axios.get(`${url}/api/inv-type`); 
    return res.data.data || [];
  },
});

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/receive-account-code`);
      return res.data.success === true
        ? res.data.data.map((acc) => ({
            value: acc.ACCOUNT_ID,
            label: `${acc.ACCOUNT_ID} - ${acc.ACCOUNT_NAME}`,
            name: acc.ACCOUNT_NAME,
          }))
        : [];
    },
  });

  // ── Upload bills helper ──────────────────────────────────────────────────────
  const uploadBills = async (glMasterId) => {
    if (!billFiles.length || !glMasterId) return;
    const uploads = billFiles.map((file) => {
      const fd = new FormData();
      fd.append("doc_file",   file);
      fd.append("GLMASTERID", glMasterId);
      return axios.post(`${url}/api/gldoc`, fd);
    });
    await Promise.allSettled(uploads);
  };

  // ── Voucher Mutation ─────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (payload) => (await ReceiveService.insert(payload)).data,
    onSuccess: async (data) => {
      if (data.status === "success") {
        await uploadBills(data.masterID);
        toast.success("Voucher created successfully!");
        setBillFiles([]);
        setForm({
          entryDate: today, invoiceNo: "", supporting: "", description: "",
          customer: "", glDate: today, ReceiveCode: "",
          accountId: "", particular: "", amount: "", totalAmount: 0, inv_type: "",
        });
        setRows([{ id: "dummy", accountCode: "", particulars: "", amount: 0 }]);
        queryClient.invalidateQueries(["unpostedVouchers"]);
        navigate("/dashboard/receive-voucher");
      } else {
        toast.error("Error processing voucher");
      }
    },
    onError:   () => toast.error("Error submitting voucher. Please try again."),
    onSettled: () => setShowModal(false),
  });

  // ── Customer Mutation ────────────────────────────────────────────────────────
  const customerMutation = useMutation({
    mutationFn: (data) =>
      axios.post(`${url}/api/customer`, {
        CUSTOMER_NAME:  data.customerName,
        CONTACT_PERSON: data.contactPerson || null,
        PHONE:          data.phone         || null,
        MOBILE:         data.mobile        || null,
        EMAIL:          data.email         || null,
        ADDRESS:        data.address       || null,
        REMARKS:        data.remarks       || null,
        STATUS:         Number(data.status),
        ENTRY_BY: null, PASSWORD: null, ORG_ID: null, DUE: null, FAX: null,
      }),
    onSuccess: () => {
      toast.success("Customer created successfully!");
      queryClient.invalidateQueries(["customers"]);
      setCustomerForm(customerDefault);
      setCustomerErrors({});
      setShowCustomerModal(false);
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create customer."),
  });

  // ── Customer form validation ─────────────────────────────────────────────────
  const validateCustomer = () => {
    const errs = {};
    if (!customerForm.customerName.trim()) errs.customerName = "Customer name is required";
    if (customerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email))
      errs.email = "Invalid email address";
    setCustomerErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    if (!validateCustomer()) return;
    customerMutation.mutate(customerForm);
  };

  const handleCloseCustomerModal = () => {
    setCustomerForm(customerDefault);
    setCustomerErrors({});
    setShowCustomerModal(false);
  };

  // ── Row handlers ─────────────────────────────────────────────────────────────
  const addRow = () => {
    if (!form.accountId || !form.amount) return;
    const newRow = {
      id: Date.now(), accountCode: form.accountId,
      particulars: form.particular, amount: parseFloat(form.amount),
    };
    const updated = rows.length === 1 && rows[0].id === "dummy" ? [newRow] : [...rows, newRow];
    setRows(updated);
    setForm({
      ...form, accountId: "", particular: "", amount: "",
      totalAmount: updated.reduce((s, r) => s + Number(r.amount), 0),
    });
  };

  const removeRow = (id) => {
    const updated = rows.filter((r) => r.id !== id);
    setRows(updated);
    setForm({ ...form, totalAmount: updated.reduce((s, r) => s + Number(r.amount || 0), 0) });
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (
      !form.entryDate || !form.glDate || !form.description ||
      !form.ReceiveCode || !form.customer ||
      rows.length === 0 || rows[0].id === "dummy"
    ) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }
    if (rows.some((r) => !r.accountCode || !r.particulars)) {
      toast.error("Each row must have Account Code and Particular filled.");
      return;
    }
    mutation.mutate({
      trans_date:   form.entryDate,
      gl_date:      form.glDate,
      receive_desc: form.description,
      supporting:   String(form.supporting),
      receive:      form.ReceiveCode,
      supplierid:   String(form.customer),
      totalAmount:  Number(form.totalAmount),
      accountID:    rows.map((r) => r.accountCode),
      amount2:      rows.map((r) => Number(r.amount || 0)),
      inv_type: form.inv_type ? Number(form.inv_type) : null,
    });
  };

  const isSubmitting       = mutation.isPending;
  const isCustomerSaving   = customerMutation.isPending;

  // ── Shared input class ───────────────────────────────────────────────────────
  const inputCls = "w-full border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1";
  const errCls   = "text-xs text-red-500 mt-0.5";

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <SectionContainer>
      <div className="p-2 space-y-6 bg-white rounded-lg mt-4 shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">Create Receive Voucher</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCustomerModal(true)}>
              <Users size={15} className="mr-1" /> + Customer
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} className="mr-2" /> Back
            </Button>
          </div>
        </div>

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_1fr] gap-4 bg-white rounded-lg">

          {/* Bill Upload */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <BillUploadPanel files={billFiles} onChange={setBillFiles} disabled={isSubmitting} />
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

          {/* Dates / Invoice / Supporting / GL Date / Receive Code / Total */}
          <div>
            {[
              { label: "Entry Date",        type: "date",   key: "entryDate",  onChange: (v) => setForm({ ...form, entryDate: v }) },
              { label: "Invoice No",         type: "text",   key: "invoiceNo",  readOnly: true },
              { label: "No. of Supporting",  type: "number", key: "supporting", onChange: (v) => setForm({ ...form, supporting: v }) },
              { label: "GL Date",            type: "date",   key: "glDate",     onChange: (v) => setForm({ ...form, glDate: v }) },
            ].map(({ label, type, key, readOnly, onChange }) => (
              <div key={key} className="grid grid-cols-3 px-3 items-center py-2">
                <label className="font-bold text-sm text-gray-800">{label}</label>
                <input
                  type={type} value={form[key]} readOnly={readOnly}
                  disabled={isSubmitting || readOnly}
                  onChange={(e) => onChange?.(e.target.value)}
                  className={`col-span-2 w-full border rounded py-1 ${readOnly ? "bg-gray-100" : "bg-white"}`}
                />
              </div>
            ))}

            {/* Customer select-এর পরে এই block যোগ করো */}
<div className="grid grid-cols-3 px-3 items-center py-3">
  <label className="font-bold text-sm text-gray-800">Type</label>
  <select
    value={form.inv_type}
    onChange={(e) => setForm({ ...form, inv_type: e.target.value })}
    disabled={isSubmitting}
    className="col-span-2 w-full border rounded py-1 h-8 bg-white"
  >
    <option value="">Select type</option>
    {invTypes.map((t) => (
      <option key={t.ID} value={String(t.ID)}>{t.DESCRIPTIO}</option>
    ))}
  </select>
</div>

            <div className="grid grid-cols-3 px-3 items-center">
              <label className="font-bold text-sm text-gray-800">Receive Code</label>
              <select
                value={form.ReceiveCode}
                onChange={(e) => setForm({ ...form, ReceiveCode: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full rounded py-1 border bg-white"
              >
                <option value="">Select Receive</option>
                {ReceiveCodes.map((c) => (
                  <option key={c.ACCOUNT_ID} value={c.ACCOUNT_ID}>{c.ACCOUNT_NAME}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800">Total Amount</label>
              <input
                type="number" value={form.totalAmount.toFixed(2)} readOnly
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
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

        {/* Add row inputs */}
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
            <input type="text" value={form.particular} readOnly className="col-span-2 border w-full rounded py-1 bg-white" />
          </div>
          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800">Amount</label>
            <input
              type="number" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              disabled={isSubmitting}
              className="col-span-1 border w-full rounded py-1 bg-white"
            />
          </div>
          <div className="px-4 py-2">
            <button
              type="button" onClick={addRow} disabled={isSubmitting}
              className="cursor-pointer border px-3 py-1 rounded-lg flex items-center font-bold text-sm text-gray-800"
            >
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => setShowModal(true)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create"}
          </Button>
        </div>
      </div>

      {/* ── Voucher Confirmation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Voucher Submission</h2>
            <div className="space-y-2">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>Customer:</strong> {customers.find((s) => String(s.CUSTOMER_ID) === form.customer)?.CUSTOMER_NAME}</p>
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
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-gray-300">Cancel</button>
              <button
                onClick={handleSubmit} disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-green-500 text-white"
              >
                {isSubmitting ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Customer Dialog Modal ── */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-11/12 md:w-[560px] max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gray-100">
                  <Users size={18} className="text-gray-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-800">Add New Customer</h2>
                  <p className="text-xs text-gray-500">Create a new customer record</p>
                </div>
              </div>
              <button
                onClick={handleCloseCustomerModal}
                disabled={isCustomerSaving}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCustomerSubmit} className="px-6 py-5 space-y-4">

              {/* Customer Name */}
              <div>
                <label className={labelCls}>
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerForm.customerName}
                  onChange={(e) => setCustomerForm({ ...customerForm, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  disabled={isCustomerSaving}
                  className={inputCls}
                />
                {customerErrors.customerName && <p className={errCls}>{customerErrors.customerName}</p>}
              </div>

              {/* Contact Person + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Contact Person</label>
                  <input
                    type="text"
                    value={customerForm.contactPerson}
                    onChange={(e) => setCustomerForm({ ...customerForm, contactPerson: e.target.value })}
                    placeholder="Contact person"
                    disabled={isCustomerSaving}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    placeholder="Phone number"
                    disabled={isCustomerSaving}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Mobile + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mobile</label>
                  <input
                    type="text"
                    value={customerForm.mobile}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                    placeholder="Mobile number"
                    disabled={isCustomerSaving}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="email@example.com"
                    disabled={isCustomerSaving}
                    className={inputCls}
                  />
                  {customerErrors.email && <p className={errCls}>{customerErrors.email}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className={labelCls}>Address</label>
                <textarea
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder="Customer address"
                  rows={2}
                  disabled={isCustomerSaving}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Remarks + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Remarks</label>
                  <input
                    type="text"
                    value={customerForm.remarks}
                    onChange={(e) => setCustomerForm({ ...customerForm, remarks: e.target.value })}
                    placeholder="Optional remarks"
                    disabled={isCustomerSaving}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={customerForm.status}
                    onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value })}
                    disabled={isCustomerSaving}
                    className={inputCls}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                <button
                  type="button"
                  onClick={handleCloseCustomerModal}
                  disabled={isCustomerSaving}
                  className="px-4 py-2 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCustomerSaving}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-60"
                >
                  {isCustomerSaving ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </SectionContainer>
  );
};

export default ReceiveCreate;