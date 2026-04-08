# 🔧 CORREÇÃO - Dropdown "Colunas" Mobile

## 📱 Problema Identificado
O dropdown do botão "Colunas" estava saindo da viewport no mobile, ficando cortado pela esquerda e impossível de usar.

## ✅ Solução Implementada

### Arquivo Modificado
- `app/components/ColumnVisibilityMenu.vue`

---

## 🔄 ANTES vs DEPOIS

### ANTES (Código Original)
```vue
<!-- Dropdown -->
<div
  v-if="open"
  class="absolute z-50 top-full right-0 mt-1 w-56 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5"
>
```

**Problemas:**
- `absolute right-0` → Ancorado à direita do botão
- `w-56` → Largura fixa de 224px
- Sem tratamento mobile → Sai da tela em dispositivos pequenos

---

### DEPOIS (Código Corrigido)
```vue
<!-- Overlay para mobile -->
<div
  v-if="open && isMobile"
  class="fixed inset-0 bg-black/30 z-40 lg:hidden"
  @click="open = false"
/>

<!-- Dropdown -->
<div
  v-if="open"
  class="fixed lg:absolute z-50 lg:top-full lg:right-0 lg:mt-1 w-[calc(100vw-16px)] max-w-[95vw] lg:w-56 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 max-h-[70vh] overflow-y-auto"
  :class="isMobile ? 'inset-x-2 top-20' : ''"
>
```

**Melhorias:**
- ✅ `fixed` em mobile, `absolute` em desktop (lg:)
- ✅ `w-[calc(100vw-16px)]` → Largura responsiva com margem de 8px
- ✅ `max-w-[95vw]` → Nunca ultrapassa 95% da viewport
- ✅ `lg:w-56` → Largura fixa apenas em desktop
- ✅ `inset-x-2 top-20` → Centralizado horizontalmente em mobile
- ✅ `max-h-[70vh] overflow-y-auto` → Scroll interno se necessário
- ✅ Overlay semi-transparente em mobile (z-40)
- ✅ Clique no overlay fecha o dropdown

---

## 📝 Script Changes

### ANTES
```typescript
import { ref, onMounted, onUnmounted } from 'vue'

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
```

### DEPOIS
```typescript
import { ref, onMounted, onUnmounted, computed } from 'vue'

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 1024)
```

**Adicionado:**
- `computed` do Vue
- `isMobile` → Detecta viewport < 1024px (breakpoint `lg`)

---

## 🎯 Comportamento

### Mobile (< 1024px)
- Dropdown aparece como modal centralizado
- Overlay semi-transparente ao fundo
- Largura: 100vw - 16px (8px margem em cada lado)
- Posição: `top-20` (80px do topo)
- Altura máxima: 70vh com scroll
- Clique no overlay fecha

### Desktop (≥ 1024px)
- Dropdown ancorado ao botão (comportamento original)
- Largura fixa: 224px (w-56)
- Sem overlay
- Posicionamento relativo ao botão

---

## ✅ Checklist de Testes

- [x] Desktop funciona como antes
- [x] Mobile não sai da viewport
- [x] Overlay fecha o dropdown
- [x] Scroll interno funciona
- [x] Drag-and-drop preservado
- [x] Checkboxes funcionam
- [x] TypeScript válido
- [x] Sem erros de diagnóstico

---

## 📦 Commit Sugerido

```
fix(mobile): corrige dropdown "Colunas" saindo da viewport

- Adiciona posicionamento responsivo (fixed em mobile, absolute em desktop)
- Implementa overlay semi-transparente em mobile
- Largura adaptativa: calc(100vw-16px) em mobile, w-56 em desktop
- Adiciona scroll interno com max-h-[70vh]
- Breakpoint: lg (1024px)

Closes: #[issue-number]
```

---

## 🔧 Solução Reutilizável

Este padrão pode ser aplicado a outros dropdowns:

```vue
<!-- Overlay mobile -->
<div v-if="open && isMobile" class="fixed inset-0 bg-black/30 z-40 lg:hidden" @click="open = false" />

<!-- Dropdown responsivo -->
<div
  class="fixed lg:absolute z-50 lg:top-full lg:right-0 w-[calc(100vw-16px)] max-w-[95vw] lg:w-56 max-h-[70vh] overflow-y-auto"
  :class="isMobile ? 'inset-x-2 top-20' : ''"
>
```

```typescript
const isMobile = computed(() => typeof window !== 'undefined' && window.innerWidth < 1024)
```
