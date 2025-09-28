import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: ""});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // Password validation (exactly 8 chars, at least one number)
    if (form.password.length !== 8) {
      setError("Password must be exactly 8 characters long.");
      return;
    }
    if (!/[0-9]/.test(form.password)) {
      setError("Password must contain at least one number.");
      return;
    }
    try {
      const res = await axios.post("https://hs-project-server.onrender.com/api/admin/register", {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setSuccess(res.data.message || "Registration successful!");
      setForm({ name: "", email: "", password: ""});
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Server error. Please try again later.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-accent flex flex-col justify-between">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <form className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md" onSubmit={handleSubmit}>
          <h2 className="font-heading text-2xl font-bold text-primary-dark mb-6 text-center">Register for new Admin!!</h2>
          {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
          {success && <div className="text-green-600 mb-4 text-center">{success}</div>}
          <input
            type="text"
            name="name"
            placeholder="Name"
            className="w-full mb-4 px-4 py-2 border rounded"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full mb-4 px-4 py-2 border rounded"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full mb-4 px-4 py-2 border rounded"
            value={form.password}
            onChange={handleChange}
            required
          />
          
          <button type="submit" className="bg-primary-dark text-black px-6 py-2 rounded font-bold w-full hover:bg-primary transition">Register</button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
