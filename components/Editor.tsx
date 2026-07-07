"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateDocument } from "@/lib/documents";
import type { SaveStatus } from "@/types";
import { cn } from "@/lib/utils";

type EditorProps = {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  clearSelectionOnLoad?: boolean;
  onDocumentUpdated?: (title: string, updatedAt: string) => void;
  onSaveStatusChange?: (status: SaveStatus) => void;
  onSelectionCleared?: () => void;
};

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-8 transition-colors",
        active && "bg-accent text-accent-foreground",
      )}
      onMouseDown={(e) => {
        // Keep current editor selection stable when clicking toolbar controls.
        e.preventDefault();
      }}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

function EditableTitle({
  title,
  onSave,
  onSaveStatusChange,
}: {
  title: string;
  onSave: (title: string) => Promise<void>;
  onSaveStatusChange?: (status: SaveStatus) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitTitle = async () => {
    const trimmed = value.trim() || "Untitled Document";
    setValue(trimmed);
    setIsEditing(false);

    if (trimmed === title) return;

    onSaveStatusChange?.("saving");
    try {
      await onSave(trimmed);
      onSaveStatusChange?.("saved");
    } catch {
      setValue(title);
      onSaveStatusChange?.("idle");
    }
  };

  const cancelEdit = () => {
    setValue(title);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => void commitTitle()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commitTitle();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
          }
        }}
        className="w-full bg-transparent text-2xl font-semibold outline-none ring-1 ring-ring rounded-sm px-1"
        placeholder="Untitled Document"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="group flex w-full min-w-0 items-center gap-2 text-left"
    >
      <span className="truncate text-2xl font-semibold">
        {title || "Untitled Document"}
      </span>
      <Pencil className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export function Editor({
  documentId,
  initialTitle,
  initialContent,
  clearSelectionOnLoad = false,
  onDocumentUpdated,
  onSaveStatusChange,
  onSelectionCleared,
}: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const pendingSave = useRef(false);
  const isFormattingChange = useRef(false);
  const formattingResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const contentRef = useRef(initialContent);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[60vh] px-8 py-6 focus:outline-none",
        "data-placeholder": "Start writing your document...",
      },
    },
    onUpdate: ({ editor: ed }) => {
      contentRef.current = ed.getHTML();
      if (!isFormattingChange.current) {
        pendingSave.current = true;
      }
    },
  });

  const runFormattingAction = useCallback((action: () => void) => {
    isFormattingChange.current = true;
    action();

    if (formattingResetTimer.current) {
      clearTimeout(formattingResetTimer.current);
    }
    formattingResetTimer.current = setTimeout(() => {
      isFormattingChange.current = false;
      // Persist formatting changes after selection settles.
      pendingSave.current = true;
    }, 100);
  }, []);

  useEffect(() => {
    setTitle(initialTitle);
    titleRef.current = initialTitle;
    contentRef.current = initialContent;
    pendingSave.current = false;
  }, [documentId, initialTitle, initialContent]);

  useEffect(() => {
    if (!clearSelectionOnLoad || !editor) return;

    requestAnimationFrame(() => {
      editor.commands.selectAll();
      editor.commands.setTextSelection(0);
      onSelectionCleared?.();
    });
  }, [clearSelectionOnLoad, editor, onSelectionCleared]);

  const saveContent = useCallback(async () => {
    if (!pendingSave.current) return;

    onSaveStatusChange?.("saving");
    try {
      const updated = await updateDocument(documentId, {
        title: titleRef.current,
        content: contentRef.current,
      });
      pendingSave.current = false;
      onSaveStatusChange?.("saved");
      onDocumentUpdated?.(updated.title, updated.updated_at);
    } catch {
      onSaveStatusChange?.("idle");
    }
  }, [documentId, onDocumentUpdated, onSaveStatusChange]);

  const saveTitle = useCallback(
    async (newTitle: string) => {
      const updated = await updateDocument(documentId, { title: newTitle });
      setTitle(updated.title);
      titleRef.current = updated.title;
      onDocumentUpdated?.(updated.title, updated.updated_at);
    },
    [documentId, onDocumentUpdated],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingSave.current) {
        void saveContent();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [saveContent]);

  useEffect(() => {
    return () => {
      if (formattingResetTimer.current) {
        clearTimeout(formattingResetTimer.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b px-6 py-3">
        <EditableTitle
          title={title}
          onSave={saveTitle}
          onSaveStatusChange={onSaveStatusChange}
        />
      </div>

      {editor && (
        <div className="flex flex-wrap items-center gap-0.5 border-b px-4 py-2">
          <ToolbarButton
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleBold().run();
              })
            }
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleItalic().run();
              })
            }
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleUnderline().run();
              })
            }
          >
            <UnderlineIcon className="size-4" />
          </ToolbarButton>
          <div className="mx-1 h-6 w-px bg-border" />
          <ToolbarButton
            title="Heading 1"
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              })
            }
          >
            <Heading1 className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              })
            }
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <div className="mx-1 h-6 w-px bg-border" />
          <ToolbarButton
            title="Bullet List"
            active={editor.isActive("bulletList")}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleBulletList().run();
              })
            }
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered List"
            active={editor.isActive("orderedList")}
            onClick={() =>
              runFormattingAction(() => {
                editor.chain().focus().toggleOrderedList().run();
              })
            }
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
