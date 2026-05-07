import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Select from "react-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { SectionContainer } from "@/components/SectionContainer";
import { Button } from "@/components/ui/button";
import BillUploadPanel from "@/components/shared/bill-upload-panel";

const url = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CashTransferCreate = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const today       = new Date().toISOString().split("T")[0];

  // ── Bill files ───────────────────────────────────────────────────────────────
  const [billFiles, setBillFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    entryDate:    today,
    glDate:       today,
    amount:       "",
    fromCode:     "",
    toCode:       "",
    description:  "",
    supporting:   "",
  });

  // ── Accounts query ───────────────────────────────────────────────────────────
  const { data: accounts = [] } = useQuery({
    queryKey: ["cashFlowAccounts"],
    queryFn: async () => {
      const res = await axios.get(`${url}/api/case-flow-account-code`);
      if (res.data.success === 1) {
        return res.data.data.map((acc) => ({
          value: acc.ACCOUNT_ID,
          label: `${acc.ACCOUNT_ID} - ${acc.ACCOUNT_NAME}`,
          name:  acc.ACCOUNT_NAME,
        }));
      }
      return [];
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

  // ── Mutation ─────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await axios.post(`${url}/api/cash-flow-add`, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.status === "success") {
        await uploadBills(data.masterID || data.id);
        toast.success("Cash transfer submitted successfully!");
        setBillFiles([]);
        setForm({
          entryDate: today, glDate: today,
          amount: "", fromCode: "", toCode: "",
          description: "", supporting: "",
        });
        queryClient.invalidateQueries(["unpostedCashTransfers"]);
        navigate("/dashboard/cash-transfer");
      } else {
        toast.error("Error processing voucher.");
      }
      setShowModal(false);
    },
    onError: () => {
      toast.error("Error submitting voucher. Please try again.");
      setShowModal(false);
    },
  });

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.entryDate || !form.amount || !form.toCode || !form.fromCode || !form.glDate) {
      toast.error("Please fill all required fields.");
      return;
    }
    mutation.mutate({
      trans_date:    form.entryDate,
      receive_desc:  form.description || "Cash Transfer",
      fromCode:      form.fromCode,
      toCode:        form.toCode,
      amount:        parseFloat(form.amount) || 0,
      GL_ENTRY_DATE: form.glDate,
      supporting:    form.supporting || "0",
    });
  };

  const isSubmitting = mutation.isPending;

  const selectStyles = {
    control: (b) => ({ ...b, minHeight: "32px", height: "32px", fontSize: "0.875rem", borderRadius: "0.375rem" }),
    valueContainer: (b) => ({ ...b, height: "32px", padding: "0 8px" }),
    input: (b) => ({ ...b, margin: 0, padding: 0 }),
    indicatorsContainer: (b) => ({ ...b, height: "32px" }),
    singleValue: (b) => ({ ...b, lineHeight: "32px" }),
    menuPortal: (b) => ({ ...b, zIndex: 9999 }),
    menu: (b) => ({ ...b, backgroundColor: "white", border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }),
  };

  return (
    <SectionContainer>
      <div className="p-2 space-y-6 bg-white rounded-lg mt-4 shadow-md">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">Create Cash Transfer</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
        </div>

        {/* Top grid: Bill panel | Fields */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 bg-white rounded-lg">

          {/* Bill Upload */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <BillUploadPanel
              files={billFiles}
              onChange={setBillFiles}
              disabled={isSubmitting}
            />
          </div>

          {/* Form fields */}
          <div>
            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">Entry Date</label>
              <input
                type="date"
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">GL Date</label>
              <input
                type="date"
                value={form.glDate}
                onChange={(e) => setForm({ ...form, glDate: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">Amount</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-40 border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">From Code</label>
              <div className="col-span-2">
                <Select
                  options={accounts}
                  value={accounts.find((a) => a.value === form.fromCode) || null}
                  onChange={(s) => setForm({ ...form, fromCode: s ? s.value : "" })}
                  placeholder="Select account..."
                  isClearable isSearchable isDisabled={isSubmitting}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">To Code</label>
              <div className="col-span-2">
                <Select
                  options={accounts}
                  value={accounts.find((a) => a.value === form.toCode) || null}
                  onChange={(s) => setForm({ ...form, toCode: s ? s.value : "" })}
                  placeholder="Select account..."
                  isClearable isSearchable isDisabled={isSubmitting}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800">No. of Supporting</label>
              <input
                type="number"
                value={form.supporting}
                onChange={(e) => setForm({ ...form, supporting: e.target.value })}
                disabled={isSubmitting}
                className="col-span-2 w-40 border rounded py-1 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4 mb-4">
          <label className="font-bold text-sm text-gray-800 block mb-2 py-2 px-4 rounded-lg">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            disabled={isSubmitting}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" onClick={() => setShowModal(true)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Create"}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Cash Transfer</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Amount:</strong> {form.amount}</p>
              <p><strong>From Code:</strong> {accounts.find((a) => a.value === form.fromCode)?.label || form.fromCode}</p>
              <p><strong>To Code:</strong> {accounts.find((a) => a.value === form.toCode)?.label || form.toCode}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>

              {billFiles.length > 0 && (
                <div>
                  <strong>Bills ({billFiles.length}):</strong>
                  <ul className="list-disc pl-5 text-gray-600">
                    {billFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-300"
              >
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

export default CashTransferCreate;