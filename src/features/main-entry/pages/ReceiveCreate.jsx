import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Select from "react-select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// import api from "@/api/Ap";
import { SectionContainer } from "@/components/SectionContainer";
import { ReceiveService } from "@/api/AccontingApi";
// import ReceiveTable from "../components/ReceiveTable";

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const url  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ReceiveCreate = () => {
   const navigate = useNavigate();
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
    },
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
    const res = await axios.get(`${url}/api/receive-code`);
    return res.data.success === true ? res.data.data || [] : [];
   
  },
});
  

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

  // Create Mutation
  const mutation = useMutation({
    mutationFn: async (payload) => {
      const res = await ReceiveService.insert(payload);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success("Voucher created successfully!");
        setForm({
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
        setRows([
          {
            id: "dummy",
            accountCode: "",
            particulars: "",
            amount: 0,
            debitId: null,
            creditId: null,
          },
        ]);
        queryClient.invalidateQueries(["unpostedVouchers"]);
        navigate("/dashboard/receive-voucher");
      } else {
        toast.error("Error processing voucher");
      }
    },
    onError: () => {
      toast.error("Error submitting voucher. Please try again.");
    },
    onSettled: () => {
      setShowModal(false);
    },
  });

  // Add Row Handler
  const addRow = () => {
    if (!form.accountId || !form.amount) return;

    const newRow = {
      id: Date.now(),
      accountCode: form.accountId,
      particulars: form.particular,
      amount: parseFloat(form.amount),
      debitId: null,
      creditId: null,
    };

    let updatedRows;
    if (rows.length === 1 && rows[0].id === "dummy") {
      updatedRows = [newRow];
    } else {
      updatedRows = [...rows, newRow];
    }

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

  // Remove Row Handler
  const removeRow = (id) => {
    const updatedRows = rows.filter((r) => r.id !== id);
    const total = updatedRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    setRows(updatedRows);
    setForm({ ...form, totalAmount: total });
  };

  // Submit Handler
  const handleSubmit = () => {
    if (
      !form.entryDate ||
      !form.glDate ||
      !form.description ||
      !form.ReceiveCode ||
      !form.customer ||
      rows.length === 0 ||
      rows[0].id === "dummy"
    ) {
      toast.error("Please fill all required fields and add at least one row.");
      return;
    }

    const invalidRow = rows.some((row) => !row.accountCode || !row.particulars);
    if (invalidRow) {
      toast.error("Each row must have Account Code and Particular filled.");
      return;
    }

    const payload = {
      trans_date: form.entryDate,
      gl_date: form.glDate,
      receive_desc: form.description,
      supporting: String(form.supporting),
      receive: form.ReceiveCode,
      supplierid: String(form.customer),
      totalAmount: Number(form.totalAmount),
      accountID: rows.map((r) => r.accountCode),
      amount2: rows.map((r) => Number(r.amount || 0)),
    };

    mutation.mutate(payload);
    console.log("=== PAYLOAD DEBUG ===", payload);
   
  };




  

  return (

    <SectionContainer>
    
      <div className="p-2 space-y-6 bg-white rounded-lg mt-4 shadow-md">
         <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-sm text-gray-800">
            Create Receive Voucher
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
            <div className="grid grid-cols-3 px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800 font-sans block ">
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
              <label className="font-bold text-sm text-gray-800 font-sans block">
                Entry Date
              </label>
              <input
                type="date"
                value={form.entryDate}
                onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans block">
                Invoice No
              </label>
              <input
                type="text"
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                disabled
                className="col-span-2 w-full border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  py-2 px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans block">
                No. of Supporting
              </label>
              <input
                type="number"
                value={form.supporting}
                onChange={(e) => setForm({ ...form, supporting: e.target.value })}
                className="border-collapse w-40 border rounded py-1 bg-white"
              />
            </div>

            <div className="grid grid-cols-3  py-2 px-3 items-center">
              <label className="font-bold text-sm text-gray-800 font-sans block">
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
              <label className="font-bold text-sm text-gray-800 font-sans block">
                Receive Code
              </label>
              <select
                value={form.ReceiveCode}
                onChange={(e) => setForm({ ...form, ReceiveCode: e.target.value })}
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

            <div className="grid grid-cols-3  px-3 items-center py-3">
              <label className="font-bold text-sm text-gray-800 font-sans block">
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
          <label className="font-bold text-sm text-gray-800 font-sans block mb-2 py-2 px-4 rounded-lg">
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
            <label className="font-bold text-sm text-gray-800 font-sans block">
              Account ID
            </label>
            <Select
              options={accounts}
              className="col-span-2 border w-full rounded shadow-2xl"
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
            <label className="font-bold text-sm text-gray-800 font-sans block">
              Particular
            </label>
            <input
              type="text"
              value={form.particular}
              readOnly
              className="col-span-2 border w-full rounded py-1 bg-white"
            />
          </div>

          <div className="grid grid-cols-3 px-3 items-center py-3">
            <label className="font-bold text-sm text-gray-800 font-sans block">
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
              className=" cursor-pointer border px-3 py-1 rounded-lg flex items-center font-bold text-sm text-gray-800 font-sans "
            >
              <span className="mr-1 font-extrabold">+</span>Add
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full border-collapse  rounded-lg text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 md:px-4 py-2 text-center font-bold text-sm text-gray-800 font-sans ">
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
                  <td className="border px-2 md:px-4 py-2 break-words">
                    {row.accountCode}
                  </td>
                  <td className="border px-2 md:px-4 py-2 break-words">
                    {row.particulars}
                  </td>
                  <td className="border px-2 md:px-4 py-2 text-center">
                    {Number(row.amount).toFixed(2)}
                  </td>
                  <td className="border px-2 md:px-4 py-2 text-center">
                    {row.id !== "dummy" && (
                      <Button type="button" onClick={() => removeRow(row.id)}>
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5 " />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {rows.length > 0 && rows[0].id !== "dummy" && (
                <tr className="font-semibold">
                  <td colSpan="2" className="p-2 text-right font-bold text-sm text-gray-800 font-sans">
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

        <div className="flex flex-col md:flex-row justify-end gap-4">
            
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={mutation.isPending}
            // className="bg-green-500 cursor-pointer text-white px-12 py-2 rounded-lg"
          >
            {mutation.isPending ? "Submitting..." : "Create"}
          </Button>
        </div>

        
        
      </div>

      

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Voucher Submission</h2>
            <div className="space-y-2">
              <p><strong>Entry Date:</strong> {form.entryDate}</p>
              <p><strong>No. of Supporting:</strong> {form.supporting}</p>
              <p><strong>Description:</strong> {form.description}</p>
              <p>
                <strong>Customer:</strong>{" "}
                {customers.find((s) => s.CUSTOMER_ID === form.customer)?.CUSTOMER_NAME}
              </p>
              <p><strong>GL Date:</strong> {form.glDate}</p>
              <p><strong>Receive Code:</strong> {form.ReceiveCode}</p>
              <h3 className="font-semibold mt-2">Accounts:</h3>
              <ul className="list-disc pl-5">
                {rows.map((row, index) => (
                  row.id !== "dummy" && (
                    <li key={index}>
                      {row.accountCode} - {row.particulars} - {row.amount}
                    </li>
                  )
                ))}
              </ul>
              <p className="font-semibold mt-2">Total: {form.totalAmount.toFixed(2)}</p>
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
                {mutation.isPending ? "Submitting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
   
  
  </SectionContainer>
  );
};

export default ReceiveCreate;