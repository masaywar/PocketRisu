<script lang="ts">
    import ShBadge from "src/lib/UI/GUI/ShBadge.svelte";
    import ShButton from "src/lib/UI/GUI/ShButton.svelte";
    import IconButton from "src/lib/UI/GUI/IconButton.svelte";
    import NumberInput from "src/lib/UI/GUI/NumberInput.svelte";
    import TextInput from "src/lib/UI/GUI/TextInput.svelte";
    import TextAreaInput from "src/lib/UI/GUI/TextAreaInput.svelte";
    import SelectInput from "src/lib/UI/GUI/SelectInput.svelte";
    import OptionInput from "src/lib/UI/GUI/OptionInput.svelte";
    import { CopyIcon, FileUpIcon, PlusIcon, TrashIcon } from "@lucide/svelte";
    import { language } from "src/lang";
    import { DBState } from "src/ts/stores.svelte";
    import { selectSingleFile } from "src/ts/util";
    import { alertConfirm, notifyError, notifySuccess } from "src/ts/alert";
    import type { ComfyWorkflowPreset } from "src/ts/storage/database.svelte";
    import { v4 as uuidv4 } from 'uuid';

    const workflows = $derived(DBState.db.comfyWorkflows ?? []);

    let selectedId = $state('');
    const selected = $derived(workflows.find(w => w.id === selectedId) ?? workflows[0]);

    // selectedId starts as '' (and can dangle after external list changes), so
    // the dropdown would render blank while the card falls back to
    // workflows[0]. Self-heal: prefer the active workflow, else the first one.
    $effect(() => {
        if(workflows.length === 0){ return }
        const exists = workflows.some(w => w.id === selectedId)
        if(!exists){
            selectedId = DBState.db.comfyActiveWorkflowId && workflows.some(w => w.id === DBState.db.comfyActiveWorkflowId)
                ? DBState.db.comfyActiveWorkflowId
                : workflows[0].id
        }
    })

    function addWorkflow() {
        const list = DBState.db.comfyWorkflows;
        const preset: ComfyWorkflowPreset = {
            id: uuidv4(),
            name: `${language.comfyWorkflows.defaultName} ${list.length + 1}`,
            workflow: "",
            timeout: 30,
        };
        list.push(preset);
        if(list.length === 1){
            DBState.db.comfyActiveWorkflowId = preset.id;
        }
        selectedId = preset.id;
    }

    async function importWorkflow() {
        const file = await selectSingleFile(["json"]);
        if(!file){
            return;
        }
        const text = new TextDecoder().decode(file.data);
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch (e) {
            notifyError(language.comfyWorkflows.invalidJson);
            return;
        }
        if(!parsed || typeof parsed !== "object"){
            notifyError(language.comfyWorkflows.invalidJson);
            return;
        }
        const list = DBState.db.comfyWorkflows;
        const preset: ComfyWorkflowPreset = {
            id: uuidv4(),
            name: file.name.replace(/\.[^.]+$/, ""),
            workflow: text,
            timeout: 30,
        };
        list.push(preset);
        if(list.length === 1){
            DBState.db.comfyActiveWorkflowId = preset.id;
        }
        selectedId = preset.id;
        notifySuccess(language.successImport);
    }

    function duplicateWorkflow(preset: ComfyWorkflowPreset) {
        const list = DBState.db.comfyWorkflows;
        const index = list.findIndex(w => w.id === preset.id);
        const clone: ComfyWorkflowPreset = {
            ...preset,
            id: uuidv4(),
            name: `${preset.name} (2)`,
        };
        list.splice(index + 1, 0, clone);
        selectedId = clone.id;
    }

    async function deleteWorkflow(preset: ComfyWorkflowPreset) {
        if(!await alertConfirm(language.comfyWorkflows.deleteConfirm)){
            return;
        }
        const list = DBState.db.comfyWorkflows;
        const index = list.findIndex(w => w.id === preset.id);
        if(index !== -1){
            list.splice(index, 1);
        }
        if(DBState.db.comfyActiveWorkflowId === preset.id){
            DBState.db.comfyActiveWorkflowId = list.length > 0 ? list[0].id : "";
        }
        selectedId = list[0]?.id ?? '';
    }

    function isValidJson(text: string): boolean {
        try {
            JSON.parse(text);
            return true;
        } catch (e) {
            return false;
        }
    }
</script>

<div class="py-3 border-t border-darkborderc flex flex-col gap-2">
    <div class="flex items-center justify-between gap-2">
        <h2 class="mt-0 mb-0 font-bold">{language.comfyWorkflows.title}</h2>
        <div class="flex items-center gap-2 shrink-0">
            <ShButton variant="outline" size="sm" onclick={addWorkflow} title={language.comfyWorkflows.add}>
                <PlusIcon />
                {language.comfyWorkflows.add}
            </ShButton>
            <ShButton variant="outline" size="sm" onclick={importWorkflow} title={language.comfyWorkflows.importFile}>
                <FileUpIcon />
                {language.comfyWorkflows.importFile}
            </ShButton>
        </div>
    </div>

    {#if workflows.length === 0}
        <p class="text-xs text-textcolor2 m-0">{language.comfyWorkflows.emptyHint}</p>
    {/if}

    {#if workflows.length > 1}
        <SelectInput className="w-full sm:w-64" size="sm" bind:value={selectedId}>
            {#each workflows as w (w.id)}
                <OptionInput value={w.id}>{w.name}{DBState.db.comfyActiveWorkflowId === w.id ? ' ✓' : ''}</OptionInput>
            {/each}
        </SelectInput>
    {/if}

    {#if selected}
        <div class="border border-darkborderc rounded-lg p-3 flex flex-col gap-2">
            <div class="flex items-center gap-2 flex-wrap">
                <TextInput
                    className="grow min-w-40 h-8"
                    size="sm"
                    padding
                    placeholder={language.comfyWorkflows.namePlaceholder}
                    bind:value={selected.name}
                />
                <div class="flex items-center gap-1 shrink-0">
                    <span class="text-xs text-textcolor2">{language.comfyWorkflows.timeout}</span>
                    <NumberInput className="w-24" size="sm" padding min={1} max={120} bind:value={selected.timeout} />
                </div>
                {#if DBState.db.comfyActiveWorkflowId === selected.id}
                    <ShBadge variant="success" size="xs">{language.comfyWorkflows.activeBadge}</ShBadge>
                {:else}
                    <ShButton variant="outline" size="sm" onclick={() => { DBState.db.comfyActiveWorkflowId = selected.id }}>
                        {language.comfyWorkflows.setActive}
                    </ShButton>
                {/if}
                <IconButton
                    size="sm"
                    title={language.comfyWorkflows.duplicate}
                    aria-label={language.comfyWorkflows.duplicate}
                    onclick={() => duplicateWorkflow(selected)}
                >
                    <CopyIcon />
                </IconButton>
                <IconButton
                    size="sm"
                    tone="destructive"
                    title={language.comfyWorkflows.delete}
                    aria-label={language.comfyWorkflows.delete}
                    onclick={() => deleteWorkflow(selected)}
                >
                    <TrashIcon />
                </IconButton>
            </div>
            <TextAreaInput
                height="32"
                fullwidth
                className="font-mono"
                placeholder={language.comfyWorkflows.workflowPlaceholder}
                bind:value={selected.workflow}
                optimaizedInput={false}
            />
            {#if selected.workflow.trim().length > 0}
                {#if isValidJson(selected.workflow)}
                    <div class="text-xs text-green-500">{language.comfyWorkflows.validJson}</div>
                {:else}
                    <div class="text-xs text-red-500">{language.comfyWorkflows.invalidJson}</div>
                {/if}
            {/if}
        </div>
    {/if}
</div>
