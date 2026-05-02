import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import Select from "react-select";

import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// import api from "../../../api/Api";

// import PageTitle from "../../RouteTitle";


// import { SectionContainer } from "../../SectionContainer";
// import JournalVoucherListTwo from "./JournalVoucherListTwo";
import { toast } from "react-toastify";
// import api from "@/api/Ap";

import { SectionContainer } from "@/components/SectionContainer";
import JournalTable from "../components/JournalTable";
import axios from "axios";
import { Button } from "@/components/ui/button";

const url  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const Journal = () => {
  const { voucherId } = useParams();

  useEffect(() => {
  window.scrollTo({
    top: 80,
    behavior: "smooth",
  });
}, [voucherId]);

  const queryClient = useQueryClient();

  console.log(voucherId);
  const today = new Date().toISOString().split("T")[0];

  const [rows, setRows] = useState([
    {
      id: "dummy", // dummy row id
      accountCode: "",
      particulars: "",

      debitId: null,
      creditId: null,
    },
  ]);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    entryDate: today,
   
    supporting: "",
    description: "",
   
    glDate: today,
    
    accountId: "",
    particular: "",
   
   
  });

 

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      // const res = await api.get("/gl_account_code.php");
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

  // ---------- FETCH VOUCHER IF EDIT ----------
  const { data: voucherData } = useQuery({
    queryKey: ["voucher", voucherId],
    queryFn: async () => {
      // const res = await api.get(`/GL_VIEW.php?insertID=${voucherId}`);
      const res = await axios.get(`${url}/api/gl-view?insertID=${voucherId}`);
      return res.data;
    },
    enabled: !!voucherId && accounts.length > 0,
  });
  console.log(voucherData);

  useEffect(() => {
  if (!voucherId || !voucherData || accounts.length === 0) return;
  if (voucherData.status !== "success") return;

  const master = voucherData.master || {};
  const details = voucherData.details || [];

  // --- Map details with correct keys ---
  const mappedRows = details.map((d, i) => {
    const account = accounts.find(acc => acc.value === d.CODE);
    return {
      id: d.ID || `${d.CODE}-${i}`,
      detail_id: d.ID,
      accountCode: d.CODE,
      particulars: account ? account.label : d.DESCRIPTION || "",
      debit: parseFloat(d.DEBIT) || 0,
      credit: parseFloat(d.CREDIT) || 0,
    }
  });

  setRows(mappedRows);

  setForm({
    entryDate: master.TRANS_DATE
      ? new Date(master.TRANS_DATE).toISOString().split("T")[0]
      : today,
    glDate: master.GL_ENTRY_DATE
      ? new Date(master.GL_ENTRY_DATE).toISOString().split("T")[0]
      : today,
    supporting: master.SUPPORTING || "",
    description: master.DESCRIPTION || "",
    // accountId: mappedRows[0]?.accountCode || "",
    // particular: mappedRows[0]?.particulars,
  });
}, [voucherData, accounts, voucherId]);


  // ---------- MUTATION ----------
  // const mutation = useMutation({
  //   mutationFn: async ({ isNew, payload }) => {
  //     const apiUrl = isNew ? `${url}/api/gl-add` : `${url}/api/gl-edit`;
  //     const res = await axios.post(apiUrl, payload);
  //     return res.data;
  //   },
  //   onSuccess: (data, variables) => {
  //     if (data.status === "success") {
  //       toast.success(
  //         variables.isNew
  //           ? "Journal-Voucher created successfully!"
  //           : "Journal-Voucher updated successfully!"
  //       );
  //       setForm({
  //         entryDate: today,
         
  //         supporting: "",
  //         description: "",
        
  //         glDate: today,
         
  //         accountId: "",
  //         particular: "",
          
  //       });
  //       setRows([
      
  //   ]);
  //       queryClient.invalidateQueries(["unpostedVouchers"]);
  //     } else {
  //       toast.error("Error processing voucher.");
  //     }
  //     setShowModal(false);
  //   },
  //   onError: () => {
  //     toast.error("Error submitting voucher. Please try again.");
  //     setShowModal(false);
  //   },
  // });

  const mutation = useMutation({
  mutationFn: async ({ isNew, payload }) => {
    const apiUrl = isNew ? `${url}/api/gl-add` : `${url}/api/gl-edit`;
    console.log("PAYLOAD:", JSON.stringify(payload, null, 2));
    const res = await axios.post(apiUrl, payload);
    console.log("RESPONSE:", res.data);
    return res.data;
  },
  onSuccess: (data, variables) => {
    if (data.status === "success") {
      toast.success(variables.isNew ? "Created!" : "Updated!");
      // ✅ form & rows reset
      setForm({
        entryDate: today,
        supporting: "",
        description: "",
        glDate: today,
        accountId: "",
        particular: "",
      });
      setRows([{ id: "dummy", accountCode: "", particulars: "", debitId: null, creditId: null }]);
      queryClient.invalidateQueries(["unpostedVouchers"]);
    } else {
      toast.error(data.message || "Error processing voucher."); // ✅ actual message দেখাবে
    }
    setShowModal(false);
  },
  onError: (err) => {
    console.error("Error:", err.response?.data || err.message);
    toast.error(err.response?.data?.message || "Server error. Please try again.");
    setShowModal(false);
  },
});

  // ---------- HANDLERS ----------
 const addRow = () => {
  if (!form.accountId) return;

  const newRow = {
    id: Date.now() + Math.random(), // unique id
    detail_id: null,                // null for new rows
    accountCode: form.accountId,
    particulars: form.particular,
    debit: 0,
    credit: 0,
    
  };

  let updatedRows;
  if (rows.length === 1 && rows[0].id === "dummy") {
    updatedRows = [newRow];
  } else {
    updatedRows = [...rows, newRow];
  }

  setRows(updatedRows);
  setForm({ ...form, accountId: "", particular: "" });
};


  // ---------- HANDLE CHANGE ----------
  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
              ...(field === "debit" && value
                ? { credit: "" } // if debit has value, clear credit
                : field === "credit" && value
                ? { debit: "" } // if credit has value, clear debit
                : {}),
            }
          : row
      )
    );
  };

  // ---------- CALCULATE TOTAL ----------
  const debitTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.debit) || 0),
    0
  );
  const creditTotal = rows.reduce(
    (sum, r) => sum + (parseFloat(r.credit) || 0),
    0
  );

  const handleSubmit = () => {
  setMessage("");
  const isNew = !voucherId;

  if (!form.entryDate || !form.glDate || !form.description || rows.length === 0) {
    toast.error("Please fill all required fields and add at least one row.");
    return;
  }
  const invalidRow = rows.some(
    (row) =>
      !row.accountCode || !row.particulars
  );

  if (invalidRow) {
    toast.error("Each row must have Account Code, Particular filled.");
    return;
  }


  if (debitTotal !== creditTotal) {
    toast.error("Debit and Credit totals must be equal before submission.");
    return;
  }

  const payload = isNew
  ? {
      trans_date: form.entryDate,
      GL_ENTRY_DATE: form.glDate,
      receive_desc: form.description,
      supporting: String(form.supporting || "0"),
      details: rows.map((r) => ({
        code: `${r.accountCode}##${r.particulars}`,
        debit: parseFloat(r.debit) || 0,
        credit: parseFloat(r.credit) || 0,
        description: r.particulars,
      })),
    }
  : {
      master_id: voucherId,
      trans_date: form.entryDate,
      gl_entry_date: form.glDate,
      receive_desc: form.description,
      supporting: String(form.supporting || "0"),
      details: rows.map((r) => ({
        id: r.detail_id || r.id, // only for existing rows
        debit: parseFloat(r.debit) || 0,
        credit: parseFloat(r.credit) || 0,
      })),
    };


  
  mutation.mutate({ isNew, payload });
};






  return (
    <SectionContainer>
       <div className="">
      {/* <h2 className="text-xl font-semibold text-gray-700 bg-green-200 rounded-lg px-4 mb-2 py-2">
        Payment Voucher
      </h2> */}
      {/* <PageTitle></PageTitle> */}

      {/* Top Form */}
      <div className=" p-6 space-y-6 bg-white rounded-lg shadow-md">
        {message && (
          <p className="text-center text-red-600 font-medium mt-2 mb-2">
            {message}
          </p>
        )}

        {/* Save button aligned right */}

        <div className="md:flex justify-between gap-10  bg-white  rounded-lg">
          {/* bill system */}
          <div className=" bg-gray-200 border-black">
            <h1 className=" text-center py-10 px-12">this is bill</h1>
          </div>
          
          {/* all input payment field */}
          <div className="">
            {/* Entry Date */}
            <div className="grid grid-cols-3 font-sans   px-3 items-center py-2">
              <label className="font-semibold text-gray-700 font-sans block text-sm  ">
                Entry Date
              </label>
              <input
                type="date"
                value={form.entryDate}
                onChange={(e) =>
                  setForm({ ...form, entryDate: e.target.value })
                }
                className="col-span-2 w-full border  rounded py-1   bg-white "
              />
            </div>
           
            {/* Supporting */}
            <div className="grid grid-cols-3 font-sans py-2  px-3 items-center ">
              <label className="font-semibold text-gray-700 block text-sm  ">
                No. of Supporting
              </label>
              <input
                type="number"
                value={form.supporting}
                onChange={(e) =>
                  setForm({ ...form, supporting: e.target.value })
                }
                className="col-span-2 w-40 border rounded py-1   bg-white "
              />
            </div>
            <div className="grid grid-cols-3 font-sans  py-2  px-3 items-center">
              <label className="font-semibold text-gray-700 font-sans  block text-sm ">
                GL Date
              </label>
              <input
                type="date"
                value={form.glDate}
                onChange={(e) => setForm({ ...form, glDate: e.target.value })}
                className="col-span-2 w-full border rounded py-1  bg-white "
              />
            </div>
          
          </div>
        </div>

        <div className="mt-4 mb-4 bg-white font-sans">
          <label className="block text-sm font-semibold  text-gray-700  mb-2  py-2 px-4 rounded-lg">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full mt-1 border rounded-lg px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr_2fr_1fr]  gap-4 rounded-lg justify-center items-center ">
          <div className="grid grid-cols-3  px-3 items-center  py-1">
            <label className="font-semibold font-sans text-gray-700 block text-sm  ">
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
          <div className="grid grid-cols-3    px-3 items-center py-3">
            <label className="font-semibold font-sans text-gray-700 block text-sm  ">
              Particular
            </label>
            <input
              type="text"
              value={form.particular}
              readOnly
              className="col-span-2 border w-full rounded py-1  bg-white"
            />
          </div>
         
          <div className="px-4 py-2">
            <button
              type="button"
              onClick={addRow}
              className="  font-semibold font-sans text-gray-700 cursor-pointer border px-3 py-1 rounded-lg flex items-center text-sm"
            >
              <span className="mr-1 font-extrabold ">+</span>Add
            </button>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse  rounded-lg overflow-x-auto">
          <thead>
            <tr>
              <th className="px-4 py-2 w-[20%] text-center font-semibold font-sans text-gray-700  text-sm ">
                Account Code
              </th>
              <th className="px-4 py-2 w-[35%] text-center font-semibold font-sans text-gray-700  text-sm ">
                Particulars
              </th>
              <th className="px-4 py-2 w-[10%] text-center font-semibold font-sans text-gray-700  text-sm ">
                Debit
              </th>
              <th className="px-4 py-2 w-[10%]  text-center font-semibold font-sans text-gray-700  text-sm ">
                credit
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border">
                <td className="border px-4 py-2">{row.accountCode}</td>
                <td className="border px-4 py-2">{row.particulars}</td>
                <td className="border p-2">
                  {row.credit > 0 ? (
                    // 🔒 যদি disable হয় → শুধু value দেখাবে
                    <span className="block w-full text-center text-gray-700">
                      {row.debit || 0}
                    </span>
                  ) : (
                    // ✏️ অন্যথায় input দেখাবে
                    <input
                      type="number"
                      value={row.debit || ""}
                      onChange={(e) =>
                        handleRowChange(row.id, "debit", e.target.value)
                      }
                      className="w-full border-none outline-none bg-transparent text-center"
                    />
                  )}
                </td>

                <td className="border p-2">
                  {row.debit > 0 ? (
                    <span className="block w-full text-center text-gray-700">
                      {row.credit || 0}
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={row.credit || ""}
                      onChange={(e) =>
                        handleRowChange(row.id, "credit", e.target.value)
                      }
                      className="w-full border-none outline-none bg-transparent text-center"
                    />
                  )}
                </td>
              </tr>
            ))}

            {/* --- Summary Rows --- */}

            {rows.length > 0 && (
              <tr className="font-semibold">
                <td colSpan="2" className="text-right text-sm p-2">
                  Total
                </td>
                <td className="border text-sm text-center p-2">
                  {debitTotal.toFixed(2)}
                </td>
                <td className="border text-sm text-center p-2">
                  {creditTotal.toFixed(2)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

  

        <div className="flex justify-end items-center gap-10 mb-4">
         
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            // className="bg-green-500 cursor-pointer text-white px-12 py-2 rounded-lg"
          >
            {mutation.isPending
              ? "Submitting..."
              : voucherId
              ? "Update"
              : "Save"}
          </Button>
        </div>
      </div>
    <JournalTable></JournalTable>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0  bg-black flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              Confirm Voucher Submission
            </h2>

            <div className="space-y-2">
              <p>
                <strong>Entry Date:</strong> {form.entryDate}
              </p>

              <p>
                <strong>No. of Supporting:</strong> {form.supporting}
              </p>
              <p>
                <strong>Description:</strong> {form.description}
              </p>

              <p>
                <strong>GL Date:</strong> {form.glDate}
              </p>

              <h3 className="font-semibold mt-2">Accounts:</h3>
              <ul className="list-disc pl-5">
                {rows.map((row, r) => (
                  <li key={r}>
                    {row.accountCode} - {row.particulars} - Debit: {row.debit},
                    Credit: {row.credit}
                  </li>
                ))}
              </ul>

             
            </div>

            <div className="flex justify-end mt-4 space-x-3">
              <Button
                onClick={() => setShowModal(false)}
                // className="px-4 py-2 rounded-lg bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={mutation.isPending}
                // className="px-4 py-2 rounded-lg bg-green-500 text-white"
              >
                {mutation.isPending ? "Submitting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </SectionContainer>
  );
};

export default Journal;
