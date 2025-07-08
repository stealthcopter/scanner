<script setup lang="ts">
import { onMounted, ref } from "vue";

import { useSDK } from "@/plugins/sdk";
import { type QueueSelectionState } from "@/types/queue";

const props = defineProps<{
  selectionState: QueueSelectionState & { type: "Success" };
}>();

const sdk = useSDK();

const root = ref();

onMounted(() => {
  const editor = sdk.ui.httpResponseEditor();
  root.value.appendChild(editor.getElement());

  const view = editor.getEditorView();

  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: props.selectionState.response.raw,
    },
  });
});
</script>

<template>
  <div ref="root" class="h-full"></div>
</template>
