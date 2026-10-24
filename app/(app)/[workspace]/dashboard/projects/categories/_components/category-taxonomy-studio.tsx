"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "../actions";

interface Category {
  nanoid: string;
  name: string;
  key: string;
  description: string;
  color: string;
  is_active: boolean;
  position: number;
}

interface Props {
  categories: Category[];
  workspaceDomain: string;
}

export function CategoryTaxonomyStudio({
  categories,
  workspaceDomain,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const idleState = { status: "idle" as const, message: "" };

  const handleCreate = async (formData: FormData) => {
    const result = await createCategoryAction(idleState, formData);
    if (result.status === "error") {
      setActionError(result.message);
    } else {
      setActionMessage(result.message);
      setAddOpen(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    const result = await updateCategoryAction(idleState, formData);
    if (result.status === "error") {
      setActionError(result.message);
    } else {
      setActionMessage(result.message);
      setEditTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categories
          </h2>
          <p className="text-xs text-muted-foreground">
            Classify projects with workspace-defined categories.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add category
        </Button>
      </div>

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {actionMessage ? (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          {actionMessage}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No categories yet. Add one to start classifying projects.
        </p>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {categories.map((category) => (
            <div
              key={category.nanoid}
              className="px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    category.color
                      ? `bg-${category.color}/10 text-${category.color} border-${category.color}/20`
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {category.key}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{category.name}</div>
                  {category.description && (
                    <p className="text-xs text-muted-foreground truncate max-w-[30rem]">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {category.is_active ? "Active" : "Inactive"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => setEditTarget(category)}
                >
                  <Edit3 className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(category)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <form action={handleCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add category</DialogTitle>
              <DialogDescription>
                Create a new project category for this workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="category-name">Name</Label>
                <Input
                  id="category-name"
                  name="name"
                  required
                  maxLength={100}
                  placeholder="e.g. Marketing Campaigns"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-key">Key (machine name)</Label>
                <Input
                  id="category-key"
                  name="key"
                  placeholder="e.g. marketing"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from name if left blank.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-description">Description</Label>
                <Input
                  id="category-description"
                  name="description"
                  placeholder="What kind of projects use this category?"
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-color">Color</Label>
                <Input
                  id="category-color"
                  name="color"
                  placeholder="e.g. blue, amber, emerald"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">
                  Tailwind color name for the badge.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="category-is-active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="size-4 shrink-0 rounded border-input"
                />
                <Label htmlFor="category-is-active">Active</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category-position">Position</Label>
                <Input
                  id="category-position"
                  name="position"
                  type="number"
                  defaultValue={0}
                  min={0}
                />
              </div>
              <input
                type="hidden"
                name="workspace_domain"
                value={workspaceDomain}
              />
            </div>
            <DialogDescription>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              {actionMessage && (
                <p className="text-sm text-success">{actionMessage}</p>
              )}
            </DialogDescription>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create category</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editTarget !== null} onOpenChange={(open) => setEditTarget(open ? editTarget : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <form action={handleUpdate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit category</DialogTitle>
              <DialogDescription>
                Update the details of “{editTarget?.name}”.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-name">Name</Label>
                <Input
                  id="edit-category-name"
                  name="name"
                  defaultValue={editTarget?.name}
                  required
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-key">Key</Label>
                <Input
                  id="edit-category-key"
                  name="key"
                  defaultValue={editTarget?.key}
                  maxLength={50}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-description">Description</Label>
                <Input
                  id="edit-category-description"
                  name="description"
                  defaultValue={editTarget?.description}
                  maxLength={500}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-color">Color</Label>
                <Input
                  id="edit-category-color"
                  name="color"
                  defaultValue={editTarget?.color}
                  maxLength={20}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-category-is-active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={editTarget?.is_active}
                  className="size-4 shrink-0 rounded border-input"
                />
                <Label htmlFor="edit-category-is-active">Active</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-category-position">Position</Label>
                <Input
                  id="edit-category-position"
                  name="position"
                  type="number"
                  defaultValue={editTarget?.position}
                  min={0}
                />
              </div>
              <input type="hidden" name="nanoid" value={editTarget?.nanoid} />
              <input
                type="hidden"
                name="workspace_domain"
                value={workspaceDomain}
              />
            </div>
            <DialogDescription>
              {actionError && (
                <p className="text-sm text-destructive">{actionError}</p>
              )}
              {actionMessage && (
                <p className="text-sm text-success">{actionMessage}</p>
              )}
            </DialogDescription>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTarget(null)}
              >
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this category?"
        description={
          <div className="space-y-1">
            <p>“{deleteTarget?.name}” will be deleted.</p>
            <p className="text-xs text-muted-foreground">
              Projects using this category will keep their classification but
              will no longer be able to select it. This cannot be undone.
            </p>
          </div>
        }
        confirmLabel="Delete category"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const formData = new FormData();
          formData.append("nanoid", deleteTarget.nanoid);
          formData.append("workspace_domain", workspaceDomain);
          const result = await deleteCategoryAction(idleState, formData);
          if (result.status === "error") {
            setActionError(result.message);
          } else {
            setActionMessage(result.message);
          }
        }}
      />
    </div>
  );
}
