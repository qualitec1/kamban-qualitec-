<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-heading-lg font-semibold text-neutral-900 mb-2">Meu trabalho</h1>
      <p class="text-body text-muted">Todas as tarefas atribuídas a você</p>
    </div>

    <!-- Loading State -->
    <LoadingState v-if="loading" message="Carregando suas tarefas..." />

    <!-- Error State -->
    <ErrorState 
      v-else-if="error" 
      :message="error"
      @retry="fetchMyTasks"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="tasks.length === 0"
      title="Nenhuma tarefa atribuída"
      description="Você não possui tarefas atribuídas no momento."
    />

    <!-- Content -->
    <div v-else class="space-y-8">
      
      <!-- Overdue Tasks -->
      <section v-if="overdueTasks.length > 0" class="bg-danger-50 border border-danger-200 rounded-xl p-4">
        <h2 class="text-heading-sm font-semibold text-danger-900 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          Atrasadas ({{ overdueTasks.length }})
        </h2>
        <div class="space-y-2">
          <TaskCard
            v-for="task in overdueTasks"
            :key="task.id"
            :task="task"
            variant="danger"
            @click="navigateToTask(task)"
          />
        </div>
      </section>

      <!-- Due Today -->
      <section v-if="dueTodayTasks.length > 0">
        <h2 class="text-heading-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Vence hoje ({{ dueTodayTasks.length }})
        </h2>
        <div class="space-y-2">
          <TaskCard
            v-for="task in dueTodayTasks"
            :key="task.id"
            :task="task"
            variant="warning"
            @click="navigateToTask(task)"
          />
        </div>
      </section>

      <!-- Tasks by Board -->
      <section v-for="boardGroup in tasksByBoard" :key="boardGroup.boardId">
        <h2 class="text-heading-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          {{ boardGroup.boardName }} ({{ boardGroup.tasks.length }})
        </h2>
        <div class="space-y-2">
          <TaskCard
            v-for="task in boardGroup.tasks"
            :key="task.id"
            :task="task"
            @click="navigateToTask(task)"
          />
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMyTasks } from '~/composables/useMyTasks'
import type { TaskWithBoard } from '~/composables/useMyTasks'

const { tasks, loading, error, fetchMyTasks, getTasksByBoard, getTasksDueToday, getOverdueTasks } = useMyTasks()

const tasksByBoard = computed(() => getTasksByBoard())
const dueTodayTasks = computed(() => getTasksDueToday())
const overdueTasks = computed(() => getOverdueTasks())

function navigateToTask(task: TaskWithBoard) {
  // Navegar para o board com a tarefa selecionada
  navigateTo(`/boards/${task.board.id}`)
}

onMounted(() => {
  console.log('MyWork page mounted')
  fetchMyTasks()
})
</script>
