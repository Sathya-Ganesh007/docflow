export type AppUser = {
  id: string;
  name: string;
  email: string;
};

export type Document = {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  updated_at: string;
};

export type DocumentShare = {
  id: string;
  document_id: string;
  shared_with: string;
  documents?: Document;
};

export type SaveStatus = "idle" | "saving" | "saved";
