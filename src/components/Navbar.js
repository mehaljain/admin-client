import React from "react";

const RegisterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-7 h-7"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.75z"
    />
  </svg>
);

export default function Navbar() {
  return (
    <nav className="bg-gray-100 shadow flex items-center justify-between px-8 py-4 w-full">
      {/* Logo / Brand */}
      <div className="flex-1 flex justify-start">
        <span className="bg-gray-600 text-white px-6 py-2 rounded-lg text-xl font-bold tracking-wide">
          HSFreshFaces
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-6">
        <a
          href="/dashboard"
          className="text-gray-700 font-medium hover:text-primary-dark"
        >
          Dashboard
        </a>
        <a
          href="/products"
          className="text-gray-700 font-medium hover:text-primary-dark"
        >
          Manage Products
        </a>
        <a
          href="/offers"
          className="text-gray-700 font-medium hover:text-primary-dark"
        >
          Manage Offers
        </a>
      </div>

      {/* Register Button */}
      <a
        href="/register"
        className="ml-6 flex items-center justify-center text-gray-600 hover:text-primary-dark"
      >
        <RegisterIcon />
      </a>
    </nav>
  );
}
