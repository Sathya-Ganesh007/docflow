"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Editor } from "@/components/Editor";
import { ShareDocumentDialog } from "@/components/ShareDocumentDialog";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import {
  createDocument,
  createDocumentFromUpload,
  fetchMyDocuments,
  fetchSharedDocuments,
  getDocument,
  getTitleFromFilename,
  readFileAsText,
} from "@/lib/documents";
import type { AppUser, Document, SaveStatus } from "@/types";

export function DocsApp() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [clearEditorSelection, setClearEditorSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (saveStatus !== "saved") return;

    const timeout = setTimeout(() => {
      setSaveStatus("idle");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [saveStatus]);

  const loadDocuments = useCallback(async (userId: string) => {
    setLoadingDocs(true);
    setError(null);
    try {
      const [mine, shared] = await Promise.all([
        fetchMyDocuments(userId),
        fetchSharedDocuments(userId),
      ]);
      setMyDocuments(mine);
      setSharedDocuments(shared);
    } catch (err) {
      setMyDocuments([]);
      setSharedDocuments([]);
      setError(
        err instanceof Error ? err.message : "Failed to load documents",
      );
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    void loadDocuments(currentUser.id);
  }, [loadDocuments]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setActiveDocument(null);
      setLastSavedAt(null);
      setSaveStatus("idle");
      return;
    }

    let cancelled = false;
    setLoadingEditor(true);
    setSaveStatus("idle");

    getDocument(selectedDocumentId)
      .then((doc) => {
        if (!cancelled) {
          setActiveDocument(doc);
          setLastSavedAt(doc?.updated_at ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setActiveDocument(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingEditor(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId]);

  const handleNewDocument = async () => {
    if (!user || creating) return;

    setCreating(true);
    setError(null);
    try {
      const doc = await createDocument(user.id);
      await loadDocuments(user.id);
      setSelectedDocumentId(doc.id);
      setActiveDocument(doc);
      setLastSavedAt(doc.updated_at);
      setSaveStatus("idle");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDocumentUpdated = (title: string, updatedAt: string) => {
    if (!selectedDocumentId) return;

    const updateList = (docs: Document[]) =>
      docs.map((doc) =>
        doc.id === selectedDocumentId
          ? { ...doc, title, updated_at: updatedAt }
          : doc,
      );

    setMyDocuments(updateList);
    setSharedDocuments(updateList);
    setActiveDocument((prev) =>
      prev ? { ...prev, title, updated_at: updatedAt } : prev,
    );
    setLastSavedAt(updatedAt);
  };

  const handleSelectDocument = (id: string) => {
    setSelectedDocumentId(id);
    setSaveStatus("idle");
  };

  const handleUploadFile = async (file: File) => {
    if (!user || uploading) return;

    setUploading(true);
    setError(null);
    try {
      const text = await readFileAsText(file);
      const title = getTitleFromFilename(file.name);
      const doc = await createDocumentFromUpload(user.id, title, text);
      setMyDocuments((prev) => [doc, ...prev]);
      setClearEditorSelection(true);
      setSelectedDocumentId(doc.id);
      setActiveDocument(doc);
      setLastSavedAt(doc.updated_at);
      setSaveStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadError = (message: string) => {
    setError(message);
  };

  const handleSidebarDocumentRenamed = (
    id: string,
    title: string,
    updatedAt: string,
  ) => {
    const updateList = (docs: Document[]) =>
      docs.map((doc) =>
        doc.id === id ? { ...doc, title, updated_at: updatedAt } : doc,
      );

    setMyDocuments(updateList);
    setSharedDocuments(updateList);
    setActiveDocument((prev) =>
      prev && prev.id === id ? { ...prev, title, updated_at: updatedAt } : prev,
    );
    setLastSavedAt((prev) => (activeDocument?.id === id ? updatedAt : prev));
  };

  const handleSidebarDocumentDeleted = (id: string) => {
    setMyDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setSharedDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setActiveDocument((prev) => (prev?.id === id ? null : prev));
    setSelectedDocumentId((prev) => (prev === id ? null : prev));
    setLastSavedAt((prev) => (activeDocument?.id === id ? null : prev));
    setSaveStatus("idle");
  };

  const topbarTitle = activeDocument?.title ?? "DocFlow";
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return null;
    const diffMs = Date.now() - new Date(lastSavedAt).getTime();
    const minutes = Math.max(0, Math.floor(diffMs / 60000));
    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 min ago";
    if (minutes < 60) return `${minutes} mins ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  }, [lastSavedAt]);

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar
        userName={user?.name}
        userEmail={user?.email}
        myDocuments={myDocuments}
        sharedDocuments={sharedDocuments}
        selectedDocumentId={selectedDocumentId}
        loading={loadingDocs}
        creating={creating}
        uploading={uploading}
        onNewDocument={handleNewDocument}
        onSelectDocument={handleSelectDocument}
        onUploadFile={handleUploadFile}
        onUploadError={handleUploadError}
        onDocumentRenamed={handleSidebarDocumentRenamed}
        onDocumentDeleted={handleSidebarDocumentDeleted}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <h1 className="truncate text-lg font-semibold">{topbarTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            {activeDocument && (
              <ShareDocumentDialog
                documentId={activeDocument.id}
                documentTitle={activeDocument.title}
              />
            )}
            <ThemeSwitcher />
            {saveStatus !== "idle" && (
              <span className="shrink-0 text-sm text-muted-foreground">
                {saveStatus === "saving" && "Saving..."}
                {saveStatus === "saved" && "Saved ✓"}
              </span>
            )}
            {activeDocument && lastSavedLabel && (
              <span className="shrink-0 text-xs text-muted-foreground">
                Last saved: {lastSavedLabel}
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loadingEditor && selectedDocumentId ? (
          <div className="flex flex-1 flex-col gap-4 p-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : activeDocument ? (
          <Editor
            key={activeDocument.id}
            documentId={activeDocument.id}
            initialTitle={activeDocument.title}
            initialContent={activeDocument.content}
            clearSelectionOnLoad={clearEditorSelection}
            onDocumentUpdated={handleDocumentUpdated}
            onSaveStatusChange={setSaveStatus}
            onSelectionCleared={() => setClearEditorSelection(false)}
          />
        ) : (
          <main className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <FileText className="size-10" />
            </div>
            <h2 className="text-xl font-medium text-muted-foreground">
              Select a document or create a new one
            </h2>
            <button
              type="button"
              onClick={() => void handleNewDocument()}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow hover:bg-blue-700"
              disabled={creating}
              title="Create a new document"
            >
              <Plus className="size-5" />
              {creating ? "Creating..." : "New Document"}
            </button>
          </main>
        )}
      </SidebarInset>
    </div>
  );
}
