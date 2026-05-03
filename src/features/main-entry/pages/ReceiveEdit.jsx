import { useState, useEffect } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import Select from "react-select";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
// import api from "@/api/Ap";
import { SectionContainer } from "@/components/SectionContainer";
import { ReceiveService } from "@/api/AccontingApi";
import { Button } from "@/components/ui/button";
import axios from "axios";
const url  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ReceiveEdit = () => {
  const { voucherId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [rows, setRows] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    entryDate: today,
    invoiceNo: "",
    supporting: "",
    description: "",
    customer: "",
    glDate: today,
    ReceiveCode: "",
    paymentCode: "",
    creditId: null,
    accountId: "",
    particular: "",
    amount: "",
    totalAmount: 0,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      // const res = await api.get("/customer.php");
       const res = await axios.get(`${url}/api/customer-type`);
      return res.data.data || [];
    },
  });

  // Fetch Receive Codes
  const { data: ReceiveCodes = [] } = useQuery({
    queryKey: ["ReceiveCodes"],
    queryFn: async () => {
      // const res = await api.get("/receive_code.php");
        const res = await axios.get(`${url}/api/receive-code`);
      return res.data.success === true ? res.data.data || [] : [];
    },
  });

  // Fetch Accounts
  // const { data: accounts = [] } = useQuery({
  //   queryKey: ["accounts"],
  //   queryFn: async () => {
  //     // const res = await api.get("/rec_account_code.php");
  //     const res = await axios.get(`${url}/api/receive-account-code`);
      
  //     if (res.data.success === true) {
  //       return res.data.data.map((acc) => ({
  //         value: acc.ACCOUNT_ID,
  //         label: `${acc.ACCOUNT_ID} - ${acc.ACCOUNT_NAME}`,
  //         name: acc.ACCOUNT_NAME,
  //       }));
  //     }
  //     return [];
  //   },
  // });

  // Fetch Accounts
    const { data: accounts = [] } = useQuery({
      queryKey: ["accounts"],
      queryFn: async () => {
      //   const res = await api.get("/account_code.php");
        const res = await axios.get(`${url}/api/account-code`);
        
        if (res.data.success === 1) {
          return res.data.data.map((acc) => ({
            value: acc.ACCOUNT_ID,
            label: `${acc.ACCOUNT_ID} - ${acc.ACCOUNT_NAME}`,
            name: acc.ACCOUNT_NAME,
          }));
        }
        return [];
      },
    });

  // Fetch voucher data
  const { data: voucherData } = useQuery({
    queryKey: ["voucher", voucherId],
    queryFn: async () => {
      const res = await ReceiveService.search(voucherId);
      return res.data;
    },
    enabled: !!voucherId && accounts.length > 0,
  });

  const toInputDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


  // Populate form when data is loaded
  useEffect(() => {
    if (!voucherId || voucherData?.status !== "success") return;

    const master = voucherData.master || {};
    const details = voucherData.details || [];
    const summary = voucherData.summary || {};
    const paymentCode = master.CASHACCOUNT || "";

    // Map rows from credit entries, excluding the payment code entry
    const mappedRows = details
      .filter((d) => {
        // Only include credit entries that are NOT the payment code
        return d.credit && Number(d.credit) > 0 && d.code !== paymentCode;
      })
      .map((d) => {
        const account = accounts.find((acc) => acc.value === d.code);
        return {
          id: d.id,
          accountCode: d.code || "",
          particulars: account ? account.label : (d.codedescription || ""),
          amount: parseFloat(d.credit),
          creditId: d.id, // Store the credit ID for updates
          isExisting: true, // Mark as existing row
        };
      });

    // Calculate total from mapped rows only
    const total = mappedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    setForm({
      // entryDate: master.TRANS_DATE
      //   ? new Date(master.TRANS_DATE).toISOString().split("T")[0]
      //   : today,
      // glDate: master.GL_ENTRY_DATE
      //   ? new Date(master.GL_ENTRY_DATE).toISOString().split("T")[0]
      //   : today,
      entryDate: toInputDate(master.TRANS_DATE),   // ✅ DB থেকে আসা date
  glDate:    toInputDate(master.GL_ENTRY_DATE), // ✅ DB থেকে আসা date
      invoiceNo: master.VOUCHERNO || "",
      supporting: master.SUPPORTING || "",
      description: master.DESCRIPTION || "",
      customer: master.CUSTOMER_ID ? String(master.CUSTOMER_ID) : "",
      ReceiveCode: paymentCode,
      paymentCode: paymentCode,
      accountId: "",
      particular: "",
      amount: "",
      totalAmount: total,
    });

    setRows(mappedRows);
  }, [voucherId, voucherData, accounts]);

  // Update Mutation
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await ReceiveService.update(payload);
      console.log("Backend Response:", res.data);
      return res.data;
    },
    onSuccess: async (data) => {
      if (data.status === "success") {
        toast.success("Voucher updated successfully!");
        
        // Invalidate queries first
        await queryClient.invalidateQueries(["unpostedVouchers"]);
        await queryClient.invalidateQueries(["voucher", voucherId]);
        
        // Force refetch to get fresh data
        const freshData = await queryClient.fetchQuery({
          queryKey: ["voucher", voucherId],
          queryFn: async () => {
            const res = await ReceiveService.search(voucherId);
            return res.data;
          },
        });
        
        console.log("Fresh data after update:", freshData);
        
        setShowModal(false);
        navigate("/dashboard/receive-voucher");
        
        // Optional: Navigate back after successful update
        // setTimeout(() => navigate(-1), 500);
      } else {
        toast.error("Error processing voucher");
        setShowModal(false);
      }
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error("Error submitting voucher. Please try again.");
      setShowModal(false);
    },
  });

  // Add Row Handler
  const addRow = () => {
    if (!form.accountId || !form.amount) {
      toast.error("Please select account and enter amount");
      return;
    }

    const selectedAccount = accounts.find((acc) => acc.value === form.accountId);

    const newRow = {
      id: Date.now(), // Temporary ID for new rows
      accountCode: form.accountId,
      particulars: selectedAccount ? selectedAccount.label : form.particular,
      amount: parseFloat(form.amount),
      creditId: null, // New rows don't have creditId yet
      isExisting: false, // Mark as new row
    };

    const updatedRows = [...rows, newRow];
    const total = updatedRows.reduce((sum, r) => sum + Number(r.amount), 0);

    setRows(updatedRows);
    setForm({
      ...form,
      accountId: "",
      particular: "",
      amount: "",
      totalAmount: total,
    });
  };

  // Update Row Handler
  const updateRow = (id, field, value) => {
    const updatedRows = rows.map((row) =>
      row.id === id
        ? {
            ...row,
            [field]: field === "amount" ? Number(value) : value,
          }
        : row
    );

    const total = updatedRows.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    setRows(updatedRows);
    setForm((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  };

  // Remove Row Handler
  const removeRow = (id) => {
    const updatedRows = rows.filter((r) => r.id !== id);
    const total = updatedRows.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );
    setRows(updatedRows);
    setForm({ ...form, totalAmount: total });
  };

  // Submit Handler
  const handleSubmit = () => {
    if (
      !form.entryDate ||
      !form.glDate ||
      !form.description ||
      !form.paymentCode ||
      !form.customer ||
      rows.length === 0
    ) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }

    const invalidRow = rows.some((row) => !row.accountCode || !row.amount);
    if (invalidRow) {
      toast.error("Each row must have Account Code and Amount filled.");
      return;
    }

    // Get the first debit entry ID (payment code entry)
    const firstDebitEntry = voucherData?.details?.find(
      d => d.code === form.paymentCode && d.debit && Number(d.debit) > 0
    );
    const creditId = firstDebitEntry?.id || null;

    // Calculate fresh total from current rows only
    const calculatedTotal = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    const payload = {
      action: "update",
      masterID: Number(voucherId),
      trans_date: form.entryDate,
      gl_date: form.glDate,
      receive_desc: form.description,
      pcode: form.paymentCode,
      credit_id: creditId,
      supplierid: String(form.customer),
      totalAmount: Number(calculatedTotal),
      supporting: String(form.supporting),
      DEBIT_ID: rows.map((r) => r.creditId ? Number(r.creditId) : null),
      amount2: rows.map((r) => Number(r.amount)),
      acode: rows.map((r) => r.accountCode),
      CODEDESCRIPTION: rows.map((r) => {
        const parts = r.particulars.split(' - ');
        return parts.length > 1 ? parts[1] : r.particulars;
      }),
      DESCRIPTION: rows.map((r) => {
        const parts = r.particulars.split(' - ');
        return parts.length > 1 ? parts[1] : r.particulars;
      }),
    };

    console.log("=== DETAILED PAYLOAD DEBUG ===");
    console.log("Full Payload:", JSON.stringify(payload, null, 2));
    console.log("\n--- Row Details ---");
    rows.forEach((row, idx) => {
      console.log(`Row ${idx + 1}:`, {
        id: row.id,
        creditId: row.creditId,
        accountCode: row.accountCode,
        amount: row.amount,
        isExisting: row.isExisting
      });
    });
    console.log("\n--- Calculations ---");
    console.log("Calculated Total:", calculatedTotal);
    console.log("Form Total Amount:", form.totalAmount);
    console.log("Payment Code Entry ID (credit_id):", payload.credit_id);
    console.log("\n--- Arrays ---");
    console.log("DEBIT_ID array:", payload.DEBIT_ID);
    console.log("amount2 array:", payload.amount2);
    console.log("acode array:", payload.acode);
    
    // Verify totals match
    const amountSum = payload.amount2.reduce((sum, amt) => sum + amt, 0);
    console.log("\n--- Verification ---");
    console.log("Sum of amount2 array:", amountSum);
    console.log("Matches totalAmount?", amountSum === payload.totalAmount);
    console.log("\n--- Expected Backend Behavior ---");
    console.log(`Should UPDATE voucher_details SET debit = ${calculatedTotal} WHERE id = ${creditId}`);
    rows.forEach((row, idx) => {
      if (row.creditId) {
        console.log(`Should UPDATE voucher_details SET credit = ${row.amount} WHERE id = ${row.creditId}`);
      } else {
        console.log(`Should INSERT new row with credit = ${row.amount}`);
      }
    });

    mutation.mutate(payload);
  };

  return (
    <SectionContainer>
      <div className="p-6 space-y-6 bg-white rounded-lg mt-4 shadow-md">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">
            Edit Receive Voucher
          </h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_1fr] gap-4 bg-white rounded-lg">
          <div className="bg-gray-200 border-black">
            <h1 className="text-center py-10">this is bill</h1>
          </div>

          <div>
            <div className="grid grid-cols-3  px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800 font-sans">
                Customer
              </label>
              <select
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                className="col-span-2 w-full border rounded py-1 h-8 bg-white"
              >
                <option value="">Select customer</option>
                {customers.map((cus) => (
                  <option key={cus.CUSTOMER_ID} value={String(cus.CUSTOMER_ID)}>
                    {cus.CUSTOMER_NAME}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3  px-3 items-center py-2">
              <label className="font-bold text-sm text-gray-800 font-sans">
                Entry Date
              </label>
              <input
                type="date"
                value={form.entryDate}
                onChange={(e) =>
                  setForm({ ...form, entryDate: e.target.value })
                }
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans">
                Invoice No
              </label>
              <input
                type="text"
                value={form.invoiceNo}
                readOnly
                className="col-span-2 w-full border rounded py-1 bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-3  py-2 px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans">
                No. of Supporting
              </label>
              <input
                type="number"
                value={form.supporting}
                onChange={(e) =>
                  setForm({ ...form, supporting: e.target.value })
                }
                className="border-collapse w-40 border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  py-2 px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans">
                GL Date
              </label>
              <input
                type="date"
                value={form.glDate}
                onChange={(e) => setForm({ ...form, glDate: e.target.value })}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans">
                Payment Code
              </label>
              <select
                value={form.paymentCode}
                onChange={(e) =>
                  setForm({ ...form, paymentCode: e.target.value })
                }
                className="col-span-2 w-full rounded py-1 border bg-white"
              >
                <option value="">Select Payment</option>
                {ReceiveCodes.map((code) => (
                  <option key={code.ACCOUNT_ID} value={code.ACCOUNT_ID}>
                    {code.ACCOUNT_NAME}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3  px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800 font-sans">
                Total Amount
              </label>
              <input
                type="number"
                value={form.totalAmount.toFixed(2)}
                readOnly
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 mb-4 bg-white ">
          <label className="font-bold text-sm text-gray-800 font-sans mb-2 py-2 px-4 rounded-lg">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_1fr]  gap-4 rounded-lg justify-center items-center">
          <div className="grid grid-cols-3 px-3 items-center py-1">
            <label className="font-bold text-sm text-gray-800 font-sans">
              Account ID
            </label>
            <Select
              options={accounts}
              className="col-span-2 border w-full rounded shadow-2xl"
              value={
                accounts.find((acc) => acc.value === form.accountId) || null
              }
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
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }),
              }}
            />
          </div>

          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800 font-sans">
              Particular
            </label>
            <input
              type="text"
              value={form.particular}
              onChange={(e) => setForm({ ...form, particular: e.target.value })}
              className="col-span-2 border w-full rounded py-1 bg-white"
            />
          </div>

          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800 font-sans">
              Amount
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="col-span-1 border w-full rounded py-1 bg-white"
            />
          </div>

          <div className="px-4 py-2">
            <button
              type="button"
              onClick={addRow}
              className="font-bold text-sm text-gray-800 font-sans cursor-pointer border px-3 py-1 rounded-lg flex items-center"
            >
              <span className="mr-1 font-extrabold">+</span>Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse  rounded-lg text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800 font-sans">
                  Account Code
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800 font-sans">
                  Particulars
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800 font-sans">
                  Amount
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800 font-sans w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border">
                  {/* Account Code - Display only */}
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <span className="text-sm">{row.accountCode}</span>
                  </td>

                  {/* Particulars */}
                  <td className="border px-2 md:px-4 py-2">
                    <input
                      type="text"
                      value={row.particulars}
                      onChange={(e) =>
                        updateRow(row.id, "particulars", e.target.value)
                      }
                      className="w-full bg-transparent outline-none"
                    />
                  </td>

                  {/* Amount */}
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <input
                      type="number"
                      value={row.amount}
                      onChange={(e) =>
                        updateRow(row.id, "amount", e.target.value)
                      }
                      className="w-full bg-transparent outline-none text-center"
                    />
                  </td>

                  {/* Delete */}
                  <td className="border px-2 md:px-4 py-2 text-center">
                    <Button type="button" onClick={() => removeRow(row.id)}>
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5 " />
                    </Button>
                  </td>
                </tr>
              ))}

              {rows.length > 0 && (
                <tr className="font-semibold">
                  <td colSpan="2" className="p-2 text-right text-gray-600">
                    Total
                  </td>
                  <td className="border p-2 text-center">
                    {form.totalAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            // className="bg-gray-300 text-black px-8 py-2 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={mutation.isPending}
            // className="bg-green-500 cursor-pointer text-white px-12 py-2 rounded-lg"
          >
            {mutation.isPending ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Voucher Update</h2>
            <div className="space-y-2">
              <p>
                <strong>Entry Date:</strong> {form.entryDate}
              </p>
              <p>
                <strong>Invoice No:</strong> {form.invoiceNo}
              </p>
              <p>
                <strong>No. of Supporting:</strong> {form.supporting}
              </p>
              <p>
                <strong>Description:</strong> {form.description}
              </p>
              <p>
                <strong>Customer:</strong>{" "}
                {
                  customers.find((s) => s.CUSTOMER_ID === form.customer)
                    ?.CUSTOMER_NAME
                }
              </p>
              <p>
                <strong>GL Date:</strong> {form.glDate}
              </p>
              <p>
                <strong>Payment Code:</strong> {form.paymentCode}
              </p>
              <h3 className="font-semibold mt-2">Accounts:</h3>
              <ul className="list-disc pl-5">
                {rows.map((row, index) => (
                  <li key={index}>
                    {row.accountCode} - {row.particulars} - {row.amount}
                    {row.isExisting && " (Existing)"}
                    {!row.isExisting && " (New)"}
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-2">
                Total: {form.totalAmount.toFixed(2)}
              </p>
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
                disabled={mutation.isPending}
                className="px-4 py-2 rounded-lg bg-green-500 text-white"
              >
                {mutation.isPending ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionContainer>
  );
};

export default ReceiveEdit;