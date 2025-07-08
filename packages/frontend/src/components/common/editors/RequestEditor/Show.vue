<script setup lang="ts">
import { onMounted, ref, watch, toRefs } from "vue";

import { useSDK } from "@/plugins/sdk";
import { type EditorState } from "../useEditor";

const props = defineProps<{
  editorState: EditorState & { type: "Success" };
}>();

const { editorState } = toRefs(props);
const sdk = useSDK();

const root = ref();
let editorView: any = null;

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
  }
);
</script>

<template>
  <div ref="root" class="h-full"></div>
</template>
