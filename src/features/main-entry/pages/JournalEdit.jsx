import { useState, useEffect } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Select from "react-select";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";

import { SectionContainer } from "@/components/SectionContainer";
import { Button } from "@/components/ui/button";
import BillUploadPanelEdit from "@/components/shared/edit-bill-upload-panel";

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const JournalEdit = () => {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  // ── Bill state ────────────────────────────────────────────────────────────────
  const [existingDocs, setExistingDocs] = useState([]);
  const [newBillFiles, setNewBillFiles] = useState([]);

  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    entryDate: today,
    supporting: "",
    description: "",
    glDate: today,
    accountId: "",
    particular: "",
  });

  // ── Fetch existing docs ───────────────────────────────────────────────────────
  useQuery({
    queryKey: ["gldocs", voucherId],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/gldoc`, { params: { glmaster_id: voucherId } });
      const docs = res.data.data || [];
      setExistingDocs(docs);
      return docs;
    },
    enabled: !!voucherId,
  });

  // ── Upload new bills ──────────────────────────────────────────────────────────
  const uploadNewBills = async () => {
    if (!newBillFiles.length) return;
    await Promise.allSettled(
      newBillFiles.map((file) => {
        const fd = new FormData();
        fd.append("doc_file", file);
        fd.append("GLMASTERID", voucherId);
        return axios.post(`${url}/api/gldoc`, fd);
      })
    );
    setNewBillFiles([]);
    const res = await axios.get(`${url}/api/gldoc`, { params: { glmaster_id: voucherId } });
    setExistingDocs(res.data.data || []);
  };

  // ── Accounts ──────────────────────────────────────────────────────────────────
  const { data: accounts = [] } = useQuery({
    queryKey: ["journalAccounts"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/gl-account-code`);
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

  // ── Fetch voucher data ────────────────────────────────────────────────────────
  const { data: voucherData } = useQuery({
    queryKey: ["journalVoucher", voucherId],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/gl-view?insertID=${voucherId}`);
      return res.data;
    },
    enabled: !!voucherId && accounts.length > 0,
    staleTime: 0,
    gcTime: 0,
  });

  // ── Populate form + rows from server data ─────────────────────────────────────
  useEffect(() => {
    if (!voucherId || !voucherData || accounts.length === 0) return;
    if (voucherData.status !== "success") return;

    const master = voucherData.master || {};
    if (String(master.ID) !== String(voucherId)) return;

    const details = voucherData.details || [];

    setRows(
      details.map((d, i) => ({
        id: d.ID || `${d.CODE}-${i}`,
        detail_id: d.ID,
        accountCode: d.CODE,
        particulars: d.ACCOUNT_NAME || d.CODEDESCRIPTION || "",
        debit: parseFloat(d.DEBIT) || 0,
        credit: parseFloat(d.CREDIT) || 0,
        isExisting: true,
      }))
    );

    setForm({
      entryDate: master.TRANS_DATE || today,
      glDate: master.GL_ENTRY_DATE || today,
      supporting: master.SUPPORTING || "",
      description: master.DESCRIPTION || "",
      accountId: "",
      particular: "",
    });
  }, [voucherData, accounts, voucherId]);

  // ── Mutation ──────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post(`${url}/api/gl-edit`, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.status === "success") {
        await uploadNewBills();
        toast.success("Journal Voucher updated successfully!");
        await queryClient.invalidateQueries(["unpostedJournalVouchers"]);
        await queryClient.invalidateQueries(["journalVoucher", voucherId]);
        await queryClient.invalidateQueries(["gldocs", voucherId]);
        setShowModal(false);
        navigate("/dashboard/journal-voucher");
      } else {
        toast.error(data.message || "Error processing voucher.");
        setShowModal(false);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Server error. Please try again.");
      setShowModal(false);
    },
  });

  // ── Add new row via account selector (same as Create) ────────────────────────
  const addRow = () => {
    if (!form.accountId) {
      toast.error("Please select an account.");
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        detail_id: null,
        accountCode: form.accountId,
        particulars: form.particular,
        debit: "",
        credit: "",
        isExisting: false,
      },
    ]);
    setForm((prev) => ({ ...prev, accountId: "", particular: "" }));
  };

  // ── Inline row change — mutually exclusive debit/credit ───────────────────────
  // For existing rows: both fields remain editable freely (allow corrections)
  // For new rows: entering debit clears credit and vice-versa
  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (!row.isExisting) {
          if (field === "debit" && value) updated.credit = "";
          if (field === "credit" && value) updated.debit = "";
        }
        return updated;
      })
    );
  };

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id));

  const debitTotal = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
  const creditTotal = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.entryDate || !form.glDate || rows.length === 0) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }
    if (rows.some((r) => !r.accountCode || !r.particulars)) {
      toast.error("Each row must have Account Code and Particular filled.");
      return;
    }
    if (Math.abs(debitTotal - creditTotal) > 0.001) {
      toast.error("Debit and Credit totals must be equal before submission.");
      return;
    }
    mutation.mutate({
      master_id: voucherId,
      trans_date: form.entryDate,
      gl_entry_date: form.glDate,
      receive_desc: form.description,
      supporting: String(form.supporting || "0"),
      details: rows.map((r) => ({
        id: r.detail_id || r.id,
        code: r.accountCode,
        description: r.particulars,
        debit: parseFloat(r.debit) || 0,
        credit: parseFloat(r.credit) || 0,
        isExisting: r.isExisting,
      })),
    });
  };

  const isSubmitting = mutation.isPending;

  return (
    <SectionContainer>
      <div className="p-6 space-y-6 bg-white rounded-lg mt-4 shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-800">Edit Journal Voucher</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
        </div>

        {/* Bill panel + form fields — identical layout to Create */}
        <div className="md:flex justify-between gap-10 bg-white rounded-lg">
          <div className="border rounded-lg p-3 bg-gray-50 min-w-[200px] md:w-[220px]">
            <BillUploadPanelEdit
              existingDocs={existingDocs}
              onDeleteDoc={(id) => setExistingDocs((p) => p.filter((d) => d.ID !== id))}
              newFiles={newBillFiles}
              onNewFiles={setNewBillFiles}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-gray-800 text-sm font-sans">Entry Date</label>
              <input
                type="date" value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>
            <div className="grid grid-cols-3 py-2 px-3 items-center">
              <label className="font-bold text-gray-800 text-sm font-sans">No. of Supporting</label>
              <input
                type="number" value={form.supporting}
                onChange={(e) => setForm({ ...form, supporting: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-40 border rounded py-1 bg-white"
              />
            </div>
            <div className="grid grid-cols-3 py-2 px-3 items-center">
              <label className="font-bold text-gray-800 text-sm font-sans">GL Date</label>
              <input
                type="date" value={form.glDate}
                onChange={(e) => setForm({ ...form, glDate: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 mb-4 bg-white">
          <label className="block font-bold text-gray-800 text-sm font-sans mb-2 py-2 px-4 rounded-lg">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSubmitting}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* Add new row: Account + Particular + Add (NO debit/credit here) */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_auto] gap-4 rounded-lg items-center">
          <div className="grid grid-cols-3 px-3 items-center py-1">
            <label className="font-bold text-gray-800 text-sm font-sans block">Account ID</label>
            <Select
              options={accounts}
              className="col-span-2 border w-full rounded shadow-2xl"
              value={accounts.find((a) => a.value === form.accountId) || null}
              onChange={(s) =>
                setForm({ ...form, accountId: s ? s.value : "", particular: s ? s.name : "" })
              }
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
            <label className="font-bold text-gray-800 text-sm font-sans block">Particular</label>
            <input
              type="text" value={form.particular} readOnly
              className="col-span-2 border w-full rounded py-1 bg-white"
            />
          </div>

          <div className="px-4 py-2">
            <button
              type="button" onClick={addRow} disabled={isSubmitting}
              className="font-bold text-gray-800 font-sans cursor-pointer border px-3 py-1 rounded-lg flex items-center text-sm"
            >
              <span className="mr-1 font-extrabold">+</span>Add
            </button>
          </div>
        </div>

        {/* Table — existing rows editable, new rows also editable */}
        <table className="w-full table-fixed border-collapse rounded-lg overflow-x-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 w-[22%] text-center font-bold text-gray-800 text-sm font-sans">Account Code</th>
              <th className="px-4 py-2 w-[35%] text-center font-bold text-gray-800 text-sm font-sans">Particulars</th>
              <th className="px-4 py-2 w-[14%] text-center font-bold text-gray-800 text-sm font-sans">Debit</th>
              <th className="px-4 py-2 w-[14%] text-center font-bold text-gray-800 text-sm font-sans">Credit</th>
              <th className="px-4 py-2 w-[8%]"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                  Loading rows...
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr
                key={row.id}
                className={`border ${row.isExisting ? "bg-blue-50/40" : "bg-white"}`}
              >
                <td className="border px-4 py-2 text-sm">
                  {row.accountCode}
                  {row.isExisting && (
                    <span className="ml-1 text-[10px] text-blue-400 font-normal">(saved)</span>
                  )}
                </td>

                {/* Particulars — editable for all rows */}
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    value={row.particulars}
                    onChange={(e) => handleRowChange(row.id, "particulars", e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-transparent outline-none text-sm border-b border-transparent focus:border-gray-300"
                  />
                </td>

                {/* Debit:
                    - existing row: freely editable (no lock)
                    - new row: locked (shows —) when credit has value */}
                <td className="border p-2">
                  {(!row.isExisting && parseFloat(row.credit) > 0) ? (
                    <span className="block w-full text-center text-gray-300 text-sm select-none">—</span>
                  ) : (
                    <input
                      type="number"
                      value={row.debit}
                      onChange={(e) => handleRowChange(row.id, "debit", e.target.value)}
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full border-none outline-none bg-transparent text-center text-sm"
                    />
                  )}
                </td>

                {/* Credit:
                    - existing row: freely editable (no lock)
                    - new row: locked (shows —) when debit has value */}
                <td className="border p-2">
                  {(!row.isExisting && parseFloat(row.debit) > 0) ? (
                    <span className="block w-full text-center text-gray-300 text-sm select-none">—</span>
                  ) : (
                    <input
                      type="number"
                      value={row.credit}
                      onChange={(e) => handleRowChange(row.id, "credit", e.target.value)}
                      disabled={isSubmitting}
                      placeholder="0"
                      className="w-full border-none outline-none bg-transparent text-center text-sm"
                    />
                  )}
                </td>

                <td className="border p-2 text-center">
                  <Button type="button" variant="ghost" size="icon"
                    onClick={() => removeRow(row.id)} disabled={isSubmitting}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}

            {rows.length > 0 && (
              <tr className="font-semibold bg-gray-50">
                <td colSpan="2" className="text-right text-sm p-2 pr-4">Total</td>
                <td className="border text-sm text-center p-2">{debitTotal.toFixed(2)}</td>
                <td className="border text-sm text-center p-2">{creditTotal.toFixed(2)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>

        {/* Imbalance warning */}
        {rows.length > 0 && Math.abs(debitTotal - creditTotal) > 0.001 && (
          <p className="text-sm text-red-500 text-right">
            ⚠ Debit ({debitTotal.toFixed(2)}) ≠ Credit ({creditTotal.toFixed(2)}) — totals must match to save.
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end items-center gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={isSubmitting}>
            Cancel
          </Button>
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
            <div className="space-y-2 text-sm">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p><strong>GL Date:</strong> {form.glDate}</p>

              {(existingDocs.length > 0 || newBillFiles.length > 0) && (
                <div>
                  <strong>Bills:</strong>
                  <ul className="list-disc pl-5 text-gray-600 mt-1">
                    {existingDocs.map((d) => <li key={d.ID}>Doc #{d.ID} (saved)</li>)}
                    {newBillFiles.map((f, i) => <li key={i} className="text-blue-600">{f.name} (new)</li>)}
                  </ul>
                </div>
              )}

              <p className="font-semibold mt-2">Accounts:</p>
              <ul className="list-disc pl-5">
                {rows.map((row, i) => (
                  <li key={i}>
                   {row.accountCode} — {row.particulars} —{" "}

      {Number(row.debit) > 0
        ? `Debit: ${row.debit}`
        : Number(row.credit) > 0
        ? `Credit: ${row.credit}`
        : null}
                    {" "}<span className="text-xs text-gray-400">({row.isExisting ? "existing" : "new"})</span>
                  </li>
                ))}
              </ul>
              <p className="font-semibold">
                Total Debit: {debitTotal.toFixed(2)} | Total Credit: {creditTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex justify-end mt-4 space-x-3">
              <button onClick={() => setShowModal(false)} disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-gray-300">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-green-500 text-white">
                {isSubmitting ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default JournalEdit;