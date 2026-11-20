import { describe, expect, test } from "vitest"
import { legacyComfyWorkflowToPreset, resolveActiveComfyWorkflow } from "./comfyWorkflows"

const workflows = [
    { id: "preset-a", name: "First", workflow: "{}", timeout: 30 },
    { id: "preset-b", name: "Second", workflow: "{}", timeout: 60 },
]

describe("resolveActiveComfyWorkflow", () => {
    test("returns the preset whose id matches the active id", () => {
        expect(resolveActiveComfyWorkflow(workflows, "preset-b")).toBe(workflows[1])
    })

    test("falls back to the first preset when the id matches nothing", () => {
        expect(resolveActiveComfyWorkflow(workflows, "missing")).toBe(workflows[0])
        expect(resolveActiveComfyWorkflow(workflows, "")).toBe(workflows[0])
    })

    test("returns undefined for an empty list", () => {
        expect(resolveActiveComfyWorkflow([], "preset-a")).toBeUndefined()
    })
})

describe("legacyComfyWorkflowToPreset", () => {
    test("wraps a legacy workflow as a Default preset with a generated id", () => {
        const preset = legacyComfyWorkflowToPreset({ workflow: "{\"nodes\":{}}", timeout: 45 })
        expect(preset?.id).toBeTruthy()
        expect(preset?.name).toBe("Default")
        expect(preset?.workflow).toBe("{\"nodes\":{}}")
        expect(preset?.timeout).toBe(45)
    })

    test("returns null for an empty or whitespace workflow", () => {
        expect(legacyComfyWorkflowToPreset({ workflow: "" })).toBeNull()
        expect(legacyComfyWorkflowToPreset({ workflow: "   " })).toBeNull()
    })

    test("defaults the timeout to 30 seconds when missing or 0", () => {
        expect(legacyComfyWorkflowToPreset({ workflow: "{}" })?.timeout).toBe(30)
        expect(legacyComfyWorkflowToPreset({ workflow: "{}", timeout: 0 })?.timeout).toBe(30)
    })

    test("generates a distinct id for each conversion", () => {
        const a = legacyComfyWorkflowToPreset({ workflow: "{}" })
        const b = legacyComfyWorkflowToPreset({ workflow: "{}" })
        expect(a?.id).toBeTruthy()
        expect(b?.id).toBeTruthy()
        expect(a?.id).not.toBe(b?.id)
    })
})
