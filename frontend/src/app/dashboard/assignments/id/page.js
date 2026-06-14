"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import FileUploader from "@/components/FileUploader";

export default function AssignmentDetail({ params }) {
  const [assignment, setAssignment] = useState(null);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    loadAssignment();
    loadFiles();
  }, []);

  const loadAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${params.id}/`);
      setAssignment(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadFiles = async () => {
    try {
      const res = await api.get(`/files/?assignment=${params.id}`);
      setFiles(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!assignment) {
    return <p>Loading assignment...</p>;
  }

  return (
    <div>
      <h1>{assignment.title}</h1>

      <p>{assignment.description}</p>

      <p>
        <strong>Status:</strong> {assignment.status}
      </p>

      <p>
        <strong>Assigned To:</strong> {assignment.assigned_to}
      </p>

      <hr />

      <h2>Evidence Uploads</h2>

      <FileUploader
        assignmentId={assignment.id}
        onUploaded={loadFiles}
      />

      <h3>Uploaded Files</h3>

      {files.length === 0 ? (
        <p>No files uploaded.</p>
      ) : (
        files.map((file) => (
          <div key={file.id}>
            <a
              href={file.file}
              target="_blank"
              rel="noopener noreferrer"
            >
              {file.name}
            </a>
          </div>
        ))
      )}
    </div>
  );
}