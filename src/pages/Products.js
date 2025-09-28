// src/pages/Products.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Footer from "../components/Footer";

export default function Products() {
  const API_BASE = "https://hs-project-server.onrender.com";

  const [view, setView] = useState(null); // 'haircare' or 'skincare'
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    images: [], // array of image IDs (final array used for product)
    range: "",
    hairType: "",
    concern: ""
  });

  // imageList holds mixed items for ordering in modal:
  // { type: 'existing', id: '68abc...' } or { type: 'new', file: File, preview: 'blob:url' }
  const [imageList, setImageList] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState([]); // for file input (not used directly for ordering)
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    if (view) fetchProducts();
  }, [view]);

  const fetchProducts = async () => {
    try {
      const endpoint = view === 'haircare' ? 'haircare' : 'skincare';
      const res = await axios.get(`${API_BASE}/api/${endpoint}`);
      setProducts(res.data);
    } catch (err) {
      setError("Failed to fetch products");
    }
  };

  // --- Helpers for imageList manipulation ---
  const addNewFilesToImageList = (files) => {
    const newItems = Array.from(files).map(file => ({
      type: 'new',
      file,
      preview: URL.createObjectURL(file),
    }));
    setImageList(prev => [...prev, ...newItems]);
  };

  const moveImage = (index, direction) => {
    setImageList(prev => {
      const arr = [...prev];
      const to = index + direction;
      if (to < 0 || to >= arr.length) return arr;
      const tmp = arr[to];
      arr[to] = arr[index];
      arr[index] = tmp;
      return arr;
    });
  };

  const removeImageAt = (index) => {
    setImageList(prev => {
      const arr = [...prev];
      const removed = arr.splice(index, 1)[0];
      // revoke objectURL for new files
      if (removed && removed.type === 'new' && removed.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return arr;
    });
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addNewFilesToImageList(files);
    // keep selectedFiles for compatibility, but not strictly needed
    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
  };

  // --- Form field change handler (non-image) ---
  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // --- Open edit modal prefill imageList with existing image ids ---
  const handleEdit = product => {
    setEditId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images || [],
      range: product.range || "",
      hairType: (product.hairType || []).join(", "),
      concern: (product.concern || []).join(", "),
      skinType: (product.skinType || []).join(", "),
      skinConcern: (product.skinConcern || []).join(", ")
    });

    // Build imageList from existing images: product.images holds ids or urls
    const existingItems = (product.images || []).map(img => {
      if (typeof img === 'string' && /^[a-f\d]{24}$/i.test(img)) return { type: 'existing', id: img };
      return { type: 'existing', id: img };
    });

    setSelectedFiles([]);
    setImageList(existingItems);
    setModalOpen(true);
  };

  const openAddModal = () => {
  setEditId(null);
  setForm({ name: "", description: "", price: "", images: [], range: "", hairType: "", concern: "", skinType: "", skinConcern: "" });
  setImageList([]);
  setSelectedFiles([]);
  setModalOpen(true);
  };

  // --- Submit handler: upload new files in the order they appear, merge IDs according to imageList order ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // 1) prepare list of new files in the order they appear in imageList
      const newFileItems = imageList.filter(item => item.type === 'new');
      let uploadedIds = [];

      if (newFileItems.length > 0) {
        const formData = new FormData();
        // append in the same order as imageList to preserve order
        newFileItems.forEach((it) => {
          formData.append('images', it.file);
        });

        // call upload endpoint - expecting { files: [{ id: '...', filename: '...' }, ...] } or similar
        const uploadRes = await axios.post(`${API_BASE}/api/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // normalize response: handle different shapes gracefully
        // prefer uploadRes.data.files array of objects with id, otherwise uploadRes.data.fileId or uploadRes.data.ids
        if (uploadRes.data) {
          if (Array.isArray(uploadRes.data.files)) {
            uploadedIds = uploadRes.data.files.map(f => f.id || f.fileId || f._id || f._id?.toString());
          } else if (Array.isArray(uploadRes.data.ids)) {
            uploadedIds = uploadRes.data.ids;
          } else if (uploadRes.data.fileId) {
            uploadedIds = [uploadRes.data.fileId];
          } else if (uploadRes.data.files && typeof uploadRes.data.files === 'string') {
            uploadedIds = [uploadRes.data.files];
          } else {
            // fallback: if server returns file objects directly
            // try to extract any id-like prop from uploadRes.data
            // (if you know exact response format, adjust above)
            console.warn('Unknown upload response format', uploadRes.data);
          }
        }

        // If server didn't return ids correctly, throw
        if (uploadedIds.length !== newFileItems.length) {
          // Try a common alternative: some servers return files: [{ id: '...' }] or files: ['id1','id2']
          // If lengths mismatch, continue cautiously but try to map new files in sequence by trusting returned order
          if (uploadedIds.length === 0) {
            throw new Error('Upload did not return file ids in expected format.');
          }
        }
      }

      // 2) build final images array in the order of imageList
      const finalImageIds = [];
      let uploadIndex = 0;
      for (const item of imageList) {
        if (item.type === 'existing') {
          // could be objectId string or a URL/path; for existing URLs you might need special handling
          finalImageIds.push(item.id);
        } else {
          // new item - pick next uploaded id
          const id = uploadedIds[uploadIndex];
          uploadIndex++;
          finalImageIds.push(id);
        }
      }

      // If there were no imageList items but maybe form.images already had some (edge case), use that
      const imagesToSave = finalImageIds.length > 0 ? finalImageIds : (form.images || []);

      // 3) prepare payload (same as your previous logic but using imagesToSave)
      const endpoint = view === 'haircare' ? 'haircare' : 'skincare';
      let payload;
      if (endpoint === 'skincare') {
        payload = {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          images: imagesToSave,
          range: form.range,
          skinType: form.skinType ? form.skinType.split(",").map(s => s.trim()).filter(Boolean) : [],
          skinConcern: form.skinConcern ? form.skinConcern.split(",").map(s => s.trim()).filter(Boolean) : []
        };
      } else {
        payload = {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          images: imagesToSave,
          range: form.range,
          hairType: form.hairType ? form.hairType.split(",").map(s => s.trim()).filter(Boolean) : [],
          concern: form.concern ? form.concern.split(",").map(s => s.trim()).filter(Boolean) : []
        };
      }

      // 4) send to backend
      if (editId) {
        await axios.put(`${API_BASE}/api/${endpoint}/${editId}`, payload);
        setSuccess("Product updated successfully");
      } else {
        await axios.post(`${API_BASE}/api/${endpoint}`, payload);
        setSuccess("Product added successfully");
      }

      // cleanup previews for new files
      imageList.forEach(item => {
        if (item.type === 'new' && item.preview) URL.revokeObjectURL(item.preview);
      });

      // reset form & states
  setForm({ name: "", description: "", price: "", images: [], range: "", hairType: "", concern: "", skinType: "", skinConcern: "" });
      setSelectedFiles([]);
      setImageList([]);
      setEditId(null);
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError("Failed to save product or upload images");
    }
  };

  const handleDelete = async id => {
    try {
      const endpoint = view === 'haircare' ? 'haircare' : 'skincare';
      await axios.delete(`${API_BASE}/api/${endpoint}/${id}`);
      setSuccess("Product deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Failed to delete product");
    }
    setDeleteConfirm({ open: false, id: null });
  };

  return (
    <div className="min-h-screen bg-accent flex flex-col justify-between">
      <Navbar />
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-heading text-primary-dark mb-8 text-center">Admin Product Management</h1>
        {!view ? (
          <div className="flex justify-center gap-8 mt-12">
            <button className="bg-primary-dark text-black px-8 py-4 rounded-lg text-xl font-bold hover:bg-primary transition" onClick={() => setView('haircare')}>Haircare</button>
            <button className="bg-primary-dark text-black px-8 py-4 rounded-lg text-xl font-bold hover:bg-primary transition" onClick={() => setView('skincare')}>Skincare</button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setView(null)}>Back</button>
              <button className="bg-primary-dark text-black px-6 py-2 rounded font-bold hover:bg-primary transition" onClick={openAddModal}>Add Product</button>
            </div>
            {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
            {success && <div className="text-green-600 mb-4 text-center">{success}</div>}

            {/* Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
                  {/* Image slider for all images */}
                  <div className="w-full mb-4">
                    <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
                      {(product.images || []).map((img, idx) => {
                        // Helper to get image src
                        let src = "";
                        if (typeof img === "string" && /^[a-f\d]{24}$/i.test(img)) {
                          src = `${API_BASE}/api/image/${img}`;
                        } else if (typeof img === "string" && img.startsWith("http")) {
                          src = img;
                        } else if (typeof img === "string" && img.startsWith("/")) {
                          src = `${API_BASE}${img}`;
                        } else {
                          src = `${API_BASE}/${img}`.replace(/([^:]\/)+/g, "$1");
                        }
                        return (
                          <div key={idx} className="flex justify-center">
                            <img
                              src={src}
                              alt={product.name}
                              className="h-40 w-40 object-cover rounded mx-auto"
                              onError={e => {
                                e.currentTarget.src = 'https://via.placeholder.com/150';
                                console.warn('Image failed to load:', src);
                              }}
                            />
                          </div>
                        );
                      })}
                    </Slider>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">₹{product.price}</p>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  {product.range && <p className="text-sm text-gray-600 mb-2"><b>Range:</b> {product.range}</p>}
                  {/* Show hairType/skinType */}
                  {product.hairType && product.hairType.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2"><b>Hair Type:</b> {product.hairType.join(", ")}</p>
                  )}
                  {product.skinType && product.skinType.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2"><b>Skin Type:</b> {product.skinType.join(", ")}</p>
                  )}
                  {/* Show concern/skinConcern */}
                  {product.concern && product.concern.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2"><b>Concern:</b> {product.concern.join(", ")}</p>
                  )}
                  {product.skinConcern && product.skinConcern.length > 0 && (
                    <p className="text-sm text-gray-600 mb-2"><b>Skin Concern:</b> {product.skinConcern.join(", ")}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => handleEdit(product)}>Edit</button>
                    <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => setDeleteConfirm({ open: true, id: product._id })}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Add/Edit */}
            {modalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl" onClick={() => setModalOpen(false)}>&times;</button>
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold mb-4">{editId ? "Edit Product" : "Add Product"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border rounded px-4 py-2" required />
                      <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" className="border rounded px-4 py-2" required />
                      {/* File input (select new files to add to imageList) */}
                      <input name="images" type="file" accept="image/png, image/jpeg, image/jpg" multiple onChange={handleFileInputChange} className="border rounded px-4 py-2" />
                      <input name="range" value={form.range} onChange={handleChange} placeholder="Range" className="border rounded px-4 py-2" />
                      <input name="hairType" value={form.hairType} onChange={handleChange} placeholder="Hair Type (comma separated)" className="border rounded px-4 py-2" />
                      <input name="concern" value={form.concern} onChange={handleChange} placeholder="Concern (comma separated)" className="border rounded px-4 py-2" />
                    </div>

                    {/* Image ordering UI */}
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Images (drag-order via buttons)</h4>
                      {imageList.length === 0 ? (
                        <div className="text-sm text-gray-500 mb-2">No images selected. Use the file input to add images, or save product then edit to add images.</div>
                      ) : (
                        <div className="flex gap-3 flex-wrap mb-3">
                          {imageList.map((it, idx) => (
                            <div key={idx} className="w-20 text-center">
                              <div className="w-20 h-20 mb-1 overflow-hidden rounded border">
                                {it.type === 'new' ? (
                                  <img src={it.preview} alt="preview" className="w-full h-full object-cover" />
                                ) : (
                                  // existing: could be an id or url
                                  <img
                                    src={typeof it.id === 'string' && /^[a-f\d]{24}$/i.test(it.id) ? `${API_BASE}/api/image/${it.id}` : (typeof it.id === 'string' && it.id.startsWith('/') ? `${API_BASE}${it.id}` : it.id)}
                                    alt="existing"
                                    className="w-full h-full object-cover"
                                    onError={e => { e.currentTarget.src = 'https://via.placeholder.com/150'; }}
                                  />
                                )}
                              </div>

                              <div className="flex flex-col gap-1">
                                <button type="button" onClick={() => moveImage(idx, -1)} className="text-xs bg-gray-100 rounded px-1 py-1">←</button>
                                <button type="button" onClick={() => moveImage(idx, +1)} className="text-xs bg-gray-100 rounded px-1 py-1">→</button>
                                <button type="button" onClick={() => removeImageAt(idx)} className="text-xs bg-red-100 text-red-700 rounded px-1 py-1">Remove</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border rounded px-4 py-2 mt-4 w-full" required />

                    <div className="mt-4 flex items-center">
                      <button type="submit" className="bg-primary-dark text-black px-6 py-2 rounded font-bold hover:bg-primary transition">{editId ? "Update" : "Add"}</button>
                      {editId && <button type="button" className="ml-4 px-6 py-2 rounded font-bold bg-gray-300 hover:bg-gray-400" onClick={() => { setEditId(null); setForm({ name: "", description: "", price: "", images: [], range: "", hairType: "", concern: "" }); setModalOpen(false); }}>Cancel</button>}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Delete Confirmation */}
            {deleteConfirm.open && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm relative flex flex-col items-center">
                  <button className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl" onClick={() => setDeleteConfirm({ open: false, id: null })}>&times;</button>
                  <h2 className="text-xl font-bold mb-4 text-center">Are you sure you want to delete this product?</h2>
                  <div className="flex gap-4 mt-2">
                    <button className="bg-red-500 text-white px-6 py-2 rounded font-bold" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
                    <button className="bg-gray-300 px-6 py-2 rounded font-bold" onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
