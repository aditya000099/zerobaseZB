import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import {
  AuthClient,
  DatabaseClient,
  ZeroBaseClient,
  AccountClient,
} from "./zerobaseSDK";

const client = new ZeroBaseClient(
  "project_1740144713326",
  "http://localhost:3000",
  "api"
);
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
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    checkExistingSession();
    fetchUsers();
    fetchProducts();
  }, []);

  const checkExistingSession = async () => {
    const savedToken = localStorage.getItem("authToken");
    if (savedToken) {
      try {
        const { valid, user } = await account.validateSession(savedToken);
        if (valid && user) {
          setAuthToken(savedToken);
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
        setAuthToken(response.token);
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
    setAuthToken(null);
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
    <div className="App">
      <header className="App-header">
        {currentUser ? (
          <div style={{ marginBottom: "20px" }}>
            <h2>Welcome, {currentUser.name}!</h2>
            <p>Email: {currentUser.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div style={{ marginBottom: "20px" }}>
            <h2>Login</h2>
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={loginData.email}
                onChange={handleLoginChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
              />
              <button type="submit">Login</button>
            </form>
          </div>
        )}

        <h2>Create New User</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <button type="submit">Create User</button>
        </form>

        <div style={{ marginTop: "2rem" }}>
          <h2>Users List</h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p>Name: {user.name}</p>
                  <p>Email: {user.email}</p>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{
                    backgroundColor: "#ff4444",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "3px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
