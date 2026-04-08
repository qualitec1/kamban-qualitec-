# Responsividade Mobile - Solução Final

## Problema Identificado
O dropdown de Status/Prioridade não estava aparecendo centralizado em mobile, ficando no canto superior esquerdo.

## Solução Implementada

### 1. Cálculo de Posição Preciso para Mobile

```typescript
function calcPosition() {
  isMobile.value = window.innerWidth < 768
  
  if (isMobile.value) {
    // Mobile: centralizar na tela com margem de 16px
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dropdownWidth = viewportWidth - 32 // 16px margem em cada lado
    const dropdownHeight = Math.min(90 * viewportHeight / 100, 600)
    
    const left = 16 // 16px margem esquerda
    const top = (viewportHeight - dropdownHeight) / 2 // Centralizar verticalmente
    
    dropdownStyle.value = {
      top: `${Math.max(16, top)}px`,
      left: `${left}px`,
      width: `${dropdownWidth}px`,
      maxHeight: '90vh',
    }
  } else {
    // Desktop: posicionar perto do botão
    // ... lógica desktop
  }
}
```

### 2. Uso de nextTick para Sincronização

```typescript
function toggleDropdown() {
  open.value = !open.value
  if (open.value) {
    statusOrder.value = statuses.value.map(s => s.id)
    // Usar nextTick para garantir que o DOM foi atualizado
    nextTick(() => {
      calcPosition()
    })
  }
}
```

**Por que nextTick?**
- Garante que o Teleport renderizou o dropdown no DOM
- Calcula a posição APÓS o elemento estar visível
- Evita cálculos com valores undefined

### 3. Template Responsivo

```vue
<!-- Overlay para mobile -->
<div
  v-if="open && canEditTasks && isMobile"
  class="fixed inset-0 bg-black/30 z-[9998]"
  @click="open = false"
/>

<!-- Dropdown -->
<div
  v-if="open && canEditTasks"
  class="fixed z-[9999] bg-white border border-neutral-200 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
  :class="isMobile ? 'w-[calc(100vw-32px)] max-h-[90vh]' : 'w-[600px]'"
  :style="dropdownStyle"
>
```

**Características:**
- Overlay semi-transparente em mobile (z-[9998])
- Dropdown acima do overlay (z-[9999])
- Largura: 100vw - 32px (16px margem em cada lado)
- Altura máxima: 90vh
- Layout vertical em mobile, horizontal em desktop (md:)

## Viewport Testado
- **430x932** (iPhone SE / Mobile)
- Funciona perfeitamente centralizado

## Comportamento

### Mobile (<768px)
1. Clique em Status/Prioridade
2. Overlay aparece (bg-black/30)
3. Dropdown aparece centralizado com 16px de margem
4. Clique no overlay fecha o dropdown
5. Painéis empilhados verticalmente

### Desktop (≥768px)
1. Clique em Status/Prioridade
2. Dropdown aparece próximo ao botão
3. Sem overlay
4. Painéis lado a lado (50% cada)

## Arquivos Modificados
- `app/components/StatusCell.vue`
- `app/components/PriorityCell.vue`

## Imports Adicionados
```typescript
import { nextTick } from 'vue'
```

## Testes Recomendados
1. ✅ Abrir dropdown em mobile (430x932)
2. ✅ Verificar centralização
3. ✅ Clicar no overlay para fechar
4. ✅ Redimensionar para desktop
5. ✅ Verificar posicionamento ao lado do botão
6. ✅ Testar em diferentes tamanhos de tela
