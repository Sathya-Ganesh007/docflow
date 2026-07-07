"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Upload,
  Users,
  FolderOpen,
  LogOut,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearCurrentUser } from "@/lib/auth";
import {
  deleteDocument,
  formatDocumentTime,
  updateDocumentTitle,
} from "@/lib/documents";
import type { Document } from "@/types";

type AppSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
  myDocuments: Document[];
  sharedDocuments: Document[];
  selectedDocumentId?: string | null;
  loading?: boolean;
  creating?: boolean;
  uploading?: boolean;
  onNewDocument: () => void;
  onSelectDocument: (id: string) => void;
  onUploadFile: (file: File) => void;
  onUploadError: (message: string) => void;
  onDocumentRenamed: (id: string, title: string, updatedAt: string) => void;
  onDocumentDeleted: (id: string) => void;
};

export function AppSidebar({
  userName,
  userEmail,
  myDocuments,
  sharedDocuments,
  selectedDocumentId,
  loading = false,
  creating = false,
  uploading = false,
  onNewDocument,
  onSelectDocument,
  onUploadFile,
  onUploadError,
  onDocumentRenamed,
  onDocumentDeleted,
}: AppSidebarProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const displayName = userName || userEmail?.split("@")[0] || "User";
  const displayEmail = userEmail || "";
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  function startRename(
    doc: Document,
    event: { stopPropagation: () => void },
  ) {
    event.stopPropagation();
    setEditingDocId(doc.id);
    setEditingTitle(doc.title);
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }

  function cancelRename() {
    setEditingDocId(null);
    setEditingTitle("");
  }

  async function commitRename(doc: Document) {
    const nextTitle = editingTitle.trim() || "Untitled Document";

    if (nextTitle === doc.title) {
      cancelRename();
      return;
    }

    try {
      const updated = await updateDocumentTitle(doc.id, nextTitle);
      onDocumentRenamed(updated.id, updated.title, updated.updated_at);
    } catch {
      onUploadError("Failed to rename document");
    } finally {
      cancelRename();
    }
  }

  async function handleDeleteDocument(
    doc: Document,
    event: { stopPropagation: () => void },
  ) {
    event.stopPropagation();

    const shouldDelete = window.confirm("Delete this document?");
    if (!shouldDelete) return;

    try {
      await deleteDocument(doc.id);
      onDocumentDeleted(doc.id);
    } catch {
      onUploadError("Failed to delete document");
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "txt" && extension !== "md") {
      onUploadError("Only .txt and .md files are supported");
      return;
    }

    onUploadFile(file);
  }

  function handleLogout() {
    clearCurrentUser();
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 border-b border-sidebar-border px-2">
        <div className="flex h-full items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <FileText className="size-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold">DocFlow</span>
            <span className="truncate text-xs text-muted-foreground">
              Google Docs clone
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="px-2 pt-2 group-data-[collapsible=icon]:px-0">
          <Button
            className="w-full bg-blue-600 text-white shadow hover:bg-blue-700 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
            size="sm"
            disabled={creating}
            onClick={onNewDocument}
            title="Create a new document"
          >
            <Plus className="size-5" />
            <span className="group-data-[collapsible=icon]:hidden">
              {creating ? "Creating..." : "New Document"}
            </span>
          </Button>
        </div>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>
            <FolderOpen className="size-4" />
            My Documents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <FileText />
                    <span>Loading...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : myDocuments.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <FileText />
                    <span className="text-muted-foreground">No documents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                myDocuments.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      tooltip={doc.title}
                      isActive={selectedDocumentId === doc.id}
                      onClick={() => onSelectDocument(doc.id)}
                    >
                      <FileText />
                      <div
                        className={`flex min-w-0 flex-1 flex-col items-start ${
                          editingDocId === doc.id ? "pr-0" : "pr-12"
                        }`}
                      >
                        {editingDocId === doc.id ? (
                          <input
                            ref={renameInputRef}
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => void commitRename(doc)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void commitRename(doc);
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                cancelRename();
                              }
                            }}
                            className="h-6 w-full rounded-sm border border-sidebar-border bg-sidebar px-1 text-sm outline-none focus:ring-1 focus:ring-sidebar-ring"
                          />
                        ) : (
                          <span className="truncate">{doc.title}</span>
                        )}
                        {editingDocId !== doc.id && (
                          <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                            {formatDocumentTime(doc.updated_at)}
                          </span>
                        )}
                      </div>
                    </SidebarMenuButton>
                    {editingDocId !== doc.id && (
                      <div className="absolute right-2 top-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover/menu-item:opacity-100 group-data-[collapsible=icon]:hidden">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => startRename(doc, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              startRename(doc, e);
                            }
                          }}
                          className="rounded-sm p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-blue-500"
                          title="Rename"
                        >
                          <Pencil className="size-4" />
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => void handleDeleteDocument(doc, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              void handleDeleteDocument(doc, e);
                            }
                          }}
                          className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </div>
                      </div>
                    )}
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>
            <Users className="size-4" />
            Shared with Me
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <FileText />
                    <span>Loading...</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : sharedDocuments.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <FileText />
                    <span className="text-muted-foreground">No shared docs</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                sharedDocuments.map((doc) => (
                  <SidebarMenuItem key={doc.id}>
                    <SidebarMenuButton
                      tooltip={doc.title}
                      isActive={selectedDocumentId === doc.id}
                      onClick={() => onSelectDocument(doc.id)}
                    >
                      <FileText />
                      <div className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate">{doc.title}</span>
                        <span className="truncate text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                          {formatDocumentTime(doc.updated_at)}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1 group-data-[collapsible=icon]:px-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="w-full group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
            size="sm"
            disabled={uploading}
            onClick={handleUploadClick}
          >
            <Upload className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">
              {uploading ? "Uploading..." : "Upload File"}
            </span>
          </Button>
        </div>
        <SidebarSeparator />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
              <ChevronUp className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate text-sm">{displayName}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {displayEmail}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

