"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter } from "@/lib/icons";

interface Props {
  workspaceDomain: string;
}

/**
 * The "View all…" menu.
 *
 * The backend cannot register a sidebar entry for observations, activities
 * or leads, so the cross-company lists are reached from here instead —
 * the decision the plan made (D4).
 */
export function CompaniesViewAllMenu({ workspaceDomain }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <ListFilter className="mr-1.5 size-3.5" aria-hidden="true" />
          View all
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Across all companies</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceDomain}/dashboard/companies/observations`}>
            Observations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceDomain}/dashboard/companies/activities`}>
            Activities
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${workspaceDomain}/dashboard/companies/leads`}>
            Leads
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
