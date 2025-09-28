import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("https://hs-project-server.onrender.com/api/admin/login", { email, password }
      );
      if (res.data.isAdmin) {
        localStorage.setItem("token", res.data.token);
        navigate("/dashboard");
      } else {
        setError("Access denied. Not an admin user.");
      }
    } catch (err) {
      setError("Invalid credentials or server error.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6 text-center">Admin Login</h2>
        {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 px-4 py-2 border rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 px-4 py-2 border rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-primary-dark text-black py-2 rounded hover:bg-primary transition mt-2">Login</button>
      </form>
    </div>
  );
}
