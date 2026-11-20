// Pure helpers for the multi-workflow ComfyUI support. Kept free of Svelte
// and store imports so it stays testable standalone; the database layer and
// stableDiff adapt their shapes to `ComfyWorkflowPresetLike`.
import { v4 as uuidv4 } from "uuid"

export interface ComfyWorkflowPresetLike {
    id: string
    name: string
    workflow: string
    timeout?: number
}

export function resolveActiveComfyWorkflow(workflows: ComfyWorkflowPresetLike[], activeId: string): ComfyWorkflowPresetLike | undefined {
    return workflows.find(w => w.id === activeId) ?? workflows[0]
}

// Always returns a fully populated preset (timeout defaulted), so callers
// can push the result straight into a `ComfyWorkflowPreset[]`.
export function legacyComfyWorkflowToPreset(legacy: { workflow: string; timeout?: number }): Required<ComfyWorkflowPresetLike> | null {
    if(typeof legacy.workflow !== "string" || legacy.workflow.trim() === ""){
        return null
    }
    return {
        // uuidv4 instead of crypto.randomUUID: that API is secure-context only
        // and plain-HTTP remote deployments would throw here.
        id: uuidv4(),
        name: "Default",
        workflow: legacy.workflow,
        timeout: legacy.timeout || 30,
    }
}
