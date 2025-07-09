<script setup lang="ts">
import Card from "primevue/card";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, ref } from "vue";

import { SessionItem } from "./SessionItem";

import { type SessionsState } from "@/types/scanner";
import { SessionState } from "shared";
import { Severity } from "engine";
import { useTable } from "./useTable";

const props = defineProps<{
  state: SessionsState & { type: "Success" };
}>();

const search = ref("");
const statusFilter = ref("all");

const statusOptions = [
  { label: "All Sessions", value: "all" },
  { label: "Running", value: "running" },
  { label: "Finished", value: "finished" },
];

const genID = () => {
  return "ascan-" + Math.random().toString(36).substring(2, 15);
};

const genFindings = (count: number) => {
  const possibleFindings = [
    {
      title: "SQL Injection",
      description: "SQL Injection in the login page",
      severity: Severity.CRITICAL,
    },
    {
      title: "XSS",
      description: "XSS in the login page",
      severity: Severity.HIGH,
    },
    {
      title: "CSRF",
      description: "CSRF in the login page",
      severity: Severity.MEDIUM,
    },
    {
      title: "File Inclusion",
      description: "File Inclusion in the login page",
      severity: Severity.LOW,
    },
    {
      title: "Command Injection",
      description: "Command Injection in the login page",
      severity: Severity.CRITICAL,
    },
    {
      title: "Directory Traversal",
      description: "Directory traversal vulnerability in file upload",
      severity: Severity.HIGH,
    },
    {
      title: "Insecure Direct Object Reference",
      description: "IDOR vulnerability in user profile access",
      severity: Severity.MEDIUM,
    },
    {
      title: "XML External Entity",
      description: "XXE vulnerability in XML parser",
      severity: Severity.HIGH,
    },
    {
      title: "Server-Side Request Forgery",
      description: "SSRF vulnerability in URL fetcher",
      severity: Severity.HIGH,
    },
    {
      title: "Remote Code Execution",
      description: "RCE vulnerability in file processor",
      severity: Severity.CRITICAL,
    },
    {
      title: "Authentication Bypass",
      description: "Authentication bypass in admin panel",
      severity: Severity.CRITICAL,
    },
    {
      title: "Session Fixation",
      description: "Session fixation vulnerability in login",
      severity: Severity.MEDIUM,
    },
    {
      title: "Weak Password Policy",
      description: "Weak password requirements detected",
      severity: Severity.LOW,
    },
    {
      title: "Information Disclosure",
      description: "Sensitive information exposed in error messages",
      severity: Severity.MEDIUM,
    },
    {
      title: "Clickjacking",
      description: "Missing X-Frame-Options header",
      severity: Severity.LOW,
    },
    {
      title: "HTTP Security Headers Missing",
      description: "Missing security headers (CSP, HSTS, etc.)",
      severity: Severity.LOW,
    },
    {
      title: "Insecure Cryptographic Storage",
      description: "Weak encryption algorithm detected",
      severity: Severity.MEDIUM,
    },
    {
      title: "Buffer Overflow",
      description: "Buffer overflow in input validation",
      severity: Severity.HIGH,
    },
    {
      title: "Race Condition",
      description: "Race condition in payment processing",
      severity: Severity.MEDIUM,
    },
    {
      title: "Privilege Escalation",
      description: "Vertical privilege escalation vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "Business Logic Flaw",
      description: "Price manipulation in checkout process",
      severity: Severity.HIGH,
    },
    {
      title: "Deserialization Vulnerability",
      description: "Unsafe deserialization of user input",
      severity: Severity.CRITICAL,
    },
    {
      title: "LDAP Injection",
      description: "LDAP injection in user search",
      severity: Severity.HIGH,
    },
    {
      title: "NoSQL Injection",
      description: "NoSQL injection in MongoDB query",
      severity: Severity.HIGH,
    },
    {
      title: "Template Injection",
      description: "Server-side template injection vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "Mass Assignment",
      description: "Mass assignment vulnerability in user update",
      severity: Severity.MEDIUM,
    },
    {
      title: "Open Redirect",
      description: "Open redirect vulnerability in login redirect",
      severity: Severity.LOW,
    },
    {
      title: "HTTP Parameter Pollution",
      description: "HTTP parameter pollution in search function",
      severity: Severity.LOW,
    },
    {
      title: "Insecure File Upload",
      description: "Unrestricted file upload vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "Path Traversal",
      description: "Path traversal in file download endpoint",
      severity: Severity.HIGH,
    },
    {
      title: "Timing Attack",
      description: "Timing attack vulnerability in authentication",
      severity: Severity.MEDIUM,
    },
    {
      title: "Cache Poisoning",
      description: "Web cache poisoning vulnerability",
      severity: Severity.MEDIUM,
    },
    {
      title: "Host Header Injection",
      description: "Host header injection vulnerability",
      severity: Severity.MEDIUM,
    },
    {
      title: "JWT Vulnerability",
      description: "Weak JWT signature verification",
      severity: Severity.HIGH,
    },
    {
      title: "GraphQL Injection",
      description: "GraphQL injection vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "API Rate Limiting Missing",
      description: "Missing rate limiting on API endpoints",
      severity: Severity.LOW,
    },
    {
      title: "Subdomain Takeover",
      description: "Subdomain takeover vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "DNS Rebinding",
      description: "DNS rebinding attack vulnerability",
      severity: Severity.MEDIUM,
    },
    {
      title: "WebSocket Vulnerability",
      description: "Insecure WebSocket implementation",
      severity: Severity.MEDIUM,
    },
    {
      title: "CORS Misconfiguration",
      description: "Overly permissive CORS policy",
      severity: Severity.MEDIUM,
    },
    {
      title: "Content Security Policy Bypass",
      description: "CSP bypass vulnerability",
      severity: Severity.MEDIUM,
    },
    {
      title: "DOM-based XSS",
      description: "DOM-based cross-site scripting vulnerability",
      severity: Severity.HIGH,
    },
    {
      title: "Reflected XSS",
      description: "Reflected cross-site scripting in search",
      severity: Severity.HIGH,
    },
    {
      title: "Stored XSS",
      description: "Stored cross-site scripting in comments",
      severity: Severity.HIGH,
    },
    {
      title: "Blind SQL Injection",
      description: "Blind SQL injection in user lookup",
      severity: Severity.CRITICAL,
    },
    {
      title: "Time-based SQL Injection",
      description: "Time-based SQL injection vulnerability",
      severity: Severity.CRITICAL,
    },
    {
      title: "Error-based SQL Injection",
      description: "Error-based SQL injection in search",
      severity: Severity.CRITICAL,
    },
    {
      title: "Union-based SQL Injection",
      description: "Union-based SQL injection vulnerability",
      severity: Severity.CRITICAL,
    },
  ];

  return possibleFindings.slice(0, count).map((finding) => ({
    ...finding,
    name: finding.title,
    correlation: {
      requestID: "1",
      locations: [],
    },
  }));
};

const baseSessions = [
  {
    kind: "Running" as const,
    title: "Active Scan #1",
    id: genID(),
    createdAt: Date.now() - 300000,
    startedAt: Date.now() - 240000,
    findings: genFindings(10),
    progress: {
      checksCompleted: 15,
      requestsSent: 42,
      checksCount: 30,
    },
  } as SessionState,
  {
    kind: "Done" as const,
    id: genID(),
    title: "Active Scan #2",
    createdAt: Date.now() - 600000,
    startedAt: Date.now() - 540000,
    finishedAt: Date.now() - 120000,
    findings: genFindings(20),
    progress: {
      checksCompleted: 25,
      requestsSent: 78,
      checksCount: 25,
    },
  } as SessionState,
  {
    kind: "Error" as const,
    id: genID(),
    title: "Active Scan #3",
    createdAt: Date.now() - 900000,
    error: "Connection timeout",
  } as SessionState,
];

const mockSessions: SessionState[] = Array.from({ length: 20 }, (_, index) => {
  const baseSession = baseSessions[index % baseSessions.length];
  return {
    ...baseSession,
    id: genID(),
    title: `Active Scan #${index + 1}`,
  } as SessionState;
});

const { getFilteredSessions } = useTable({ search, statusFilter });
const filteredSessions = computed(() =>
  getFilteredSessions(props.state.sessions)
);
</script>
<template>
  <Card
    class="h-full"
    :pt="{
      body: { class: 'h-full p-0' },
      content: { class: 'h-full flex flex-col' },
    }"
  >
    <template #content>
      <div class="flex justify-between items-center p-4 gap-4">
        <div class="flex-1">
          <h3 class="text-lg font-semibold">Sessions</h3>
          <p class="text-sm text-surface-300 flex-1">
            Active and completed vulnerability scanning sessions.
          </p>
        </div>

        <div class="flex gap-2 items-center">
          <Select
            v-model="statusFilter"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="Filter by status"
            class="w-40"
          />

          <IconField>
            <InputIcon class="fas fa-magnifying-glass" />
            <InputText
              v-model="search"
              placeholder="Search sessions"
              class="w-full"
            />
          </IconField>
        </div>
      </div>

      <div
        class="flex flex-col overflow-y-auto"
        :class="{ 'h-full': filteredSessions.length === 0 }"
      >
        <SessionItem
          v-for="session in filteredSessions"
          :key="session.id"
          :session="session"
        />
      </div>
    </template>
  </Card>
</template>
