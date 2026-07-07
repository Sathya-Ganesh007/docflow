import { createClient } from "@/utils/supabase/client";
import type { Document } from "@/types";

export async function fetchMyDocuments(ownerId: string): Promise<Document[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, content, owner_id, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchSharedDocuments(
  userId: string,
): Promise<Document[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("document_shares")
    .select("documents(id, title, content, owner_id, updated_at)")
    .eq("shared_with", userId);

  if (error) {
    const { data: shares, error: sharesError } = await supabase
      .from("document_shares")
      .select("document_id")
      .eq("shared_with", userId);

    if (sharesError) throw sharesError;
    if (!shares?.length) return [];

    const ids = shares.map((share) => share.document_id);
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, title, content, owner_id, updated_at")
      .in("id", ids)
      .order("updated_at", { ascending: false });

    if (docsError) throw docsError;
    return docs ?? [];
  }

  return (data ?? [])
    .flatMap((row) => {
      const doc = row.documents;
      if (!doc) return [];
      if (Array.isArray(doc)) return doc as Document[];
      return [doc as Document];
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
}

export async function getDocument(id: string): Promise<Document | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, content, owner_id, updated_at")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(ownerId: string): Promise<Document> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      title: "Untitled Document",
      content: "",
      owner_id: ownerId,
    })
    .select("id, title, content, owner_id, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function createDocumentFromUpload(
  ownerId: string,
  title: string,
  textContent: string,
): Promise<Document> {
  const supabase = createClient();
  const htmlContent = textToHtml(textContent);

  const { data, error } = await supabase
    .from("documents")
    .insert({
      title,
      content: htmlContent,
      owner_id: ownerId,
    })
    .select("id, title, content, owner_id, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export function getTitleFromFilename(filename: string): string {
  return filename.replace(/\.(txt|md)$/i, "");
}

export function isAllowedUploadFile(filename: string): boolean {
  return /\.(txt|md)$/i.test(filename);
}

export function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<p>${escaped.replace(/\n/g, "<br>")}</p>`;
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export async function updateDocument(
  id: string,
  updates: { title?: string; content?: string },
): Promise<Document> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, content, owner_id, updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentTitle(
  id: string,
  title: string,
): Promise<Document> {
  return updateDocument(id, { title });
}

export async function deleteDocument(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function shareDocument(
  documentId: string,
  email: string,
): Promise<void> {
  const supabase = createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email.trim())
    .single();

  if (userError || !user) {
    throw new Error("No user found with that email address.");
  }

  const { error: shareError } = await supabase.from("document_shares").insert({
    document_id: documentId,
    shared_with: user.id,
  });

  if (shareError) {
    if (shareError.code === "23505") {
      throw new Error("This document is already shared with that user.");
    }
    throw shareError;
  }
}

export function formatDocumentTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
