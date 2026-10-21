"use client";

import { useState } from "react";

import type { Industry } from "@/lib/api";
import { IndustryPicker } from "./industry-picker";

interface Props {
  id: string;
  name: string;
  label: string;
  industries: Industry[];
  defaultValue?: string;
  /** The workspace domain, needed by the "create new" action. */
  workspaceDomain: string;
}

/**
 * The industry field of the add-company form.
 *
 * A thin form-field wrapper around `IndustryPicker`: the picker is
 * controlled, so the selected name is mirrored into a hidden input for the
 * form submission.
 */
export function IndustrySelect({
  id,
  name,
  label,
  industries,
  defaultValue = "",
  workspaceDomain,
}: Props) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <IndustryPicker
        id={id}
        label={label}
        industries={industries}
        workspaceDomain={workspaceDomain}
        value={value}
        onChange={setValue}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
