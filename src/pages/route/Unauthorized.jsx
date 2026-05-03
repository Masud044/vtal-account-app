// src/pages/Unauthorized.jsx
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold text-red-500">403 — Access Denied</h1>
     
      <button
        onClick={() => navigate("/dashboard")}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
      >
        Go Back Dashboard 
      </button>
    </div>
  );
}