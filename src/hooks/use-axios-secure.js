import axios from "axios";
import { useEffect, useRef } from "react";

import { useNavigate } from "react-router";
import { useAuth } from "@/context/auth-context";
// import { useAuthV2 as useAuth } from "@/features/authentication-v2/use-auth-v2";

const axiosSecure = axios.create({
  baseURL: "/api",
});

const useAxiosSecure = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const interceptorsSet = useRef(false);

  useEffect(() => {
    // Only set up interceptors once
    // if (interceptorsSet.current) return;
    // interceptorsSet.current = true;

    const requestInterceptor = axiosSecure.interceptors.request.use(
      (config) => {
        // ! don't remove
        // const token = localStorage.getItem("access-token");
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        config.headers.Authorization = "Bearer 123456";
        return config;
      }
    );

    const responseInterceptor = axiosSecure.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          // ! don't remove
          //   await logout();
          //   navigate("/login");
          console.log("Hello");
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function to eject interceptors
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptor);
      axiosSecure.interceptors.response.eject(responseInterceptor);
      interceptorsSet.current = false;
    };
  }, [logout, navigate]);

  return axiosSecure;
};

export default useAxiosSecure;
