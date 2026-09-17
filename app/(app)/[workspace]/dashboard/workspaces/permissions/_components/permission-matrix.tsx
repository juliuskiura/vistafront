"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AvailableModel, PermissionAction } from "@/lib/api";

export interface PermissionMatrixProps {
  actions: PermissionAction[];
  models: AvailableModel[];
  values: Record<string, number>;
  onToggle: (modelKey: string, bit: number) => void;
  onSetAll: (modelKey: string, mask: number) => void;
}

/**
 * The models-by-actions grid at the heart of the permissions page. Each row is
 * a model the workspace can access; each column an action (view, list,
 * create…). A checked cell means the row's bit for that action is set in the
 * model mask.
 */
export function PermissionMatrix({
  actions,
  models,
  values,
  onToggle,
  onSetAll,
}: PermissionMatrixProps) {
  const bitByAction = actions.reduce<Record<string, number>>((acc, action) => {
    acc[action.action] = action.bit;
    return acc;
  }, {});

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="sticky left-0 z-10 min-w-[15rem] bg-muted/40 px-4 py-3">
                Model
              </th>
              {actions.map((action) => (
                <th
                  key={action.action}
                  className="px-3 py-3 text-center"
                  title={action.description}
                >
                  {action.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Access</th>
            </tr>
          </thead>
          <tbody>
            {models.map((model) => {
              const mask = values[model.key] ?? 0;
              const allBits = model.actions.reduce(
                (acc, action) => acc | (bitByAction[action] ?? 0),
                0,
              );
              const full = allBits !== 0 && (mask & allBits) === allBits;

              return (
                <tr
                  key={model.key}
                  className="border-b border-muted last:border-0 hover:bg-muted/20"
                >
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-neutral-900">
                    {model.label}
                  </td>
                  {actions.map((action) => {
                    const bit = bitByAction[action.action];
                    const supports =
                      bit !== undefined && model.actions.includes(action.action);

                    return (
                      <td key={action.action} className="px-3 py-3 text-center">
                        {supports ? (
                          <MatrixCheckbox
                            checked={(mask & bit) === bit}
                            label={`${action.label} ${model.label}`}
                            onChange={() => onToggle(model.key, bit)}
                          />
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSetAll(model.key, full ? 0 : allBits)}
                      className={cn(
                        "text-xs font-semibold transition-colors",
                        full
                          ? "text-destructive hover:text-destructive/80"
                          : "text-primary-600 hover:text-primary-700",
                      )}
                    >
                      {full ? "Clear" : "Full"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatrixCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "mx-auto flex size-5 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
        checked
          ? "border-primary-600 bg-primary-600 text-white"
          : "border-neutral-300 bg-white hover:border-primary-400",
      )}
    >
      {checked ? <Check className="size-3.5" strokeWidth={3} /> : null}
    </button>
  );
}
