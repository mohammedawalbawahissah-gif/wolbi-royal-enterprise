"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "PENDING",
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.get("/projects/");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      status: "PENDING",
    });
    setEditingId(null);
  };

  // CREATE
  const createProject = async () => {
    try {
      await api.post("/projects/", form);
      resetForm();
      loadProjects();
    } catch (err) {
      console.error("Create failed:", err);
    }
  };

  // UPDATE
  const updateProject = async () => {
    try {
      await api.put(`/projects/${editingId}/`, form);
      resetForm();
      loadProjects();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  // DELETE
  const deleteProject = async (id) => {
    try {
      await api.delete(`/projects/${id}/`);
      loadProjects();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // EDIT MODE
  const startEdit = (project) => {
    setForm({
      title: project.title,
      description: project.description,
      status: project.status,
    });
    setEditingId(project.id);
  };

  return (
    <div>
      <h1>Projects Management</h1>

      {/* FORM */}
      <div style={{ marginBottom: "20px" }}>
        <input
          name="title"
          placeholder="Project Title"
          value={form.title}
          onChange={handleChange}
        />

        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />

        <select name="status" value={form.status} onChange={handleChange}>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {editingId ? (
          <>
            <button onClick={updateProject}>Update</button>
            <button onClick={resetForm}>Cancel</button>
          </>
        ) : (
          <button onClick={createProject}>Create</button>
        )}
      </div>

      {/* LIST */}
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.title}</td>
              <td>{project.description}</td>
              <td>{project.status}</td>

              <td>
                <button onClick={() => startEdit(project)}>Edit</button>
                <button onClick={() => deleteProject(project.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}