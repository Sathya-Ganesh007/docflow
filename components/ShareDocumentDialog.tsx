"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { shareDocument } from "@/lib/documents";

type ShareDocumentDialogProps = {
  documentId: string;
  documentTitle: string;
};

export function ShareDocumentDialog({
  documentId,
  documentTitle,
}: ShareDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleShare() {
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await shareDocument(documentId, email.trim());
      setSuccess(`Document shared with ${email.trim()}`);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share document");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setEmail("");
      setError(null);
      setSuccess(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="size-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Share &quot;{documentTitle}&quot; with another user by email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleShare();
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
        </div>
        <DialogFooter>
          <Button
            onClick={() => void handleShare()}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
