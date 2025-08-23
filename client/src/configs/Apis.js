import axios from "axios";
import cookie from "react-cookies";

// Keep single trailing slash only once even if endpoints start with '/'
const BASE_URL = "http://localhost:3000/api";

// Ensure cookies (cartId) are sent with API calls
axios.defaults.withCredentials = true;

export const endpoints = {
  categories: "/products/categories",
  products: "/products",
  register: "/user/register",
  login: "/user/login",
  profile: "/user/profile",
  cart: "/cart",
  checkout: "/checkout",
  logout: "/user/logout",
};

export const authApis = () =>
  axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${cookie.load("token")}`,
    },
  });

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

export default api;