import React, { useState, useEffect, useRef } from "react";
import VispanaApiClient from "../../client/vispana-api-client";
import SyntaxHighlighter from "react-syntax-highlighter";
import { androidstudio } from "react-syntax-highlighter/dist/cjs/styles/hljs";

function Documents({ containerUrl, schema, editDocument, onEditConsumed }) {
  const vispanaClient = new VispanaApiClient();
  const lastEditRef = useRef(null);

  const [namespace, setNamespace] = useState(schema);
  const [documentType, setDocumentType] = useState(schema);
  const [documentId, setDocumentId] = useState("");
  const [documentBody, setDocumentBody] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState({ hasError: false, error: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  // Handle edit document from other tabs (Query/Preview grid)
  useEffect(() => {
    if (!editDocument || editDocument === lastEditRef.current) return;
    lastEditRef.current = editDocument;

    // Try to extract document ID from the row data
    // Vespa query results typically have an "id" field like "id:namespace:type::user-id"
    // or a "documentid" field
    const docIdField =
      editDocument.documentid || editDocument.id || editDocument.document_id;
    if (docIdField) {
      const parsed = parseVespaDocumentId(docIdField);
      if (parsed) {
        setNamespace(parsed.namespace);
        setDocumentType(parsed.documentType);
        setDocumentId(parsed.documentId);
        fetchAndFillDocument(
          parsed.namespace,
          parsed.documentType,
          parsed.documentId,
        );
      } else {
        // Not a full Vespa ID, just use it as document ID with current namespace/type
        setDocumentId(docIdField);
        fetchAndFillDocument(namespace, documentType, docIdField);
      }
    } else {
      // No ID field found — just fill the body with the row data as-is
      setDocumentBody(JSON.stringify({ fields: editDocument }, null, 2));
    }

    if (onEditConsumed) onEditConsumed();
  }, [editDocument]);

  async function fetchAndFillDocument(ns, docType, docId) {
    clearMessages();
    setLoading(true);
    try {
      const response = await vispanaClient.getDocument(
        containerUrl,
        ns,
        docType,
        docId,
      );
      if (response.fields) {
        setDocumentBody(JSON.stringify({ fields: response.fields }, null, 2));
        setSuccess("Document loaded for editing.");
      } else {
        // Fallback: put the whole response as body
        setDocumentBody(JSON.stringify(response, null, 2));
      }
      setResult(response);
    } catch (err) {
      setError({
        hasError: true,
        error: err.message || "Failed to fetch document for editing",
      });
    } finally {
      setLoading(false);
    }
  }

  function parseVespaDocumentId(input) {
    // Format: id:<namespace>:<document-type>::<user-specific-id>
    const match = input.match(/^id:([^:]+):([^:]+)::(.+)$/);
    if (match) {
      return {
        namespace: match[1],
        documentType: match[2],
        documentId: match[3],
      };
    }
    return null;
  }

  function handleDocumentIdChange(value) {
    const parsed = parseVespaDocumentId(value);
    if (parsed) {
      setNamespace(parsed.namespace);
      setDocumentType(parsed.documentType);
      setDocumentId(parsed.documentId);
    } else {
      setDocumentId(value);
    }
  }

  function clearMessages() {
    setError({ hasError: false, error: "" });
    setSuccess("");
    setResult(null);
  }

  async function handleOperation(operationName, operationFn) {
    clearMessages();
    setLoading(true);
    try {
      const response = await operationFn();
      if (response.error || response.message?.toLowerCase().includes("error")) {
        setError({
          hasError: true,
          error: response.message || JSON.stringify(response),
        });
      } else {
        setSuccess(`${operationName} completed successfully.`);
      }
      setResult(response);
    } catch (err) {
      setError({
        hasError: true,
        error: err.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleGet() {
    handleOperation("Get", () =>
      vispanaClient.getDocument(
        containerUrl,
        namespace,
        documentType,
        documentId,
      ),
    );
  }

  function handleSave() {
    handleOperation("Save", () =>
      vispanaClient.saveDocument(
        containerUrl,
        namespace,
        documentType,
        documentId,
        documentBody,
      ),
    );
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Are you sure you want to delete document "${documentId}"?`,
      )
    ) {
      return;
    }
    handleOperation("Delete", () =>
      vispanaClient.deleteDocument(
        containerUrl,
        namespace,
        documentType,
        documentId,
      ),
    );
  }

  return (
    <div className="p-4 min-w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div className="form-control">
          <label className="label" htmlFor="doc-namespace">
            <span className="label-text text-yellow-400">Namespace</span>
          </label>
          <input
            id="doc-namespace"
            type="text"
            placeholder="namespace"
            className="input input-bordered input-sm bg-standout-blue text-white w-full"
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="doc-type">
            <span className="label-text text-yellow-400">Document Type</span>
          </label>
          <input
            id="doc-type"
            type="text"
            placeholder="document type"
            className="input input-bordered input-sm bg-standout-blue text-white w-full"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
          />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="doc-id">
            <span className="label-text text-yellow-400">Document ID</span>
          </label>
          <input
            id="doc-id"
            type="text"
            placeholder="document ID or id:namespace:type::id"
            className="input input-bordered input-sm bg-standout-blue text-white w-full"
            value={documentId}
            onChange={(e) => handleDocumentIdChange(e.target.value)}
          />
        </div>
      </div>

      <div className="form-control mb-3">
        <label className="label" htmlFor="doc-body">
          <span className="label-text text-yellow-400">
            Document Body (JSON)
          </span>
        </label>
        <textarea
          id="doc-body"
          placeholder='{"fields": { ... }}'
          className="textarea textarea-bordered bg-standout-blue text-white w-full font-mono text-sm"
          rows={8}
          value={documentBody}
          onChange={(e) => setDocumentBody(e.target.value)}
        />
      </div>

      <div className="flex flex-row gap-2 mb-4 justify-end">
        <button
          className="btn btn-sm bg-standout-blue text-yellow-400 border-none outline-none"
          disabled={loading}
          onClick={handleGet}
        >
          <i className="fas fa-search pr-1" /> Get
        </button>
        <button
          className="btn btn-sm bg-standout-blue text-yellow-400 border-none outline-none"
          disabled={loading}
          onClick={handleSave}
        >
          <i className="fas fa-save pr-1" /> Save
        </button>
        <button
          className="btn btn-sm bg-red-700 text-white border-none outline-none"
          disabled={loading}
          onClick={handleDelete}
        >
          <i className="fas fa-trash pr-1" /> Delete
        </button>
      </div>

      {loading && (
        <div className="text-center text-yellow-400 py-4">Loading...</div>
      )}

      {success && !error.hasError && (
        <div className="alert alert-success mb-3 text-sm">
          <i className="fas fa-check-circle" /> {success}
        </div>
      )}

      {error.hasError && (
        <div className="alert alert-error mb-3 text-sm">
          <i className="fas fa-exclamation-circle" /> {error.error}
        </div>
      )}

      {result && (
        <div className="mt-2">
          <SyntaxHighlighter language="json" style={androidstudio}>
            {JSON.stringify(result, null, 2)}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export default Documents;
