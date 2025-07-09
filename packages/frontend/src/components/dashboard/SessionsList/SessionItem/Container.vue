<script setup lang="ts">
import Card from "primevue/card";
import Button from "primevue/button";
import ProgressBar from "primevue/progressbar";
import { SessionState } from "shared";
import { useForm } from "./useForm";

const props = defineProps<{
  session: SessionState;
}>();

const {
  timeSinceCreated,
  progress,
  hasFindings,
  requestsSent,
  severityOrder,
  onCancel,
  onDelete,
  onExport,
  checksCompleted,
  getStatusColor,
  findingsBySeverity,
  getSeverityBadgeColor,
} = useForm(props);
</script>

<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-0' },
      content: { class: 'h-full flex flex-col p-4' },
      header: { class: 'bg-surface-900 p-4' },
    }"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-base font-medium">{{ session.title }}</span>
            <span class="text-xs text-surface-400 font-mono">{{
              session.id
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div
              :class="['w-2 h-2 rounded-full', getStatusColor(session.kind)]"
            ></div>
            <span
              :class="[
                'text-xs rounded text-surface-100 uppercase tracking-wide',
              ]"
            >
              <span :class="{ shimmer: session.kind === 'Running' }">{{
                session.kind
              }}</span>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="session.kind === 'Running'"
            label="Cancel"
            severity="danger"
            outlined
            size="small"
            @click="onCancel"
          />

          <Button
            label="Delete"
            severity="danger"
            outlined
            size="small"
            @click="onDelete"
          />

          <Button
            v-if="session.kind === 'Done'"
            label="Export"
            severity="secondary"
            outlined
            size="small"
            @click="onExport"
          />
        </div>
      </div>
    </template>

    <template #content>
      <div class="flex flex-col gap-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex flex-col gap-2 flex-1">
            <span class="text-sm text-surface-300 font-medium">Created</span>
            <span class="text-sm text-surface-200 font-medium">
              {{ timeSinceCreated }}
            </span>
          </div>

          <div v-if="hasFindings" class="flex flex-col gap-2 flex-1">
            <span class="text-sm text-surface-300 font-medium">Findings</span>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="severity in severityOrder"
                v-show="findingsBySeverity[severity] > 0"
                :key="severity"
                :class="[
                  'px-2 py-1 rounded-md border text-xs font-medium',
                  getSeverityBadgeColor(severity),
                ]"
              >
                {{
                  severity.charAt(0).toUpperCase() +
                  severity.slice(1).toLowerCase()
                }}: {{ findingsBySeverity[severity] }}
              </div>
              <div
                v-if="
                  Object.values(findingsBySeverity).every(
                    (count) => count === 0
                  )
                "
                class="text-xs text-surface-500 italic"
              >
                No findings {{ session.kind === "Running" ? "yet" : "found" }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="session.kind === 'Running' || session.kind === 'Done'"
          class="flex flex-col gap-3 w-full"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-300 font-medium"
              >Scan Progress</span
            >
            <span class="text-sm text-surface-200 font-mono font-semibold">
              {{ progress }}%
            </span>
          </div>

          <ProgressBar
            :value="progress"
            class="w-full h-2"
            :showValue="false"
            :pt="{
              root: { class: 'bg-surface-700 rounded-full overflow-hidden' },
              value: {
                class:
                  session.kind === 'Done'
                    ? 'bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-300 ease-out'
                    : 'bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300 ease-out',
              },
            }"
          />

          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-surface-400">Requests sent:</span>
                <span class="text-surface-200 font-mono font-medium">{{
                  requestsSent
                }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-surface-400">Checks completed:</span>
                <span class="text-surface-200 font-mono font-medium">{{
                  checksCompleted
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="session.kind === 'Error'" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-300 font-medium">Error</span>
          </div>
          <div class="bg-surface-900 border border-surface-600 rounded p-3">
            <code class="text-sm text-red-400 font-mono whitespace-pre-wrap">{{
              session.error
            }}</code>
          </div>
        </div>
      </div>
    </template>
  </Card>
</template>

<style scoped>
.shimmer {
  display: inline-block;
  color: white;
  background: #acacac linear-gradient(to left, #acacac, #ffffff 50%, #acacac);
  background-position: -4rem top;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-animation: shimmer 2.2s infinite;
  animation: shimmer 2.2s infinite;
  background-size: 4rem 100%;
}

@-webkit-keyframes shimmer {
  0% {
    background-position: -4rem top;
  }
  70% {
    background-position: 6.5rem top;
  }
  100% {
    background-position: 6.5rem top;
  }
}

@keyframes shimmer {
  0% {
    background-position: -4rem top;
  }
  70% {
    background-position: 6.5rem top;
  }
  100% {
    background-position: 6.5rem top;
  }
}
</style>
