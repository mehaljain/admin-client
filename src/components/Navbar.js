import React from "react";

const RegisterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75v-.75z" />
  </svg>
);

export default function Navbar() {
  return (
    <nav className="bg-gray-100 shadow flex items-center justify-between px-8 py-4 w-full">
      <div className="flex-1 flex justify-center">
        <span className="bg-gray-600 text-white px-8 py-3 rounded-lg text-2xl font-bold tracking-wide">HSFreshFaces</span>
      </div>
      <a href="/register" className="ml-4 flex items-center justify-center text-gray-600 hover:text-primary-dark">
        <RegisterIcon />
      </a>
    </nav>
  );
}
