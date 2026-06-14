"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function EditAssignmentPage({ params }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    status: "",
  });
  
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadUsers = async () => {
  try {
    const res = await api.get("/auth/users/");
    setUsers(res.data);
  } catch (error) {
    console.error(error);
  }
};
    loadUsers();
    loadAssignment();
  }, []);

  const loadAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${params.id}/`);

      setFormData({
        title: res.data.title || "",
        description: res.data.description || "",
        assigned_to: res.data.assigned_to || "",
        status: res.data.status || "PENDING",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.put(
        `/assignments/${params.id}/`,
        formData
      );

      router.push("/dashboard/assignments");
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Edit Assignment</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <br />
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Description</label>
          <br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Assigned User ID</label>
          <br />
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            >
            <option value="">
                Select User
            </option>

            {users.map((user) => (
                <option
                key={user.id}
                value={user.id}
                >
                {user.username} ({user.role})
                </option>
            ))}
          </select>
        </div>

        <br />

        <div>
          <label>Status</label>
          <br />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <br />

        <button>
          Update Assignment
        </button>
      </form>
    </div>
  );
}