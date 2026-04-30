
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import './App.css'
import Home from "./pages/Home";


import HomeLayout from "./layout/HomeLayout";

import { ToastContainer } from 'react-toastify';

import { AuthProvider } from "./authentication/AuthProvaider";
import Login from "./pages/Login";
import Register from "./pages/Register";
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


function App() {
 
  return (
    <AuthProvider>
     <ToastContainer position="top-right" autoClose={3000} />
       <Router>
        <Routes>
            <Route path="/" element={<Home></Home>} />
            <Route path="/dashboard" element={<HomeLayout />}> 
             <Route index element={<DashboardHome />} />
             <Route path="payment-voucher" element={<Payment />} />
            <Route
              path="payment-voucher/:voucherId"
              element={<Payment />}
            />
            <Route path="journal-voucher" element={<Journal />} />
            <Route path="journal-voucher/:voucherId" element={<Journal />} />

            <Route path="receive-voucher" element={<Receive />} />
          
            
               <Route path="receive-create" element={<ReceiveCreate />} />
               <Route path="receive-edit/:voucherId" element={<ReceiveEdit />} />

                <Route path="chart-voucher" element={<ChartOfAccountPage />} />
               
            <Route path="cash-voucher" element={<CashTransfer />} />
            <Route path="cash-voucher/:voucherID" element={<CashTransfer />} />
             <Route path="chart-account" element={<ChartOfAccountPage/>} />

             // inventory route
             <Route path="inventory" element={<InventoriesPage />} />
              <Route path="item-stock" element={<ItemStockPage />} />
               <Route path="item" element={<ItemsPage />} />
                <Route path="dispatch" element={<Requisitions/>} />
                
                
            
            
            
            </Route>
             <Route path="/login" element={<Login></Login>} />
          <Route path="/register" element={<Register></Register>} />
        </Routes>

       </Router>
    </AuthProvider>

    
  )
}

export default App
