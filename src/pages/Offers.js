// src/pages/Offers.jsx
import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Offers() {
  const API_BASE = "http://localhost:5000";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search (debounced)
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Apply Offer modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [discount, setDiscount] = useState(""); // percentage
  const [basePrice, setBasePrice] = useState(""); // original price shown in modal
  const [modalLoading, setModalLoading] = useState(false); // loading single product
  const [modalApplying, setModalApplying] = useState(false); // applying offer

  // Add Offer modal + upload
  const [addOfferModalOpen, setAddOfferModalOpen] = useState(false);
  const [offerImage, setOfferImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Helper: normalize image source:
  // - if it's a 24-hex string (Mongo ObjectId) treat as GridFS id
  // - if starts with http(s) use as-is
  // - if starts with '/' treat as backend-relative
  // - otherwise prefix with API_BASE
  const normalizeImage = (img) => {
    if (!img) return null;
    if (typeof img === "string" && /^[a-f\d]{24}$/i.test(img)) {
      // GridFS file id -> stream endpoint
      return `${API_BASE}/api/image/${img}`;
    }
    if (typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"))) return img;
    if (typeof img === "string" && img.startsWith("/")) return `${API_BASE}${img}`;
    return `${API_BASE}/${img}`.replace(/([^:]\/)\/+/g, "$1");
  };

  // Fetch lists
  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const [skRes, hairRes] = await Promise.all([
        fetch(`${API_BASE}/api/skincare`).then((r) => r.json()),
        fetch(`${API_BASE}/api/haircare`).then((r) => r.json()),
      ]);
      const skincareArr = Array.isArray(skRes) ? skRes : (skRes.products || []);
      const hairArr = Array.isArray(hairRes) ? hairRes : (hairRes.products || []);
      const skincareProducts = skincareArr.map((p) => ({ ...p, category: "Skincare", images: Array.isArray(p.images) ? p.images.map(normalizeImage) : [] }));
      const hairProducts = hairArr.map((p) => ({ ...p, category: "Haircare", images: Array.isArray(p.images) ? p.images.map(normalizeImage) : [] }));
      setProducts([...skincareProducts, ...hairProducts]);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // debounce searchTerm -> debouncedSearch
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    return products.filter((p) => (p.name || "").toLowerCase().includes(debouncedSearch));
  }, [products, debouncedSearch]);

  // -----------------------
  // Upload Offer Image
  // -----------------------
  const handleUploadOfferImage = async () => {
    if (!offerImage) return alert("Select an image first");
    setUploading(true);
    const formData = new FormData();
    formData.append("image", offerImage);

    try {
      const url = `${API_BASE}/api/upload`; // keep consistent with your backend route
      console.log("[Upload] POST", url, offerImage);
      const res = await fetch(url, { method: "POST", body: formData });

      console.log("[Upload] status:", res.status, res.statusText);
      const bodyText = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(bodyText); } catch (e) { parsed = null; }

      if (!res.ok) {
        console.error("[Upload] failed body:", bodyText);
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      alert("Offer image uploaded successfully!");
      setAddOfferModalOpen(false);
      setOfferImage(null);
      // optionally refresh offers display or fetch offers list if you maintain an offers collection
    } catch (err) {
      console.error("[Upload] error:", err);
      alert("Failed to upload offer image. See console.");
    } finally {
      setUploading(false);
    }
  };

  // -----------------------
  // Open Apply Offer modal (fetch latest product)
  // -----------------------
  const handleOpenApplyModal = async (product) => {
    if (modalOpen) return; // guard double call
    console.log("handleOpenApplyModal called for id:", product?._id || product?.id);
    const id = product._id || product.id;
    setModalLoading(true);
    try {
      const endpoint = product.category === "Skincare" ? `${API_BASE}/api/skincare/${encodeURIComponent(id)}` : `${API_BASE}/api/haircare/${encodeURIComponent(id)}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      const incoming = data && (data.product ? data.product : data);
      const serverImages = Array.isArray(incoming.images) ? incoming.images.map(normalizeImage) : [];
      const prod = { ...incoming, category: product.category, images: serverImages };

      const original = prod.originalPrice ?? prod.oldPrice ?? prod.price;
      setSelectedProduct(prod);
      setBasePrice(original ?? "");
      setDiscount(prod.offer ?? "");
      setModalOpen(true);
    } catch (err) {
      console.error("Error opening apply modal:", err);
      alert("Failed to open product details. See console.");
    } finally {
      setModalLoading(false);
    }
  };

  // -----------------------
  // Apply the offer (use canonical originalPrice)
  // -----------------------
  const handleApplyOffer = async () => {
    if (!selectedProduct) return;
    setModalApplying(true);
    const id = selectedProduct._id || selectedProduct.id;
    // Use stored originalPrice if available (do not overwrite once set)
    const canonicalOriginal = Number(selectedProduct.originalPrice ?? selectedProduct.oldPrice ?? basePrice);
    const discountValue = Number(discount);

    if (Number.isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      setModalApplying(false);
      return alert("Enter a valid discount 0-100");
    }
    if (Number.isNaN(canonicalOriginal) || canonicalOriginal <= 0) {
      setModalApplying(false);
      return alert("Invalid original price");
    }

    const discountedPrice = Number((canonicalOriginal - (canonicalOriginal * discountValue) / 100).toFixed(2));
    const endpoint = selectedProduct.category === "Skincare" ? `${API_BASE}/api/skincare/${encodeURIComponent(id)}` : `${API_BASE}/api/haircare/${encodeURIComponent(id)}`;

    try {
      // Only set originalPrice if not already present
      const body = {
        price: discountedPrice,
        oldPrice: canonicalOriginal,
        originalPrice: selectedProduct.originalPrice ? selectedProduct.originalPrice : canonicalOriginal,
        offer: discountValue,
      };
      const res = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to apply offer");
      await fetchAllProducts();
      setModalOpen(false);
      setSelectedProduct(null);
      setDiscount("");
      setBasePrice("");
      alert("Offer applied successfully");
    } catch (err) {
      console.error("apply offer error:", err);
      alert("Failed to apply offer. See console.");
    } finally {
      setModalApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-accent flex flex-col justify-between">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-heading text-primary-dark mb-6 text-center">Admin Offer Management</h1>

        <div className="flex items-center mb-8 py-500 ">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full border rounded-lg px-4 py-2 "
            />
          
        </div>

        {/* Grid */}
        {loading ? <div className="text-center py-12">Loading...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? <div className="col-span-full text-center py-12">No products.</div> :
              filteredProducts.map((p) => (
                <div key={p._id || p.id} className="bg-white rounded-xl shadow p-6 flex flex-col items-center relative">
                  <img src={p.images?.[0] ?? "https://via.placeholder.com/150"} alt={p.name} className="h-32 w-32 object-cover rounded mb-4" />
                  <h3 className="font-bold text-center">{p.name}</h3>
                  <div className="text-sm text-gray-600">{p.category}</div>

                  {/* Price and old price */}
                  <div className="text-lg font-bold text-gray-900 mt-1">₹{p.price}</div>
                  {p.oldPrice ? (
                    <div className="text-sm text-gray-500">Was ₹{p.oldPrice} ({p.offer}% off)</div>
                  ) : null}

                
                    <div className="flex justify-center w-1/2">
                      <button
                        className="px-4 py-2 bg-gray-100 rounded w-full"
                        onClick={() => handleOpenApplyModal(p)}
                        disabled={modalLoading}
                      >
                        Apply Offer
                      </button>
                    </div>
                  
                </div>
              ))
            }
          </div>
        )}
      </div>

      

      {/* Apply Offer Modal */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Apply Offer to {selectedProduct.name}</h2>

            <label className="block font-semibold mb-1">Original Price (from server)</label>
            <input
              type="number"
              className="w-full border rounded px-3 py-2 mb-3"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              readOnly={!!selectedProduct?.originalPrice} // lock if originalPrice is present
            />
            {selectedProduct?.originalPrice && <div className="text-xs text-gray-500 mb-2">Original price locked. To change, edit product separately.</div>}

            <label className="block font-semibold mb-1">Discount %</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-3" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="e.g. 20" />

            {basePrice !== "" && discount !== "" && (
              <div className="mb-3">
                <strong>Preview:</strong> ₹{(Number(basePrice) - (Number(basePrice) * Number(discount) / 100)).toFixed(2)} <span className="line-through text-gray-400 ml-2">₹{basePrice}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 rounded bg-gray-300" onClick={() => setModalOpen(false)} disabled={modalApplying}>Cancel</button>
              <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={handleApplyOffer} disabled={modalApplying}>{modalApplying ? "Applying..." : "Apply"}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
