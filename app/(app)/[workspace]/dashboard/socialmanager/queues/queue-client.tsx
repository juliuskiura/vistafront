"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Send, ListOrdered, ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostQueue, PostQueueItem } from "@/lib/api/types";
import {
  createQueueAction,
  deleteQueueAction,
  scheduleQueueAction,
  createQueueItemAction,
  updateQueueItemAction,
  deleteQueueItemAction,
} from "../actions";

/* ──────────────────────────────────────────────────────────────────────
 * Queue Client — batch posting queues with interval scheduling
 * ────────────────────────────────────────────────────────────────────── */

interface QueueWithItems extends PostQueue {
  items: PostQueueItem[];
}

interface Props {
  queues: QueueWithItems[];
  workspaceDomain: string;
}

function SortableItem({
  item,
  onRemove,
  onUpdate,
}: {
  item: PostQueueItem;
  onRemove: (nanoid: string) => void;
  onUpdate: (nanoid: string, data: Partial<PostQueueItem>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.nanoid,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700">
          Position #{item.position + 1}
          {item.scheduled_post && (
            <span className="ml-2 text-[10px] text-slate-400">(linked to a post)</span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-[10px] text-slate-500">Interval</Label>
        <Input
          type="number"
          min={0}
          value={item.interval_minutes}
          onChange={(e) => onUpdate(item.nanoid, { interval_minutes: Number(e.target.value) })}
          className="h-7 w-20 text-xs"
        />
        <span className="text-[10px] text-slate-500">min</span>
      </div>
      <button
        onClick={() => onRemove(item.nanoid)}
        className="text-slate-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function QueueClient({ queues: initialQueues, workspaceDomain }: Props) {
  const ws = workspaceDomain.toLowerCase();
  const router = useRouter();
  const [queues, setQueues] = useState<QueueWithItems[]>(initialQueues);
  const [newQueueName, setNewQueueName] = useState("");
  const [expandedQueue, setExpandedQueue] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const sortedItems = useCallback(
    (queueNanoid: string) => {
      const q = queues.find((x) => x.nanoid === queueNanoid);
      return q ? [...q.items].sort((a, b) => a.position - b.position) : [];
    },
    [queues],
  );

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("name", newQueueName.trim());
    await createQueueAction({ status: "idle" }, fd, ws);
    setNewQueueName("");
    setBusy(false);
    router.refresh();
  };

  const handleDeleteQueue = async (queueNanoid: string) => {
    if (!confirm("Delete this queue and all its items?")) return;
    await deleteQueueAction(queueNanoid, ws);
    router.refresh();
  };

  const handleSchedule = async (queueNanoid: string) => {
    setBusy(true);
    await scheduleQueueAction(queueNanoid, ws);
    setBusy(false);
    router.refresh();
  };

  const handleAddItem = async (queueNanoid: string) => {
    const existing = queues.find((q) => q.nanoid === queueNanoid)?.items || [];
    setQueues((prev) =>
      prev.map((q) =>
        q.nanoid === queueNanoid
          ? {
              ...q,
              items: [
                ...q.items,
                {
                  id: `tmp-${Date.now()}`,
                  nanoid: `tmp-${Date.now()}`,
                  queue: queueNanoid,
                  scheduled_post: null,
                  position: existing.length,
                  interval_minutes: 0,
                } as PostQueueItem,
              ],
            }
          : q,
      ),
    );
    await createQueueItemAction(
      { queue: queueNanoid, position: existing.length, interval_minutes: 0 },
      ws,
    );
    router.refresh();
  };

  const handleDragEnd = (event: DragEndEvent, queueNanoid: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const items = sortedItems(queueNanoid);
    const oldIndex = items.findIndex((i) => i.nanoid === active.id);
    const newIndex = items.findIndex((i) => i.nanoid === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    setQueues((prev) =>
      prev.map((q) => (q.nanoid === queueNanoid ? { ...q, items: reordered } : q)),
    );
    reordered.forEach((item, idx) => {
      if (item.position !== idx) {
        updateQueueItemAction(item.nanoid, { position: idx }, ws);
      }
    });
  };

  const handleUpdateItem = async (itemNanoid: string, data: Partial<PostQueueItem>) => {
    setQueues((prev) =>
      prev.map((q) => ({
        ...q,
        items: q.items.map((i) => (i.nanoid === itemNanoid ? { ...i, ...data } : i)),
      })),
    );
    await updateQueueItemAction(itemNanoid, data, ws);
  };

  const handleRemoveItem = async (queueNanoid: string, itemNanoid: string) => {
    if (!confirm("Remove this item from the queue?")) return;
    await deleteQueueItemAction(itemNanoid, ws);
    setQueues((prev) =>
      prev.map((q) =>
        q.nanoid === queueNanoid ? { ...q, items: q.items.filter((i) => i.nanoid !== itemNanoid) } : q,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Posting Queues</h2>
          <p className="text-sm text-slate-500 mt-1">Manage batch posting queues with interval scheduling.</p>
        </div>
      </div>

      {/* Create queue */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Queue name (e.g. Weekly Tips)"
            value={newQueueName}
            onChange={(e) => setNewQueueName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateQueue()}
            className="h-9 text-sm flex-1"
          />
          <Button size="sm" onClick={handleCreateQueue} disabled={!newQueueName.trim() || busy}>
            <Plus className="h-4 w-4 mr-1.5" /> Create Queue
          </Button>
        </div>
      </Card>

      {/* Queue list */}
      <div className="space-y-3">
        {queues.length === 0 && (
          <Card className="p-8 text-center text-sm text-slate-500">
            <ListOrdered className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            No posting queues yet. Create one above.
          </Card>
        )}

        {queues.map((queue) => {
          const isExpanded = expandedQueue === queue.nanoid;
          const items = sortedItems(queue.nanoid);
          return (
            <Card key={queue.nanoid} className="overflow-hidden">
              <div
                onClick={() => setExpandedQueue(isExpanded ? null : queue.nanoid)}
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-slate-900">{queue.name}</h3>
                    <p className="text-[10px] text-slate-500">
                      {items.length} items
                      {!queue.is_active && <span className="ml-2 text-amber-500">Inactive</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSchedule(queue.nanoid);
                    }}
                    disabled={busy || items.length === 0}
                    className="h-8 text-xs gap-1"
                  >
                    <Send className="h-3.5 w-3.5" /> Schedule
                  </Button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteQueue(queue.nanoid);
                    }}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, queue.nanoid)}
                  >
                    <SortableContext
                      items={items.map((i) => i.nanoid)}
                      strategy={verticalListSortingStrategy}
                    >
                      {items.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">
                          No items in this queue. Add posts below.
                        </p>
                      )}
                      {items.map((item) => (
                        <SortableItem
                          key={item.nanoid}
                          item={item}
                          onRemove={(nanoid) => handleRemoveItem(queue.nanoid, nanoid)}
                          onUpdate={handleUpdateItem}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-9 text-xs gap-1.5"
                    onClick={() => handleAddItem(queue.nanoid)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
