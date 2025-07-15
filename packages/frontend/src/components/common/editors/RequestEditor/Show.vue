<script setup lang="ts">
import { type EditorView } from "@codemirror/view";
import { onMounted, ref, toRefs, watch } from "vue";

import { type EditorState } from "../useEditor";

import { useSDK } from "@/plugins/sdk";

const props = defineProps<{
  editorState: EditorState & { type: "Success" };
}>();

const { editorState } = toRefs(props);
const sdk = useSDK();

const root = ref();
let editorView: EditorView | undefined = undefined;

const updateEditorContent = (content: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    });
  }
};

onMounted(() => {
  const editor = sdk.ui.httpRequestEditor();
  root.value.appendChild(editor.getElement());

  editorView = editor.getEditorView();
  updateEditorContent(props.editorState.request.raw);
});

watch(
  () => editorState.value.request.raw,
  (newContent) => {
    updateEditorContent(newContent);
  },
);
</script>

<template>
  <div ref="root" class="h-full"></div>
</template>
