import React from "react";

export default function Footer() {
  return (
  <footer className="bg-gray-100 shadow mt-12 py-6 w-full text-center text-gray-500 text-sm">
      &copy; {new Date().getFullYear()} HSFreshFaces. All rights reserved.
    </footer>
  );
}
