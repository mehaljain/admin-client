import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-accent flex flex-col justify-between">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex w-full max-w-4xl">
          {/* Sidebar */}
          <div className="flex flex-col items-center justify-center bg-gray-100 rounded-l-xl shadow-lg p-8 w-32">
            <a href="/products" className="mb-8 flex flex-col items-center group">
              {/* Product Icon */}  
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7l9-4 9 4-9 4-9-4zm0 2v6a2 2 0 002 2h3v-4h4v4h3a2 2 0 002-2V9" />
              </svg>
              <span className="mt-2 text-sm text-black">Products</span>
            </a>
            <a href="/offers" className="flex flex-col items-center group">
              {/* Offer Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-dark group-hover:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0M12 3v4m0 0v4m0-4h4m-4 0H8m8 8a4 4 0 01-8 0m4-4v4m0 0v4m0-4h4m-4 0H8" />
              </svg>
              <span className="mt-2 text-sm text-black">Offers</span>
            </a>
          </div>

          {/* Main Dashboard Content */}
          <div className="bg-white w-full flex-1 flex flex-col justify-center items-center rounded-r-xl shadow-lg p-8">
            <h1 className="text-3xl font-heading text-primary-dark mb-4 text-center">
              Welcome to the Admin Panel
            </h1>
            <p className="text-gray-600 text-center">
              Use the navigation above to manage products and offers.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
