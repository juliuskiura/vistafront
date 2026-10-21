"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal } from "@/lib/icons";
import { TOGGLEABLE_COLUMNS } from "./companies-table-columns";

interface Props {
  /** The TanStack table, used only to read and toggle column visibility. */
  table: {
    getColumn: (id: string) =>
      | {
          getIsVisible: () => boolean;
          toggleVisibility: (value: boolean) => void;
        }
      | undefined;
  };
}

/**
 * The column-visibility picker.
 *
 * The chosen set is persisted in `localStorage` by the table itself; this
 * component only renders the control.
 */
export function CompaniesTableToolbar({ table }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="mr-1.5 size-3.5" aria-hidden="true" />
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TOGGLEABLE_COLUMNS.map((col) => (
            <DropdownMenuCheckboxItem
              key={col.id}
              checked={table.getColumn(col.id)?.getIsVisible() ?? true}
              onCheckedChange={(value) =>
                table.getColumn(col.id)?.toggleVisibility(!!value)
              }
              onSelect={(e) => e.preventDefault()}
            >
              {col.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
