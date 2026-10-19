// import { createContext, useContext, useState } from "react";
// import api from "../api/axios";

// const AuthContext = createContext(null);

// const getStoredUser = () => {
//   try {
//     const raw = localStorage.getItem("userInfo");
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// };

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(getStoredUser);

//   const saveUser = (data) => {
//     localStorage.setItem("userInfo", JSON.stringify(data));
//     setUser(data);
//   };

//   const login = async (email, password) => {
//     const { data } = await api.post("/auth/login", { email, password });
//     saveUser(data);
//     return data;
//   };

//   const register = async (formData) => {
//     const { data } = await api.post("/auth/register", formData);
//     saveUser(data);
//     return data;
//   };

//   const logout = () => {
//     localStorage.removeItem("userInfo");
//     setUser(null);
//   };

//   // Profile badalne par naam/email wagaira turant update (token waisa hi rehta hai)
//   const updateUser = (changes) => {
//     if (!user) return;
//     saveUser({ ...user, ...changes });
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext); 



import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

const AuthContext = createContext(null);

// Do alag login: dukan ke liye "userInfo", Admin Panel ke liye "adminInfo"
const CUSTOMER_KEY = "userInfo";
const ADMIN_KEY = "adminInfo";

const readUser = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeUser = (key, data) => {
  try {
    if (data) localStorage.setItem(key, JSON.stringify(data));
    else localStorage.removeItem(key);
  } catch {
    // storage band ho to bhi app chalti rahe
  }
};

const isAdminPath = (pathname) => /^\/admin(\/|$)/.test(pathname);

export function AuthProvider({ children }) {
  const { pathname } = useLocation();
  const inAdmin = isAdminPath(pathname);

  const [customerUser, setCustomerUser] = useState(() => readUser(CUSTOMER_KEY));
  const [adminUser, setAdminUser] = useState(() => readUser(ADMIN_KEY));
  
  // Logout hote hi login page par bhej do (Header ho, My Account ho, ya doosra tab)
  const navigate = useNavigate();
  const prevCustomer = useRef(customerUser);
  const prevAdmin = useRef(adminUser);

  useEffect(() => {
    const loggedOut = prevCustomer.current && !customerUser;
    prevCustomer.current = customerUser;
    if (loggedOut && !inAdmin) navigate("/login", { replace: true });
  }, [customerUser, inAdmin, navigate]);

  useEffect(() => {
    const loggedOut = prevAdmin.current && !adminUser;
    prevAdmin.current = adminUser;
    if (loggedOut && inAdmin) navigate("/admin/login", { replace: true });
  }, [adminUser, inAdmin, navigate]);

  // Doosre tab mein login ya logout ho to yeh tab bhi saath badle
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CUSTOMER_KEY || e.key === null) setCustomerUser(readUser(CUSTOMER_KEY));
      if (e.key === ADMIN_KEY || e.key === null) setAdminUser(readUser(ADMIN_KEY));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // "user" wohi hai jo is waqt ke hisse (dukan ya Admin Panel) ka login hai
  const key = inAdmin ? ADMIN_KEY : CUSTOMER_KEY;
  const setSession = inAdmin ? setAdminUser : setCustomerUser;
  const user = inAdmin ? adminUser : customerUser;

  const saveUser = (data) => {
    writeUser(key, data);
    setSession(data);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    saveUser(data);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    saveUser(data);
    return data;
  };

  // Sirf is hisse ka login khatam hota hai, doosra hissa waise ka waisa rehta hai
  const logout = () => {
    writeUser(key, null);
    setSession(null);
  };

  // Profile badalne par naam/email wagaira turant update (token waisa hi rehta hai)
  const updateUser = (changes) => {
    if (!user) return;
    saveUser({ ...user, ...changes });
  };

  return (
    <AuthContext.Provider
      value={{ user, customerUser, adminUser, inAdmin, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);