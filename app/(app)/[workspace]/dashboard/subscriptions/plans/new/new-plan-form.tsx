"use client";

import { useActionState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/context";
import { createPlanAction } from "../../actions";
import {
  initialActionState,
  type ActionState,
} from "../../action-state";
import { PlanFields } from "../../_components/plan-fields";

export function NewPlanForm() {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const plansPath = pathname.replace(/\/new$/, "");

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPlanAction,
    initialActionState,
  );

  const handledState = useRef<ActionState>(initialActionState);

  useEffect(() => {
    if (handledState.current === state) return;
    handledState.current = state;
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Plan created.",
      });
      router.push(plansPath);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not create the plan.",
      });
    }
  }, [state, toast, router, plansPath]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Card className="rounded-xl border bg-card p-6">
      <form action={formAction} className="space-y-4" noValidate>
        <PlanFields
          editing={false}
          defaults={{
            name: "",
            label: "",
            description: "",
            order: 0,
            price: "",
            is_active: true,
          }}
          errors={errors}
          formError={formError}
          pending={pending}
          submitLabel="Create plan"
          submitPendingLabel="Creating…"
          onCancel={() => router.push(plansPath)}
        />
      </form>
    </Card>
  );
}