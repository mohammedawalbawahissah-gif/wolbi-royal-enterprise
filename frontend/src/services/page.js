"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const res = await api.get("/services/");
    setServices(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ name: "", category: "", description: "" });
    setEditingId(null);
  };

  // CREATE
  const createService = async () => {
    await api.post("/services/", form);
    resetForm();
    loadServices();
  };

  // UPDATE
  const updateService = async () => {
    await api.put(`/services/${editingId}/`, form);
    resetForm();
    loadServices();
  };

  // DELETE
  const deleteService = async (id) => {
    await api.delete(`/services/${id}/`);
    loadServices();
  };

  // EDIT MODE
  const startEdit = (service) => {
    setForm({
      name: service.name,
      category: service.category,
      description: service.description,
    });
    setEditingId(service.id);
  };

  return (
    <div>
      <h1>Services Management</h1>

      {/* FORM */}
      <div style={{ marginBottom: "20px" }}>
        <input
          name="name"
          placeholder="Service Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />

        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        {editingId ? (
          <button onClick={updateService}>Update</button>
        ) : (
          <button onClick={createService}>Create</button>
        )}

        {editingId && <button onClick={resetForm}>Cancel</button>}
      </div>

      {/* LIST */}
      <ul>
        {services.map((s) => (
          <li key={s.id} style={{ marginBottom: "10px" }}>
            <strong>{s.name}</strong> — {s.category}

            <div>
              <button onClick={() => startEdit(s)}>Edit</button>
              <button onClick={() => deleteService(s.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}