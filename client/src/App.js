import { BrowserRouter, Route, Routes } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./components/pages/home/HomePage";
import ProductsPage from "./components/pages/products/ProductsPage";
import ProductDetailPage from "./components/pages/products/ProductDetailPage";
import CartPage from "./components/pages/cart/CartPage";
import CheckoutPage from "./components/pages/cart/CheckoutPage";
import CheckoutSuccessPage from "./components/pages/cart/CheckoutSuccessPage";
import LoginPage from "./components/pages/user/LoginPage";
import RegisterPage from "./components/pages/user/RegisterPage";
import SearchPage from "./components/pages/search/SearchPage";
import SupportChatPage from "./components/pages/chat/SupportChatPage";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container } from "react-bootstrap";
import { MyCartContext, MyUserContext } from "./contexts/Contexts";
import { useReducer } from "react";
import MyCartReducer from "./reducers/MyCartReducer";
import MyUserReducer from "./reducers/MyUserReducer";

const App = () => {
  let [cartCounter, cartDispatch] = useReducer(MyCartReducer, []);
  let [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={[user, dispatch]}>
      <MyCartContext.Provider value={[cartCounter, cartDispatch]}>
        <BrowserRouter>
          <Header />

          <Container fluid className="px-0">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success/:id" element={<CheckoutSuccessPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/support" element={<SupportChatPage />} />
            </Routes>
          </Container>

          <Footer />
        </BrowserRouter>
      </MyCartContext.Provider>
    </MyUserContext.Provider>
  );
}

export default App;
