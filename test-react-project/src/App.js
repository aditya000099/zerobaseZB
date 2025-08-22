import { useState, useEffect } from "react";
import logo from "./logo.svg";
import {
  AuthClient,
  DatabaseClient,
  ZeroBaseClient,
  AccountClient,
} from "zerobase";

const client = new ZeroBaseClient(
  "project_1740144713326",
  "http://localhost:3000",
  "api"
);
console.log(client);
const auth = new AuthClient(client);
const db = new DatabaseClient(client);
const account = new AccountClient(client);

function App() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  // auth token is persisted in localStorage; no separate state needed

  useEffect(() => {
    checkExistingSession();
    fetchUsers();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingSession = async () => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      try {
        const { valid, user } = await account.validateSession(savedToken);
        if (valid && user) {
          setCurrentUser(user);
          console.log("Session restored:", user);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Session validation error:", error);
        handleLogout();
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await auth.createUser({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      console.log("User created:", response);
      // Clear form after successful submission
      setFormData({ name: "", email: "", password: "" });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await auth.loginUser(
        loginData.email,
        loginData.password
      );
      console.log("Login response:", response);

      if (response && response.token) {
        setCurrentUser(response.user); // Assuming the login response includes user data
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("currentUser", JSON.stringify(response.user));
        setLoginData({ email: "", password: "" });
      } else {
        console.error("Invalid login response:", response);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  };

  const fetchUsers = async () => {
    try {
      const response = await auth.getUsers();
      console.log("Users fetched:", response);
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        console.error("Unexpected response format:", response);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };
  const fetchProducts = async () => {
    try {
      const response = await db.getDocument("products", "1");
      console.log("Products fetched:", response);
      // if (Array.isArray(response)) {
      //   setUsers(response);
      // } else if (response && Array.isArray(response.users)) {
      //   setUsers(response.users);
      // } else {
      //   console.error("Unexpected response format:", response);
      //   setUsers([]);
      // }
    } catch (error) {
      console.error("Error fetching products:", error);
      // setUsers([]);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await auth.deleteUser(userId);
        console.log("User deleted successfully");
        // Refresh users list
        fetchUsers();
        // If the deleted user is the current user, log them out
        if (currentUser && currentUser.id === userId) {
          handleLogout();
        }
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <img src={logo} className="h-8 w-8 animate-spin" alt="logo" /> */}
            <h1 className="text-2xl font-semibold text-zinc-100">
              ZeroBase Admin
            </h1>
          </div>
          {currentUser ? (
            <div className="flex items-center gap-4 rounded-xl bg-zinc-900/70 px-4 py-2 ring-1 ring-zinc-800">
              <div>
                <p className="text-sm text-zinc-300">Signed in as</p>
                <p className="text-sm font-medium text-zinc-100">
                  {currentUser.name}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900/70 p-5 ring-1 ring-zinc-800">
              <h2 className="mb-3 text-lg font-medium text-zinc-100">Login</h2>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-brand-500"
                >
                  Sign In
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-zinc-900/70 p-6 ring-1 ring-zinc-800">
            <h2 className="mb-4 text-lg font-medium">Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-700"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-brand-500"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-zinc-900/70 p-6 ring-1 ring-zinc-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium">Users</h2>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                {users.length}
              </span>
            </div>
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <div className="text-sm">
                    <p className="font-medium text-zinc-100">{user.name}</p>
                    <p className="text-zinc-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-zinc-400">No users yet.</p>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
