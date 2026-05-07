import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { ToastContainer } from "react-toastify";

import Home from "./pages/Home";
import HomeLayout from "./layout/HomeLayout";
import Payment from "./features/main-entry/pages/Payment";
import Journal from "./features/main-entry/pages/Journal";
import Receive from "./features/main-entry/pages/Receive";
import CashTransfer from "./features/main-entry/pages/CashTransfer";
import DashboardHome from "./features/main-entry/pages/DashboardHome";
import ReceiveEdit from "./features/main-entry/pages/ReceiveEdit";
import ReceiveCreate from "./features/main-entry/pages/ReceiveCreate";
import InventoriesPage from "./features/inventory-page/inventory";
import ItemStockPage from "./features/inventory-page/item-stock";
import ItemsPage from "./features/inventory-page/item";
import Requisitions from "./features/inventory-page/requisition-master";
import ChartOfAccountPage from "./features/main-entry/chart-account";
import LoginV2 from "./features/authentication-v2/index";
import RegisterV2 from "./features/authentication-v2/register-index";
import ProtectedRoute from "./pages/route/ProtectedRoute";
import UnauthorizedPage from "./pages/route/Unauthorized";

import { useAuthV2 } from "./features/authentication-v2/use-auth-v2";
import WelcomePage from "./pages/welcomePage";
import Grades from "./features/user-management";
import Roles from "./features/users/role";
import Permissions from "./features/users/permission";
import Modules from "./features/users/module";
import { NuqsAdapter } from "nuqs/adapters/react";
import UserDetailsPage from "./features/user-management/user-details";
import SupplierPage from "./features/supplier";
import CustomerPage from "./features/customer";
import JournalCreate from "./features/main-entry/pages/JournalCreate";
import JournalEdit from "./features/main-entry/pages/JournalEdit";
import PaymentCreate from "./features/main-entry/pages/PaymentCreate";
import PaymentEdit from "./features/main-entry/pages/PaymentEdit";
import CashTransferCreate from "./features/main-entry/pages/CashTransferCreate";

const ADMIN = ["Admin"];
const ADMIN_INVENTORY = ["Admin", "Inventory"];

// ── Dashboard Index — role অনুযায়ী redirect ──────────────────────────────────
const DashboardIndex = () => {
  const { user, isLoading } = useAuthV2();
  if (isLoading) return null;

  if (user?.roles?.includes("Admin")) {
    return <DashboardHome />; // Admin → DashboardHome
  }
  return <Navigate to="/dashboard/welcome" replace />; // Inventory → WelcomePage
};

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <NuqsAdapter>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginV2 />} />
            <Route path="/register" element={<RegisterV2 />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Layout — Admin + Inventory */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute anyRole={ADMIN_INVENTORY}>
                  <HomeLayout />
                </ProtectedRoute>
              }
            >
              {/* ✅ Index — role অনুযায়ী DashboardHome বা Welcome */}
              <Route index element={<DashboardIndex />} />

              {/* Inventory welcome page */}
              <Route path="welcome" element={<WelcomePage />} />

              {/* Admin + Inventory উভয়ই */}
              <Route path="inventory" element={<InventoriesPage />} />
              <Route path="item-stock" element={<ItemStockPage />} />
              <Route path="item" element={<ItemsPage />} />
              <Route path="dispatch" element={<Requisitions />} />

              {/* admin only- user management */}
              <Route
                path="user-management"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Grades />
                  </ProtectedRoute>
                }
              />

              <Route
                path="user-management/users/:id"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <UserDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="role"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Roles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="module"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Modules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="permission"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Permissions />
                  </ProtectedRoute>
                }
              />

              {/* Admin only -main entry */}
              <Route
                path="payment-voucher"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payment-create"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <PaymentCreate />
                  </ProtectedRoute>
                }
              />

               <Route
                path="payment-edit/:voucherId"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <PaymentEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="journal-voucher"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Journal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="journal-create"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <JournalCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="journal-edit/:voucherId"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <JournalEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="receive-voucher"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <Receive />
                  </ProtectedRoute>
                }
              />
              <Route
                path="receive-create"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <ReceiveCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="receive-edit/:voucherId"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <ReceiveEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cash-transfer"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <CashTransfer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="cash-transfer-create"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <CashTransferCreate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="chart-account"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <ChartOfAccountPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="supplier"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <SupplierPage />
                  </ProtectedRoute>
                }
              />
               <Route
                path="customer"
                element={
                  <ProtectedRoute anyRole={ADMIN}>
                    <CustomerPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </Router>
      </NuqsAdapter>
    </>
  );
}

export default App;
