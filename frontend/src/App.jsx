import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  // ============================================================
  // BASIC STATE
  // ============================================================

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_user")) || null;
    } catch {
      return null;
    }
  });

  // ============================================================
  // AUTH MODALS
  // ============================================================

  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ============================================================
  // PROFILE
  // ============================================================

  const [showProfile, setShowProfile] = useState(false);

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // ============================================================
  // ADDRESSES
  // ============================================================

  const [showAddresses, setShowAddresses] = useState(false);
  const [addresses, setAddresses] = useState([]);

  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // ============================================================
  // AI SUPPORT
  // ============================================================

  const [supportQuestion, setSupportQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // ============================================================
  // PRODUCT / UI
  // ============================================================

  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // WISHLIST
  // ============================================================

  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("shopsphere_wishlist")) || [];
    } catch {
      return [];
    }
  });

  // ============================================================
  // PAYMENT / CHECKOUT
  // ============================================================

  const [showCheckout, setShowCheckout] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");

  const [upiId, setUpiId] = useState("");

  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  const [processingPayment, setProcessingPayment] = useState(false);

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);

  // ============================================================
  // USER EFFECT
  // ============================================================

  useEffect(() => {
    if (!user) {
      setCart([]);
      setOrders([]);
      setAddresses([]);
      return;
    }

    loadCart();
    loadOrders();
    loadAddresses();

    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // ============================================================
  // SAVE WISHLIST
  // ============================================================

  useEffect(() => {
    localStorage.setItem(
      "shopsphere_wishlist",
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  // ============================================================
  // PRODUCTS
  // ============================================================

  const loadProducts = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/products/`);

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Products error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CART
  // ============================================================

  const loadCart = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API}/cart/${user.id}`);

      if (!response.ok) {
        throw new Error("Unable to load cart");
      }

      const data = await response.json();

      setCart(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Cart error:", error);
      setCart([]);
    }
  };

  const addToCart = async (productId) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      const response = await fetch(
        `${API}/cart/?user_id=${user.id}&product_id=${productId}&quantity=1`,
        {
          method: "POST",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to add product to cart");
      }

      await loadCart();

      alert("Product added to cart!");
    } catch (error) {
      console.error("Add cart error:", error);
      alert(error.message || "Unable to add product to cart.");
    }
  };

  const updateCartQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/cart/${itemId}?quantity=${quantity}`,
        {
          method: "PUT",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to update quantity");
      }

      await loadCart();
    } catch (error) {
      console.error("Quantity update error:", error);
      alert(error.message || "Unable to update quantity.");
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await fetch(`${API}/cart/${itemId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to remove item");
      }

      await loadCart();
    } catch (error) {
      console.error("Remove cart error:", error);
      alert(error.message || "Unable to remove item.");
    }
  };

  // ============================================================
  // ORDERS
  // ============================================================

  const loadOrders = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API}/orders/user/${user.id}`);

      if (!response.ok) {
        throw new Error("Unable to load orders");
      }

      const data = await response.json();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Orders error:", error);
      setOrders([]);
    }
  };

  const cancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "cancelled",
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to cancel order");
      }

      await loadOrders();

      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Cancel order error:", error);
      alert(error.message || "Unable to cancel order.");
    }
  };

  const deleteOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/orders/${orderId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Unable to delete order");
      }

      await loadOrders();

      alert("Order deleted successfully.");
    } catch (error) {
      console.error("Delete order error:", error);
      alert(error.message || "Unable to delete order.");
    }
  };

  // ============================================================
  // ORDER DATE HELPERS
  // ============================================================

  const getOrderDate = (order) => {
    return order?.order_date || "Date unavailable";
  };

  const getExpectedDeliveryDate = (order) => {
    return order?.expected_delivery || "Date unavailable";
  };

  // ============================================================
  // CHECKOUT - OPEN PAYMENT MODAL
  // ============================================================

const checkout = () => {
  if (!user) {
    alert("Please login before checkout.");
    setShowLogin(true);
    return;
  }

  if (!cart || cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  if (!addresses || addresses.length === 0) {
    alert("Please add a delivery address before checkout.");
    setShowAddresses(true);
    return;
  }

  const defaultAddress = addresses.find(
    (address) => address.is_default
  );

  if (!defaultAddress) {
    alert("Please set a default delivery address before checkout.");
    setShowAddresses(true);
    return;
  }

  setPaymentMethod("");
  setUpiId("");

  setCardDetails({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  setShowCheckout(true);
};

  // ============================================================
  // PLACE ORDER
  // ============================================================

  const placeOrder = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!cart.length) {
      alert("Your cart is empty.");
      return;
    }

    const defaultAddress = addresses.find(
      (address) => address.is_default
    );

    if (!defaultAddress) {
      alert(
        "Please set a default delivery address before checkout."
      );
      setShowCheckout(false);
      openAddresses();
      return;
    }

    // ----------------------------------------------------------
    // PAYMENT METHOD VALIDATION
    // ----------------------------------------------------------

    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    // ----------------------------------------------------------
    // UPI VALIDATION
    // ----------------------------------------------------------

    if (paymentMethod === "UPI") {
      const trimmedUpi = upiId.trim();

      if (!trimmedUpi) {
        alert("Please enter your UPI ID.");
        return;
      }

      if (!trimmedUpi.includes("@")) {
        alert("Please enter a valid UPI ID. Example: name@upi");
        return;
      }
    }

    // ----------------------------------------------------------
    // CARD VALIDATION
    // ----------------------------------------------------------

    if (paymentMethod === "CARD") {
      const cardNumber = cardDetails.cardNumber.replace(/\s/g, "");

      if (!/^\d{16}$/.test(cardNumber)) {
        alert("Please enter a valid 16-digit card number.");
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
        alert("Please enter expiry in MM/YY format.");
        return;
      }

      if (!/^\d{3}$/.test(cardDetails.cvv)) {
        alert("Please enter a valid 3-digit CVV.");
        return;
      }

      if (!cardDetails.name.trim()) {
        alert("Please enter the card holder name.");
        return;
      }
    }

    // ----------------------------------------------------------
    // PROCESS PAYMENT / ORDER
    // ----------------------------------------------------------

    try {
      setProcessingPayment(true);

      const url =
        `${API}/orders/checkout/${user.id}` +
        `?address_id=${defaultAddress.id}` +
        `&payment_method=${encodeURIComponent(paymentMethod)}`;

      const response = await fetch(url, {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Checkout failed"
        );
      }

      // Close checkout
      setShowCheckout(false);

      // Reset payment fields
      setPaymentMethod("");
      setUpiId("");

      setCardDetails({
        cardNumber: "",
        expiry: "",
        cvv: "",
        name: "",
      });

      await loadCart();
      await loadOrders();

      alert(
        paymentMethod === "COD"
          ? "Order placed successfully! Cash on Delivery selected."
          : "Payment successful! Order placed successfully."
      );

      scrollToSection("orders");
    } catch (error) {
      console.error("Checkout error:", error);

      alert(
        error.message ||
          "Unable to place order. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // ============================================================
  // AUTH - LOGIN
  // ============================================================

  const login = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Login failed"
        );
      }

      localStorage.setItem(
        "shopsphere_user",
        JSON.stringify(data)
      );

      setUser(data);

      setLoginData({
        email: "",
        password: "",
      });

      setShowLogin(false);

      alert("Login successful!");
    } catch (error) {
      console.error("Login error:", error);

      alert(
        error.message || "Unable to login."
      );
    }
  };

  // ============================================================
  // AUTH - REGISTER
  // ============================================================

  const register = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Registration failed"
        );
      }

      setRegisterData({
        name: "",
        email: "",
        password: "",
      });

      setShowRegister(false);
      setShowLogin(true);

      alert(
        "Registration successful! Please login."
      );
    } catch (error) {
      console.error("Register error:", error);

      alert(
        error.message || "Unable to register."
      );
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem("shopsphere_user");

    setUser(null);
    setCart([]);
    setOrders([]);
    setAddresses([]);

    setShowProfile(false);
    setShowAddresses(false);
    setShowCheckout(false);

    alert("Logged out successfully.");
  };

  // ============================================================
  // PROFILE
  // ============================================================

  const openProfile = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      const response = await fetch(
        `${API}/users/${user.id}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load profile"
        );
      }

      setProfileData({
        name: data?.name || "",
        email: data?.email || "",
        phone: data?.phone || "",
        address: data?.address || "",
        city: data?.city || "",
        state: data?.state || "",
        pincode: data?.pincode || "",
      });

      setEditingProfile(false);
      setShowProfile(true);
    } catch (error) {
      console.error("Profile error:", error);

      alert(
        error.message || "Unable to load profile."
      );
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${API}/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update profile"
        );
      }

      const updatedUser = {
        ...user,
        ...data,
      };

      localStorage.setItem(
        "shopsphere_user",
        JSON.stringify(updatedUser)
      );

      setUser(updatedUser);
      setEditingProfile(false);

      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Save profile error:", error);

      alert(
        error.message || "Unable to update profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================================
  // ADDRESSES
  // ============================================================

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API}/addresses/${user.id}`
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to load addresses"
        );
      }

      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Addresses error:", error);
      setAddresses([]);
    }
  };

  const openAddresses = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    await loadAddresses();

    setEditingAddress(null);

    setAddressForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });

    setShowAddresses(true);
  };

  const resetAddressForm = () => {
    setEditingAddress(null);

    setAddressForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const saveAddress = async (event) => {
    event.preventDefault();

    if (!user) return;

    try {
      setSavingAddress(true);

      let response;

      if (editingAddress) {
        response = await fetch(
          `${API}/addresses/${editingAddress}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(addressForm),
          }
        );
      } else {
        response = await fetch(
          `${API}/addresses/${user.id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(addressForm),
          }
        );
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to save address"
        );
      }

      await loadAddresses();

      resetAddressForm();

      alert(
        editingAddress
          ? "Address updated successfully."
          : "Address added successfully."
      );
    } catch (error) {
      console.error("Save address error:", error);

      alert(
        error.message || "Unable to save address."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  const editAddress = (address) => {
    setEditingAddress(address.id);

    setAddressForm({
      name: address.name || "",
      phone: address.phone || "",
      address: address.address || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });
  };

  const deleteAddress = async (addressId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this address?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/addresses/${addressId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to delete address"
        );
      }

      await loadAddresses();

      alert("Address deleted successfully.");
    } catch (error) {
      console.error("Delete address error:", error);

      alert(
        error.message || "Unable to delete address."
      );
    }
  };

  const setDefaultAddress = async (addressId) => {
    try {
      const response = await fetch(
        `${API}/addresses/${addressId}/default`,
        {
          method: "PUT",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to set default address"
        );
      }

      await loadAddresses();

      alert("Default address updated.");
    } catch (error) {
      console.error("Default address error:", error);

      alert(
        error.message ||
          "Unable to set default address."
      );
    }
  };

  // ============================================================
  // AI SUPPORT
  // ============================================================

  const askAI = async () => {
    if (!supportQuestion.trim()) {
      alert("Please enter your question.");
      return;
    }

    try {
      setLoadingAI(true);
      setAiResponse("");

      const response = await fetch(
        `${API}/support/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: supportQuestion,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to get AI response"
        );
      }

      setAiResponse(
        data?.response ||
          data?.answer ||
          data?.message ||
          "No response received."
      );
    } catch (error) {
      console.error("AI support error:", error);

      setAiResponse(
        error.message ||
          "Unable to get AI response."
      );
    } finally {
      setLoadingAI(false);
    }
  };

  // ============================================================
  // WISHLIST
  // ============================================================

  const toggleWishlist = (productId) => {
    setWishlist((previous) => {
      if (previous.includes(productId)) {
        return previous.filter(
          (id) => id !== productId
        );
      }

      return [...previous, productId];
    });
  };

  // ============================================================
  // PRODUCT IMAGE
  // ============================================================

  const getProductImage = (product) => {
    if (
      product?.image_url &&
      typeof product.image_url === "string"
    ) {
      return product.image_url;
    }

    if (
      product?.image &&
      typeof product.image === "string"
    ) {
      return product.image;
    }

    if (
      product?.imageUrl &&
      typeof product.imageUrl === "string"
    ) {
      return product.imageUrl;
    }

    const keyword =
      `${product?.name || ""} ${product?.category || ""}`
        .toLowerCase();

    if (keyword.includes("headphone")) {
      return "https://loremflickr.com/500/400/wireless,headphones?lock=101";
    }

    if (keyword.includes("watch")) {
      return "https://loremflickr.com/500/400/smartwatch?lock=102";
    }

    if (keyword.includes("phone")) {
      return "https://loremflickr.com/500/400/smartphone?lock=103";
    }

    if (keyword.includes("laptop")) {
      return "https://loremflickr.com/500/400/laptop?lock=104";
    }

    if (keyword.includes("shoe")) {
      return "https://loremflickr.com/500/400/shoes?lock=105";
    }

    if (keyword.includes("shirt")) {
      return "https://loremflickr.com/500/400/shirt?lock=106";
    }

    if (keyword.includes("beauty")) {
      return "https://loremflickr.com/500/400/cosmetics?lock=107";
    }

    if (keyword.includes("grocery")) {
      return "https://loremflickr.com/500/400/grocery?lock=108";
    }

    return "https://loremflickr.com/500/400/shopping,product?lock=999";
  };

  // ============================================================
  // CATEGORIES
  // ============================================================

  const categories = [
    "All",
    "Electronics",
    "Fashion",
    "Accessories",
    "Beauty",
    "Home",
    "Grocery",
  ];

  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filteredProducts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" ||
        product?.category?.toLowerCase() ===
          category.toLowerCase();

      const matchesSearch =
        !searchText ||
        product?.name
          ?.toLowerCase()
          .includes(searchText) ||
        product?.description
          ?.toLowerCase()
          .includes(searchText) ||
        product?.category
          ?.toLowerCase()
          .includes(searchText);

      return (
        matchesCategory &&
        matchesSearch
      );
    });
  }, [products, search, category]);

  // ============================================================
  // CART TOTAL
  // ============================================================

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price =
        Number(
          item?.product?.price ??
            item?.price ??
            0
        );

      const quantity =
        Number(item?.quantity || 0);

      return total + price * quantity;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item?.quantity || 0),
      0
    );
  }, [cart]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const scrollToSection = (sectionId) => {
    const element =
      document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // ============================================================
  // ORDER TRACKING
  // ============================================================

  const trackingSteps = [
    {
      key: "pending",
      label: "Order Placed",
    },
    {
      key: "confirmed",
      label: "Confirmed",
    },
    {
      key: "shipped",
      label: "Shipped",
    },
    {
      key: "out_for_delivery",
      label: "Out for Delivery",
    },
    {
      key: "delivered",
      label: "Delivered",
    },
  ];

  const getTrackingIndex = (status) => {
    if (status === "cancelled") {
      return -1;
    }

    const index = trackingSteps.findIndex(
      (step) => step.key === status
    );

    return index === -1 ? 0 : index;
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return "Your order has been placed and is waiting for confirmation.";

      case "confirmed":
        return "Your order has been confirmed and is being prepared.";

      case "shipped":
        return "Your order has been shipped.";

      case "out_for_delivery":
        return "Your order is out for delivery.";

      case "delivered":
        return "Your order has been delivered successfully.";

      case "cancelled":
        return "This order has been cancelled.";

      default:
        return "Order status unavailable.";
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="app">
      {/* ======================================================
          SIDEBAR NAVIGATION
      ====================================================== */}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "240px",
          zIndex: 1000,
          background: "#ffffff",
          borderRight: "1px solid #eeeeee",
          boxShadow: "4px 0 18px rgba(0,0,0,0.05)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          type="button"
          onClick={() => scrollToSection("home")}
          style={{
            border: "none",
            background: "transparent",
            padding: "8px 10px 28px",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#ff6b00",
            }}
          >
            Shop<span style={{ color: "#ff4f9a" }}>Sphere</span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#888",
              marginTop: "4px",
            }}
          >
            Smart. Simple. Shopping.
          </div>
        </button>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {[
            ["Home", "home", "⌂"],
            ["Products", "products", "🛍️"],
            ["Cart", "cart", "🛒"],
            ["AI Support", "support", "🤖"],
            ["Orders", "orders", "📦"],
          ].map(([label, section, icon]) => (
            <button
              key={section}
              type="button"
              onClick={() => scrollToSection(section)}
              className="nav-btn"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid transparent",
                background: "transparent",
                color: "#444",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              <span style={{ width: "22px", textAlign: "center" }}>{icon}</span>
              <span>{label}</span>
              {section === "cart" && cartCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#ff6b00",
                    color: "#fff",
                    borderRadius: "20px",
                    minWidth: "22px",
                    padding: "2px 6px",
                    fontSize: "11px",
                    textAlign: "center",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "18px",
            borderTop: "1px solid #eeeeee",
          }}
        >
          {user && (
            <div
              style={{
                padding: "10px 12px 14px",
                color: "#555",
                fontSize: "13px",
              }}
            >
              <div style={{ fontWeight: "700", color: "#222" }}>
                Hi, {user.name || "User"}
              </div>
              <div style={{ marginTop: "3px", color: "#999" }}>
                Welcome back!
              </div>
            </div>
          )}

          <button
            type="button"
            className="secondary-btn"
            onClick={openProfile}
            style={{ width: "100%", marginBottom: "8px" }}
          >
            My Profile
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={openAddresses}
            style={{ width: "100%", marginBottom: "8px" }}
          >
            My Addresses
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={logout}
            style={{ width: "100%" }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main
        style={{
          marginLeft: "240px",
          minHeight: "100vh",
        }}
      >

      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        id="home"
        style={{
          padding: "70px 30px",
          background:
            "linear-gradient(135deg, #fff7f0, #ffffff)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            marginBottom: "15px",
            color: "#222",
          }}
        >
          Welcome to{" "}
          <span style={{ color: "#ff6b00" }}>
            ShopSphere
          </span>
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#666",
            maxWidth: "700px",
            margin: "0 auto 30px",
          }}
        >
          Shop your favorite products, manage
          your orders, get AI-powered support,
          and enjoy a simple online shopping
          experience.
        </p>

        <button
          className="primary-btn"
          onClick={() =>
            scrollToSection("products")
          }
        >
          Shop Now
        </button>
      </section>

      {/* ======================================================
          PRODUCTS
      ====================================================== */}

      <section
        id="products"
        style={{
          padding: "50px 30px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "32px",
              marginBottom: "25px",
            }}
          >
            Products
          </h2>

          {/* SEARCH */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "13px 15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "15px",
              }}
            />
          </div>

          {/* CATEGORIES */}

          <div
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "15px",
              marginBottom: "25px",
            }}
          >
            {categories.map((item) => (
              <button
                key={item}
                onClick={() =>
                  setCategory(item)
                }
                style={{
                  padding: "9px 18px",
                  borderRadius: "20px",
                  border:
                    category === item
                      ? "1px solid #ff6b00"
                      : "1px solid #ddd",
                  background:
                    category === item
                      ? "#ff6b00"
                      : "#fff",
                  color:
                    category === item
                      ? "#fff"
                      : "#333",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* PRODUCT LIST */}

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                color: "#666",
              }}
            >
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "50px",
                color: "#666",
              }}
            >
              No products found.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "22px",
              }}
            >
              {filteredProducts.map(
                (product) => {
                  const price =
                    Number(product?.price || 0);

                  const discount =
                    Number(
                      product?.discount || 0
                    );

                  const originalPrice =
                    discount > 0
                      ? Math.round(
                          price /
                            (1 -
                              discount / 100)
                        )
                      : price;

                  return (
                    <div
                      key={product.id}
                      style={{
                        background: "#fff",
                        border:
                          "1px solid #eeeeee",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow:
                          "0 3px 12px rgba(0,0,0,0.06)",
                        position: "relative",
                      }}
                    >
                      {/* WISHLIST */}

                      <button
                        onClick={() =>
                          toggleWishlist(
                            product.id
                          )
                        }
                        style={{
                          position:
                            "absolute",
                          top: "10px",
                          right: "10px",
                          zIndex: 2,
                          width: "35px",
                          height: "35px",
                          borderRadius: "50%",
                          border: "none",
                          background:
                            "#ffffff",
                          boxShadow:
                            "0 2px 8px rgba(0,0,0,0.12)",
                          cursor: "pointer",
                          fontSize: "18px",
                        }}
                        title={
                          wishlist.includes(
                            product.id
                          )
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        {wishlist.includes(
                          product.id
                        )
                          ? "❤️"
                          : "♡"}
                      </button>

                      {/* IMAGE */}

                      <div
                        style={{
                          height: "210px",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                          padding: "15px",
                          cursor: "pointer",
                        }}
                        onClick={() =>
                          setSelectedImage(
                            getProductImage(
                              product
                            )
                          )
                        }
                      >
                        <img
                          src={getProductImage(
                            product
                          )}
                          alt={
                            product.name ||
                            "Product"
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                          onError={(
                            event
                          ) => {
                            if (
                              !event.currentTarget
                                .dataset
                                .fallback
                            ) {
                              event.currentTarget.dataset.fallback =
                                "true";

                              event.currentTarget.src =
                                "https://loremflickr.com/500/400/shopping,product?lock=999";

                              return;
                            }

                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      </div>

                      <div
                        style={{
                          padding: "18px",
                        }}
                      >
                        {discount > 0 && (
                          <span
                            style={{
                              display:
                                "inline-block",
                              background:
                                "#e8f8ee",
                              color: "#198754",
                              padding:
                                "4px 8px",
                              borderRadius:
                                "5px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "600",
                              marginBottom:
                                "8px",
                            }}
                          >
                            {discount}% OFF
                          </span>
                        )}

                        <div
                          style={{
                            color: "#888",
                            fontSize:
                              "12px",
                            marginBottom:
                              "5px",
                          }}
                        >
                          {product.category ||
                            "Product"}
                        </div>

                        <h3
                          style={{
                            margin:
                              "5px 0",
                            fontSize:
                              "18px",
                          }}
                        >
                          {product.name}
                        </h3>

                        <p
                          style={{
                            color: "#666",
                            fontSize:
                              "13px",
                            minHeight:
                              "40px",
                          }}
                        >
                          {product.description ||
                            "Quality product from ShopSphere."}
                        </p>

                        <div
                          style={{
                            margin:
                              "8px 0",
                            fontSize:
                              "14px",
                          }}
                        >
                          ⭐{" "}
                          {product.rating ??
                            "4.5"}{" "}
                          ({product.reviews ??
                            0}{" "}
                          reviews)
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            margin:
                              "10px 0",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                "20px",
                              color:
                                "#ff6b00",
                            }}
                          >
                            ₹
                            {price.toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          {discount >
                            0 && (
                            <span
                              style={{
                                color:
                                  "#999",
                                textDecoration:
                                  "line-through",
                                fontSize:
                                  "13px",
                              }}
                            >
                              ₹
                              {originalPrice.toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#198754",
                            marginBottom:
                              "5px",
                          }}
                        >
                          🚚{" "}
                          {product.delivery ||
                            "Free delivery"}
                        </div>

                        <div
                          style={{
                            fontSize:
                              "13px",
                            color:
                              Number(
                                product.stock ??
                                  1
                              ) > 0
                                ? "#198754"
                                : "#dc3545",
                            marginBottom:
                              "12px",
                          }}
                        >
                          {Number(
                            product.stock ??
                              1
                          ) > 0
                            ? `In Stock (${product.stock ?? "Available"})`
                            : "Out of Stock"}
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            className="secondary-btn"
                            style={{
                              flex: 1,
                            }}
                            onClick={() =>
                              setSelectedImage(
                                getProductImage(
                                  product
                                )
                              )
                            }
                          >
                            View Details
                          </button>

                          <button
                            className="primary-btn"
                            style={{
                              flex: 1,
                            }}
                            disabled={
                              Number(
                                product.stock ??
                                  1
                              ) <= 0
                            }
                            onClick={() =>
                              addToCart(
                                product.id
                              )
                            }
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          CART
      ====================================================== */}

      <section
        id="cart"
        style={{
          padding: "50px 30px",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "32px",
              marginBottom: "30px",
            }}
          >
            Your Cart
          </h2>

          {!user ? (
            <div
              style={{
                background: "#fff",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <p>
                Please login to view your
                cart.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  setShowLogin(true)
                }
              >
                Login
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: "40px",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "50px",
                  marginBottom: "15px",
                }}
              >
                🛒
              </div>

              <h3>Your cart is empty</h3>

              <p
                style={{
                  color: "#777",
                }}
              >
                Add some products to
                continue shopping.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  scrollToSection(
                    "products"
                  )
                }
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 320px",
                gap: "25px",
              }}
            >
              {/* CART ITEMS */}

              <div>
                {cart.map((item) => {
                  const product =
                    item.product || {};

                  const price =
                    Number(
                      product.price ??
                        item.price ??
                        0
                    );

                  const quantity =
                    Number(
                      item.quantity || 1
                    );

                  return (
                    <div
                      key={item.id}
                      style={{
                        background:
                          "#fff",
                        border:
                          "1px solid #eee",
                        borderRadius:
                          "12px",
                        padding: "15px",
                        marginBottom:
                          "15px",
                        display:
                          "flex",
                        gap: "15px",
                        alignItems:
                          "center",
                      }}
                    >
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          flexShrink: 0,
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            "#fff",
                        }}
                      >
                        <img
                          src={getProductImage(
                            product
                          )}
                          alt={
                            product.name ||
                            "Product"
                          }
                          style={{
                            width:
                              "100%",
                            height:
                              "100%",
                            objectFit:
                              "contain",
                          }}
                          onError={(
                            event
                          ) => {
                            if (
                              !event.currentTarget
                                .dataset
                                .fallback
                            ) {
                              event.currentTarget.dataset.fallback =
                                "true";

                              event.currentTarget.src =
                                "https://loremflickr.com/500/400/shopping,product?lock=999";

                              return;
                            }

                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      </div>

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <h3
                          style={{
                            margin:
                              "0 0 5px",
                          }}
                        >
                          {product.name ||
                            "Product"}
                        </h3>

                        <p
                          style={{
                            margin:
                              "0 0 8px",
                            color:
                              "#ff6b00",
                            fontWeight:
                              "700",
                          }}
                        >
                          ₹
                          {price.toLocaleString(
                            "en-IN"
                          )}
                        </p>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                          }}
                        >
                          <button
                            className="secondary-btn"
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                quantity -
                                  1
                              )
                            }
                            disabled={
                              quantity <=
                              1
                            }
                          >
                            −
                          </button>

                          <strong>
                            {quantity}
                          </strong>

                          <button
                            className="secondary-btn"
                            onClick={() =>
                              updateCartQuantity(
                                item.id,
                                quantity +
                                  1
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        <strong>
                          ₹
                          {(
                            price *
                            quantity
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <br />

                        <button
                          className="secondary-btn"
                          style={{
                            marginTop:
                              "8px",
                            color:
                              "#dc3545",
                          }}
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CART SUMMARY */}

              <div
                style={{
                  background:
                    "#fff",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "12px",
                  padding: "22px",
                  height:
                    "fit-content",
                  position:
                    "sticky",
                  top: "90px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Order Summary
                </h3>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "12px",
                  }}
                >
                  <span>
                    Items
                  </span>

                  <span>
                    {cartCount}
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "12px",
                  }}
                >
                  <span>
                    Subtotal
                  </span>

                  <span>
                    ₹
                    {cartTotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    marginBottom:
                      "12px",
                    color:
                      "#198754",
                  }}
                >
                  <span>
                    Delivery
                  </span>

                  <span>
                    FREE
                  </span>
                </div>

                <hr />

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    margin:
                      "15px 0",
                    fontSize:
                      "20px",
                    fontWeight:
                      "700",
                  }}
                >
                  <span>
                    Total
                  </span>

                  <span
                    style={{
                      color:
                        "#ff6b00",
                    }}
                  >
                    ₹
                    {cartTotal.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-btn"
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                  onClick={checkout}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          AI SUPPORT
      ====================================================== */}

      <section
        id="support"
        style={{
          padding: "60px 30px",
        }}
      >
        <div
          style={{
            maxWidth: "850px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "32px",
            }}
          >
            AI Support
          </h2>

          <p
            style={{
              textAlign: "center",
              color: "#666",
              marginBottom: "25px",
            }}
          >
            Ask ShopSphere AI about your
            shopping questions.
          </p>

          <textarea
            value={supportQuestion}
            onChange={(event) =>
              setSupportQuestion(
                event.target.value
              )
            }
            placeholder="Ask your question..."
            rows={5}
            style={{
              width: "100%",
              padding: "15px",
              border:
                "1px solid #ddd",
              borderRadius: "10px",
              resize: "vertical",
              fontSize: "15px",
              boxSizing:
                "border-box",
            }}
          />

          <button
            className="primary-btn"
            style={{
              marginTop: "15px",
            }}
            onClick={askAI}
            disabled={loadingAI}
          >
            {loadingAI
              ? "Thinking..."
              : "Ask AI"}
          </button>

          {aiResponse && (
            <div
              style={{
                marginTop: "25px",
                background:
                  "#fff7f0",
                border:
                  "1px solid #ffd9bd",
                borderRadius:
                  "10px",
                padding: "20px",
                whiteSpace:
                  "pre-wrap",
              }}
            >
              <strong>
                AI Response
              </strong>

              <p
                style={{
                  marginBottom: 0,
                  lineHeight: 1.6,
                }}
              >
                {aiResponse}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================
          ORDERS
      ====================================================== */}

      <section
        id="orders"
        style={{
          padding: "60px 30px",
          background: "#fafafa",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontSize: "32px",
              marginBottom: "30px",
            }}
          >
            My Orders
          </h2>

          {!user ? (
            <div
              style={{
                background:
                  "#fff",
                padding: "40px",
                borderRadius:
                  "12px",
                textAlign:
                  "center",
              }}
            >
              <p>
                Please login to view
                your orders.
              </p>

              <button
                className="primary-btn"
                onClick={() =>
                  setShowLogin(true)
                }
              >
                Login
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                background:
                  "#fff",
                padding: "40px",
                borderRadius:
                  "12px",
                textAlign:
                  "center",
              }}
            >
              <div
                style={{
                  fontSize:
                    "50px",
                }}
              >
                📦
              </div>

              <h3>
                No orders yet
              </h3>

              <p
                style={{
                  color:
                    "#777",
                }}
              >
                Your placed orders
                will appear here.
              </p>
            </div>
          ) : (
            <div>
              {orders.map(
                (order) => {
                  const status =
                    order.status ||
                    "pending";

                  const trackingIndex =
                    getTrackingIndex(
                      status
                    );

          

                  const payment =
                    order.payment_method ||
                    "Not available";

                  return (
                    <div
                      key={order.id}
                      style={{
                        background:
                          "#fff",
                        border:
                          "1px solid #e8e8e8",
                        borderRadius:
                          "14px",
                        padding:
                          "22px",
                        marginBottom:
                          "20px",
                        boxShadow:
                          "0 3px 10px rgba(0,0,0,0.04)",
                      }}
                    >
                      {/* ORDER HEADER */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                          marginBottom:
                            "20px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin:
                                "0 0 5px",
                            }}
                          >
                            Order #
                            {order.id}
                          </h3>

                          <span
                            style={{
                              color:
                                "#666",
                              fontSize:
                                "13px",
                            }}
                          >
                            {getStatusMessage(
                              status
                            )}
                          </span>
                        </div>

                        <span
                          style={{
                            padding:
                              "7px 12px",
                            borderRadius:
                              "20px",
                            background:
                              status ===
                              "cancelled"
                                ? "#ffe5e5"
                                : status ===
                                  "delivered"
                                ? "#e8f8ee"
                                : "#fff2e8",
                            color:
                              status ===
                              "cancelled"
                                ? "#dc3545"
                                : status ===
                                  "delivered"
                                ? "#198754"
                                : "#ff6b00",
                            fontWeight:
                              "700",
                            fontSize:
                              "13px",
                          }}
                        >
                          {status
                            .replace(
                              /_/g,
                              " "
                            )
                            .toUpperCase()}
                        </span>
                      </div>

                      {/* ORDER ITEMS */}

                      <div
  style={{
    padding: "15px 0",
    borderTop: "1px solid #eee",
  }}
>
  <div
    style={{
      display: "flex",
      gap: "15px",
      alignItems: "center",
    }}
  >
    <div
      style={{
        width: "75px",
        height: "75px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        flexShrink: 0,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <img
        src={getProductImage({
          name: order.product_name,
        })}
        alt={order.product_name || "Product"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>

    <div style={{ flex: 1 }}>
      <strong
        style={{
          display: "block",
          fontSize: "15px",
          color: "#222",
        }}
      >
        {order.product_name || "Product"}
      </strong>

      <div
        style={{
          fontSize: "13px",
          color: "#666",
          marginTop: "5px",
        }}
      >
        Quantity: {order.quantity || 1}
      </div>
    </div>

    <strong
      style={{
        color: "#ff6b00",
        fontSize: "16px",
      }}
    >
      ₹
      {Number(
        order.total_price || 0
      ).toLocaleString("en-IN")}
    </strong>
  </div>
</div>

                      {/* ORDER INFORMATION */}

                      <div
                        style={{
                          display:
                            "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "12px",
                          marginTop:
                            "15px",
                          padding:
                            "15px",
                          background:
                            "#fafafa",
                          borderRadius:
                            "10px",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "12px",
                              color:
                                "#777",
                            }}
                          >
                            Ordered On
                          </span>

                          <strong>
                            {getOrderDate(
                              order
                            )}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "12px",
                              color:
                                "#777",
                            }}
                          >
                            Expected Delivery
                          </span>

                          <strong>
                            {getExpectedDeliveryDate(
                              order
                            )}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "12px",
                              color:
                                "#777",
                            }}
                          >
                            Payment Method
                          </span>

                          <strong>
                            {payment}
                          </strong>
                        </div>

                        <div>
                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "12px",
                              color:
                                "#777",
                            }}
                          >
                            Total
                          </span>

                          <strong
                            style={{
                              color:
                                "#ff6b00",
                            }}
                          >
                            ₹
                            {Number(
                              order.total ||
                                order.total_price ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* TRACKING */}

                      {status !==
                        "cancelled" && (
                        <div
                          style={{
                            marginTop:
                              "25px",
                          }}
                        >
                          <h4>
                            Order Tracking
                          </h4>

                          <div
                            style={{
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              position:
                                "relative",
                              marginTop:
                                "25px",
                              gap:
                                "5px",
                            }}
                          >
                            {trackingSteps.map(
                              (
                                step,
                                index
                              ) => {
                                const completed =
                                  index <=
                                  trackingIndex;

                                return (
                                  <div
                                    key={
                                      step.key
                                    }
                                    style={{
                                      flex: 1,
                                      textAlign:
                                        "center",
                                      position:
                                        "relative",
                                      zIndex: 2,
                                    }}
                                  >
                                    <div
                                      style={{
                                        width:
                                          "30px",
                                        height:
                                          "30px",
                                        margin:
                                          "0 auto 8px",
                                        borderRadius:
                                          "50%",
                                        display:
                                          "flex",
                                        alignItems:
                                          "center",
                                        justifyContent:
                                          "center",
                                        background:
                                          completed
                                            ? "#ff6b00"
                                            : "#ddd",
                                        color:
                                          completed
                                            ? "#fff"
                                            : "#777",
                                        fontSize:
                                          "12px",
                                        fontWeight:
                                          "700",
                                      }}
                                    >
                                      {completed
                                        ? "✓"
                                        : index +
                                          1}
                                    </div>

                                    <span
                                      style={{
                                        fontSize:
                                          "11px",
                                        color:
                                          completed
                                            ? "#ff6b00"
                                            : "#777",
                                        fontWeight:
                                          completed
                                            ? "700"
                                            : "400",
                                      }}
                                    >
                                      {
                                        step.label
                                      }
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}

                      {/* DELIVERY ADDRESS */}

                      {order.delivery_address && (
                        <div
                          style={{
                            marginTop:
                              "20px",
                            padding:
                              "15px",
                            background:
                              "#fff7f0",
                            border:
                              "1px solid #ffd9bd",
                            borderRadius:
                              "10px",
                          }}
                        >
                          <strong>
                            Delivery Address
                          </strong>

                          <p
                            style={{
                              margin:
                                "8px 0 0",
                              color:
                                "#555",
                              lineHeight:
                                1.5,
                            }}
                          >
                            {typeof order.delivery_address ===
                            "string"
                              ? order.delivery_address
                              : `${order.delivery_address.name || ""}, ${order.delivery_address.address || ""}, ${order.delivery_address.city || ""}, ${order.delivery_address.state || ""} - ${order.delivery_address.pincode || ""}`}
                          </p>
                        </div>
                      )}

                      {/* ACTION BUTTONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          marginTop:
                            "20px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        {[
                          "pending",
                          "confirmed",
                          "shipped",
                        ].includes(
                          status
                        ) && (
                          <button
                            className="secondary-btn"
                            style={{
                              color:
                                "#dc3545",
                              borderColor:
                                "#dc3545",
                            }}
                            onClick={() =>
                              cancelOrder(
                                order.id
                              )
                            }
                          >
                            Cancel Order
                          </button>
                        )}

                        {status ===
                          "out_for_delivery" && (
                          <button
                            className="secondary-btn"
                            style={{
                              color:
                                "#dc3545",
                              borderColor:
                                "#dc3545",
                            }}
                            onClick={() =>
                              deleteOrder(
                                order.id
                              )
                            }
                          >
                            Delete Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        style={{
          background: "#222",
          color: "#fff",
          padding: "35px 30px",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            color: "#ff6b00",
            marginBottom: "8px",
          }}
        >
          ShopSphere
        </h3>

        <p
          style={{
            color: "#bbb",
            margin: 0,
          }}
        >
          Simple. Smart. Shopping.
        </p>
      </footer>

      {/* ======================================================
          LOGIN MODAL
      ====================================================== */}

      {showLogin && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowLogin(false)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setShowLogin(false)
              }
            >
              ×
            </button>

            <h2>Login</h2>

            <form onSubmit={login}>
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(event) =>
                  setLoginData({
                    ...loginData,
                    email:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={
                  loginData.password
                }
                onChange={(event) =>
                  setLoginData({
                    ...loginData,
                    password:
                      event.target.value,
                  })
                }
                required
              />

              <button
                type="submit"
                className="primary-btn"
              >
                Login
              </button>
            </form>

            <p
              style={{
                marginTop: "15px",
                textAlign:
                  "center",
              }}
            >
              Don't have an account?{" "}
              <button
                style={{
                  border: "none",
                  background:
                    "none",
                  color:
                    "#ff6b00",
                  cursor:
                    "pointer",
                  fontWeight:
                    "600",
                }}
                onClick={() => {
                  setShowLogin(
                    false
                  );
                  setShowRegister(
                    true
                  );
                }}
              >
                Register
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          REGISTER MODAL
      ====================================================== */}

      {showRegister && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowRegister(false)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setShowRegister(
                  false
                )
              }
            >
              ×
            </button>

            <h2>Register</h2>

            <form
              onSubmit={register}
            >
              <input
                type="text"
                placeholder="Full Name"
                value={
                  registerData.name
                }
                onChange={(event) =>
                  setRegisterData({
                    ...registerData,
                    name:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={
                  registerData.email
                }
                onChange={(event) =>
                  setRegisterData({
                    ...registerData,
                    email:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={
                  registerData.password
                }
                onChange={(event) =>
                  setRegisterData({
                    ...registerData,
                    password:
                      event.target.value,
                  })
                }
                required
              />

              <button
                type="submit"
                className="primary-btn"
              >
                Register
              </button>
            </form>

            <p
              style={{
                marginTop: "15px",
                textAlign:
                  "center",
              }}
            >
              Already have an account?{" "}
              <button
                style={{
                  border: "none",
                  background:
                    "none",
                  color:
                    "#ff6b00",
                  cursor:
                    "pointer",
                  fontWeight:
                    "600",
                }}
                onClick={() => {
                  setShowRegister(
                    false
                  );
                  setShowLogin(
                    true
                  );
                }}
              >
                Login
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          PROFILE MODAL
      ====================================================== */}

      {showProfile && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowProfile(false)
          }
        >
          <div
            className="modal"
            style={{
              maxWidth: "600px",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setShowProfile(
                  false
                )
              }
            >
              ×
            </button>

            <h2>My Profile</h2>

            <div
              style={{
                display:
                  "grid",
                gap: "12px",
              }}
            >
              <input
                type="text"
                placeholder="Name"
                value={
                  profileData.name
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    name:
                      event.target.value,
                  })
                }
              />

              <input
                type="email"
                placeholder="Email"
                value={
                  profileData.email
                }
                disabled
              />

              <input
                type="text"
                placeholder="Phone"
                value={
                  profileData.phone
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    phone:
                      event.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Address"
                value={
                  profileData.address
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    address:
                      event.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="City"
                value={
                  profileData.city
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    city:
                      event.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="State"
                value={
                  profileData.state
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    state:
                      event.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Pincode"
                value={
                  profileData.pincode
                }
                disabled={
                  !editingProfile
                }
                onChange={(event) =>
                  setProfileData({
                    ...profileData,
                    pincode:
                      event.target.value,
                  })
                }
              />

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginTop:
                    "10px",
                }}
              >
                {!editingProfile ? (
                  <button
                    className="primary-btn"
                    onClick={() =>
                      setEditingProfile(
                        true
                      )
                    }
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      className="primary-btn"
                      onClick={
                        saveProfile
                      }
                      disabled={
                        savingProfile
                      }
                    >
                      {savingProfile
                        ? "Saving..."
                        : "Save Changes"}
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() =>
                        setEditingProfile(
                          false
                        )
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  className="secondary-btn"
                  onClick={() =>
                    setShowProfile(
                      false
                    )
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          ADDRESS MODAL
      ====================================================== */}

      {showAddresses && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddresses(false)
          }
        >
          <div
            className="payment-box payment-modal-box"
            style={{
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="payment-modal-close"
              onClick={() =>
                setShowAddresses(
                  false
                )
              }
            >
              ×
            </button>

            <h2>My Addresses</h2>

            {/* EXISTING ADDRESSES */}

            {addresses.length >
              0 && (
              <div
                style={{
                  marginBottom:
                    "25px",
                }}
              >
                {addresses.map(
                  (address) => (
                    <div
                      key={
                        address.id
                      }
                      style={{
                        border:
                          address.is_default
                            ? "2px solid #ff6b00"
                            : "1px solid #ddd",
                        borderRadius:
                          "10px",
                        padding:
                          "15px",
                        marginBottom:
                          "12px",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: "10px",
                        }}
                      >
                        <div>
                          <strong>
                            {
                              address.name
                            }
                          </strong>

                          {address.is_default && (
                            <span
                              style={{
                                marginLeft:
                                  "8px",
                                fontSize:
                                  "11px",
                                background:
                                  "#ff6b00",
                                color:
                                  "#fff",
                                padding:
                                  "3px 7px",
                                borderRadius:
                                  "10px",
                              }}
                            >
                              DEFAULT
                            </span>
                          )}

                          <p
                            style={{
                              margin:
                                "8px 0",
                              color:
                                "#555",
                              lineHeight:
                                1.5,
                            }}
                          >
                            {
                              address.address
                            }
                            <br />
                            {
                              address.city
                            }
                            ,{" "}
                            {
                              address.state
                            }{" "}
                            -{" "}
                            {
                              address.pincode
                            }
                            <br />
                            Phone:{" "}
                            {
                              address.phone
                            }
                          </p>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            gap: "6px",
                            flexWrap:
                              "wrap",
                            justifyContent:
                              "flex-end",
                          }}
                        >
                          {!address.is_default && (
                            <button
                              className="secondary-btn"
                              onClick={() =>
                                setDefaultAddress(
                                  address.id
                                )
                              }
                            >
                              Set Default
                            </button>
                          )}

                          <button
                            className="secondary-btn"
                            onClick={() =>
                              editAddress(
                                address
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="secondary-btn"
                            style={{
                              color:
                                "#dc3545",
                            }}
                            onClick={() =>
                              deleteAddress(
                                address.id
                              )
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* ADDRESS FORM */}

            <h3>
              {editingAddress
                ? "Edit Address"
                : "Add New Address"}
            </h3>

            <form
              onSubmit={saveAddress}
            >
              <input
                type="text"
                placeholder="Name"
                value={
                  addressForm.name
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    name:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Phone"
                value={
                  addressForm.phone
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    phone:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Address"
                value={
                  addressForm.address
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    address:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="City"
                value={
                  addressForm.city
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    city:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="State"
                value={
                  addressForm.state
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    state:
                      event.target.value,
                  })
                }
                required
              />

              <input
                type="text"
                placeholder="Pincode"
                value={
                  addressForm.pincode
                }
                onChange={(event) =>
                  setAddressForm({
                    ...addressForm,
                    pincode:
                      event.target.value,
                  })
                }
                required
              />

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  marginTop:
                    "10px",
                }}
              >
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={
                    savingAddress
                  }
                >
                  {savingAddress
                    ? "Saving..."
                    : editingAddress
                    ? "Update Address"
                    : "Add Address"}
                </button>

                {editingAddress && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={
                      resetAddressForm
                    }
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          PAYMENT / CHECKOUT MODAL
      ====================================================== */}

      {showCheckout && (
        <div
          className="payment-modal"
          onClick={() => {
            if (!processingPayment) {
              setShowCheckout(false);
            }
          }}
        >
          <div
            className="modal"
            style={{
              maxWidth: "650px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-modal"
              disabled={processingPayment}
              onClick={() =>
                setShowCheckout(
                  false
                )
              }
            >
              ×
            </button>

            <h2
              style={{
                marginBottom:
                  "5px",
              }}
            >
              Checkout
            </h2>

            <p
              style={{
                color: "#777",
                marginTop: 0,
              }}
            >
              Select your payment
              method and place your
              order.
            </p>

            {/* ------------------------------------------------
                DELIVERY ADDRESS
            ------------------------------------------------ */}

            {(() => {
              const defaultAddress =
                addresses.find(
                  (address) =>
                    address.is_default
                );

              return (
                <div
                  style={{
                    padding:
                      "15px",
                    background:
                      "#fff7f0",
                    border:
                      "1px solid #ffd9bd",
                    borderRadius:
                      "10px",
                    marginBottom:
                      "20px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                    }}
                  >
                    <strong>
                      Delivery Address
                    </strong>

                    <button
                      type="button"
                      className="secondary-btn"
                      style={{
                        fontSize:
                          "12px",
                      }}
                      onClick={() => {
                        setShowCheckout(
                          false
                        );
                        openAddresses();
                      }}
                    >
                      Change
                    </button>
                  </div>

                  <p
                    style={{
                      margin:
                        "8px 0 0",
                      lineHeight:
                        1.5,
                      color:
                        "#555",
                    }}
                  >
                    {defaultAddress?.name}
                    <br />
                    {
                      defaultAddress?.address
                    }
                    <br />
                    {
                      defaultAddress?.city
                    }
                    ,{" "}
                    {
                      defaultAddress?.state
                    }{" "}
                    -{" "}
                    {
                      defaultAddress?.pincode
                    }
                    <br />
                    Phone:{" "}
                    {
                      defaultAddress?.phone
                    }
                  </p>
                </div>
              );
            })()}

            {/* ------------------------------------------------
                ORDER SUMMARY
            ------------------------------------------------ */}

            <div
              style={{
                padding:
                  "15px",
                background:
                  "#fafafa",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                }}
              >
                Order Summary
              </h3>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom:
                    "8px",
                }}
              >
                <span>
                  Items
                </span>

                <span>
                  {cartCount}
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  marginBottom:
                    "8px",
                }}
              >
                <span>
                  Delivery
                </span>

                <span
                  style={{
                    color:
                      "#198754",
                  }}
                >
                  FREE
                </span>
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  fontWeight:
                    "700",
                  fontSize:
                    "20px",
                  paddingTop:
                    "10px",
                  borderTop:
                    "1px solid #ddd",
                }}
              >
                <span>
                  Total
                </span>

                <span
                  style={{
                    color:
                      "#ff6b00",
                  }}
                >
                  ₹
                  {cartTotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            </div>

            {/* ------------------------------------------------
                DEMO PAYMENT NOTICE
            ------------------------------------------------ */}

            <div
              style={{
                background:
                  "#eef7ff",
                border:
                  "1px solid #cfe7ff",
                color:
                  "#245b85",
                borderRadius:
                  "8px",
                padding:
                  "12px",
                fontSize:
                  "13px",
                marginBottom:
                  "20px",
              }}
            >
              <strong>
                Demo Payment
              </strong>

              <div
                style={{
                  marginTop:
                    "4px",
                }}
              >
                This ShopSphere version
                uses a demo payment
                flow. No real money is
                charged.
              </div>
            </div>

            {/* ------------------------------------------------
                PAYMENT METHODS
            ------------------------------------------------ */}

            <h3>
              Select Payment Method
            </h3>

            <div
              style={{
                display:
                  "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: "10px",
                marginBottom:
                  "20px",
              }}
            >
              {/* UPI */}

              <button
                type="button"
                disabled={
                  processingPayment
                }
                onClick={() =>
                  setPaymentMethod(
                    "UPI"
                  )
                }
                style={{
                  padding:
                    "15px 10px",
                  borderRadius:
                    "10px",
                  border:
                    paymentMethod ===
                    "UPI"
                      ? "2px solid #ff6b00"
                      : "1px solid #ddd",
                  background:
                    paymentMethod ===
                    "UPI"
                      ? "#fff7f0"
                      : "#fff",
                  cursor:
                    "pointer",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "25px",
                    marginBottom:
                      "5px",
                  }}
                >
                  📱
                </div>

                <strong>
                  UPI
                </strong>

                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#777",
                    marginTop:
                      "4px",
                  }}
                >
                  Google Pay /
                  PhonePe
                </div>
              </button>

              {/* CARD */}

              <button
                type="button"
                disabled={
                  processingPayment
                }
                onClick={() =>
                  setPaymentMethod(
                    "CARD"
                  )
                }
                style={{
                  padding:
                    "15px 10px",
                  borderRadius:
                    "10px",
                  border:
                    paymentMethod ===
                    "CARD"
                      ? "2px solid #ff6b00"
                      : "1px solid #ddd",
                  background:
                    paymentMethod ===
                    "CARD"
                      ? "#fff7f0"
                      : "#fff",
                  cursor:
                    "pointer",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "25px",
                    marginBottom:
                      "5px",
                  }}
                >
                  💳
                </div>

                <strong>
                  Card
                </strong>

                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#777",
                    marginTop:
                      "4px",
                  }}
                >
                  Debit / Credit
                </div>
              </button>

              {/* COD */}

              <button
                type="button"
                disabled={
                  processingPayment
                }
                onClick={() =>
                  setPaymentMethod(
                    "COD"
                  )
                }
                style={{
                  padding:
                    "15px 10px",
                  borderRadius:
                    "10px",
                  border:
                    paymentMethod ===
                    "COD"
                      ? "2px solid #ff6b00"
                      : "1px solid #ddd",
                  background:
                    paymentMethod ===
                    "COD"
                      ? "#fff7f0"
                      : "#fff",
                  cursor:
                    "pointer",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "25px",
                    marginBottom:
                      "5px",
                  }}
                >
                  💵
                </div>

                <strong>
                  Cash on Delivery
                </strong>

                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#777",
                    marginTop:
                      "4px",
                  }}
                >
                  Pay on delivery
                </div>
              </button>
            </div>

            {/* ------------------------------------------------
                UPI FORM
            ------------------------------------------------ */}

            {paymentMethod ===
              "UPI" && (
              <div
                style={{
                  padding:
                    "15px",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "10px",
                  marginBottom:
                    "20px",
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                  }}
                >
                  Enter UPI ID
                </h4>

                <input
                  type="text"
                  placeholder="example@upi"
                  value={upiId}
                  onChange={(event) =>
                    setUpiId(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    processingPayment
                  }
                  style={{
                    width:
                      "100%",
                    boxSizing:
                      "border-box",
                  }}
                />

                <p
                  style={{
                    fontSize:
                      "12px",
                    color:
                      "#777",
                    marginBottom:
                      0,
                  }}
                >
                  Example:
                  hema@upi
                </p>
              </div>
            )}

            {/* ------------------------------------------------
                CARD FORM
            ------------------------------------------------ */}

            {paymentMethod ===
              "CARD" && (
              <div
                style={{
                  padding:
                    "15px",
                  border:
                    "1px solid #eee",
                  borderRadius:
                    "10px",
                  marginBottom:
                    "20px",
                }}
              >
                <h4
                  style={{
                    marginTop: 0,
                  }}
                >
                  Card Details
                </h4>

                <input
                  type="text"
                  placeholder="Card Holder Name"
                  value={
                    cardDetails.name
                  }
                  onChange={(event) =>
                    setCardDetails({
                      ...cardDetails,
                      name: event
                        .target
                        .value,
                    })
                  }
                  disabled={
                    processingPayment
                  }
                />

                <input
                  type="text"
                  placeholder="Card Number - 16 digits"
                  maxLength={19}
                  value={
                    cardDetails.cardNumber
                  }
                  onChange={(event) => {
                    let value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    if (
                      value.length >
                      16
                    ) {
                      value =
                        value.slice(
                          0,
                          16
                        );
                    }

                    value =
                      value.match(
                        /.{1,4}/g
                      )?.join(
                        " "
                      ) || "";

                    setCardDetails({
                      ...cardDetails,
                      cardNumber:
                        value,
                    });
                  }}
                  disabled={
                    processingPayment
                  }
                />

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={
                      cardDetails.expiry
                    }
                    onChange={(
                      event
                    ) => {
                      let value =
                        event.target.value.replace(
                          /\D/g,
                          ""
                        );

                      if (
                        value.length >
                        4
                      ) {
                        value =
                          value.slice(
                            0,
                            4
                          );
                      }

                      if (
                        value.length >
                        2
                      ) {
                        value =
                          value.slice(
                            0,
                            2
                          ) +
                          "/" +
                          value.slice(
                            2
                          );
                      }

                      setCardDetails({
                        ...cardDetails,
                        expiry:
                          value,
                      });
                    }}
                    disabled={
                      processingPayment
                    }
                  />

                  <input
                    type="password"
                    placeholder="CVV"
                    maxLength={3}
                    value={
                      cardDetails.cvv
                    }
                    onChange={(
                      event
                    ) =>
                      setCardDetails({
                        ...cardDetails,
                        cvv: event.target.value.replace(
                          /\D/g,
                          ""
                        ),
                      })
                    }
                    disabled={
                      processingPayment
                    }
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                COD MESSAGE
            ------------------------------------------------ */}

            {paymentMethod ===
              "COD" && (
              <div
                style={{
                  padding:
                    "15px",
                  background:
                    "#e8f8ee",
                  border:
                    "1px solid #bde5ca",
                  borderRadius:
                    "10px",
                  marginBottom:
                    "20px",
                  color:
                    "#198754",
                }}
              >
                <strong>
                  Cash on Delivery
                </strong>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                  }}
                >
                  You can pay when
                  your order is
                  delivered.
                </p>
              </div>
            )}

            {/* ------------------------------------------------
                PLACE ORDER BUTTON
            ------------------------------------------------ */}

            <div
              style={{
                display:
                  "flex",
                gap: "10px",
              }}
            >
              <button
                className="primary-btn"
                style={{
                  flex: 1,
                }}
                onClick={
                  placeOrder
                }
                disabled={
                  processingPayment
                }
              >
                {processingPayment
                  ? "Processing..."
                  : paymentMethod ===
                    "COD"
                  ? "Place Order"
                  : "Pay & Place Order"}
              </button>

              <button
                className="secondary-btn"
                onClick={() =>
                  setShowCheckout(
                    false
                  )
                }
                disabled={
                  processingPayment
                }
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          IMAGE PREVIEW
      ====================================================== */}

      {selectedImage && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedImage(
              null
            )
          }
        >
          <div
            style={{
              background:
                "#fff",
              padding:
                "20px",
              borderRadius:
                "12px",
              maxWidth:
                "850px",
              maxHeight:
                "90vh",
              position:
                "relative",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setSelectedImage(
                  null
                )
              }
            >
              ×
            </button>

            <img
              src={selectedImage}
              alt="Product Preview"
              style={{
                maxWidth:
                  "100%",
                maxHeight:
                  "80vh",
                objectFit:
                  "contain",
              }}
              onError={(event) => {
                if (
                  !event.currentTarget
                    .dataset.fallback
                ) {
                  event.currentTarget.dataset.fallback =
                    "true";

                  event.currentTarget.src =
                    "https://loremflickr.com/800/600/shopping,product?lock=999";
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;