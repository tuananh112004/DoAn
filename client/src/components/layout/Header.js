import { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, Container, Form, Nav, NavDropdown, Row, Col } from "react-bootstrap";
import Apis, { endpoints } from "../../configs/Apis";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MyCartContext, MyUserContext } from "../../contexts/Contexts";

const Header = () => {
  const [categories, setCategories] = useState([]);
  const [cartCounter] = useContext(MyCartContext);
  const [user, dispatch] = useContext(MyUserContext);
  const [cartQty, setCartQty] = useState(0);
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  // Load categories for submenu
  useEffect(() => {
    const loadCates = async () => {
      try {
        const res = await Apis.get(endpoints["categories"]);
        setCategories(res.data?.data?.categories || []);
      } catch (_) {}
    };
    loadCates();
  }, []);

  // Sync mini cart quantity similar to pug `miniCart.totalQuantity`
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem("cart") || "{}");
    const qty = Object.values(local).reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    setCartQty(qty);
  }, [cartCounter]);

  // Initialize search keyword from URL
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setKeyword(q);
  }, [searchParams]);

  const onSearch = (e) => {
    e.preventDefault();
    const q = keyword.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };
  const handleLogout = async () => {
    try {
      await Apis.post(endpoints.logout, {}, { withCredentials: true });
      dispatch({ type: "logout" });
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <header className="py-3 border-bottom bg-white">
      <Container>
        <Row className="align-items-center">
          <Col md={3} xs={12} className="mb-2 mb-md-0">
            <div className="inner-logo">
              <Link to="/">
                <img src="/images/logo.jpg" alt="Logo" height={40} />
              </Link>
            </div>
          </Col>
          <Col md={5} xs={12} className="mb-2 mb-md-0">
            <Form onSubmit={onSearch}>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Nhập từ khóa..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button type="submit" className="ms-2">
                  Tìm
                </Button>
              </div>
            </Form>
          </Col>
          <Col md={4} xs={12}>
            <div className="d-flex justify-content-md-end align-items-center flex-wrap gap-3">
              <Nav>
                <Link to="/" className="nav-link px-2">
                  Trang chủ
                </Link>
                <NavDropdown title="Sản phẩm" id="nav-products">
                  {categories.map((c) => (
                    <Link
                      key={c._id || c.id}
                      to={`/products?cateId=${c._id || c.id}`}
                      className="dropdown-item"
                    >
                      {c.title || c.name}
                    </Link>
                  ))}
                </NavDropdown>
                <Link to="/cart" className="nav-link px-2 text-success">
                  Giỏ hàng <Badge bg="danger">{cartQty}</Badge>
                </Link>
                {user ? (
                  <>
                    <Link to="/user/info" className="nav-link px-2">
                      {user.fullName || user.username || "Tài khoản"}
                    </Link>
                    <Button size="sm" variant="outline-danger" onClick={handleLogout}>
                      Đăng xuất
                    </Button>
                    <Link to="/support" className="nav-link px-2">
                      Hỗ trợ khách hàng
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="nav-link px-2">
                      Đăng nhập
                    </Link>
                    <Link to="/register" className="nav-link px-2">
                      Đăng ký
                    </Link>
                  </>
                )}
              </Nav>
            </div>
          </Col>
        </Row>
      </Container>
    </header>
  );
};

export default Header;