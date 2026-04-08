# Melhorias de Responsividade Mobile

## Resumo das Mudanças

### 1. StatusCell.vue e PriorityCell.vue - Dropdown Responsivo (Mobile-First)

#### Desktop (≥768px)
- Dropdown com largura fixa de 600px
- Posicionado próximo ao botão (acima ou abaixo)
- Layout horizontal com dois painéis lado a lado:
  - Painel esquerdo (50%): Seleção de status/prioridade
  - Painel direito (50%): Gerenciador (criar, editar, reordenar)

#### Mobile (<768px)
- Dropdown com `inset-4` (16px de margem em todos os lados)
- Centralizado na tela usando Tailwind `inset-4`
- Altura máxima: 90vh
- Overlay semi-transparente (bg-black/30) ao fundo para melhor UX
- Layout vertical com painéis empilhados:
  - Painel superior: Seleção de status/prioridade
  - Painel inferior: Gerenciador (quando "Editar etiquetas" é clicado)
- Clique no overlay fecha o dropdown

#### Implementação
```typescript
const isMobile = ref(false)

function calcPosition() {
  isMobile.value = window.innerWidth < 768
  
  if (!isMobile.value) {
    // Desktop: posicionar perto do botão
    const rect = rootRef.value.getBoundingClientRect()
    // ... lógica de posicionamento
  }
  // Mobile usa classes Tailwind (inset-4) em vez de inline styles
}
```

#### Template
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
  :class="[
    isMobile ? 'inset-4 w-auto h-auto max-h-[90vh]' : 'w-[600px]'
  ]"
  :style="!isMobile ? dropdownStyle : {}"
>
```

### 2. TaskRow.vue - Scroll Horizontal Melhorado

#### Melhorias
- Adicionado `snap-x snap-mandatory` para scroll suave em mobile
- Cada célula envolvida em `snap-start` para melhor alinhamento
- Mantém `overflow-x-auto` para scroll horizontal
- Scrollbar oculta em todos os navegadores

#### Benefícios
- Scroll mais suave e natural em mobile
- Melhor alinhamento das colunas ao parar o scroll
- Experiência similar ao Monday.com

## Testando

### Desktop
1. Abra o dropdown de Status/Prioridade
2. Verifique se aparece com 600px de largura
3. Redimensione a janela para <768px
4. Dropdown deve se reposicionar para o centro com overlay

### Mobile
1. Abra em um dispositivo mobile ou emulador
2. Clique em Status ou Prioridade
3. Dropdown deve aparecer centralizado com overlay semi-transparente
4. Toque no overlay para fechar
5. Toque em "Editar etiquetas" para ver o gerenciador
6. Deslize a tabela para ver mais colunas (scroll horizontal)

## Notas
- O dropdown se reposiciona automaticamente ao redimensionar a janela
- Em mobile, o dropdown usa `inset-4` (Tailwind) para centralização perfeita
- Overlay ao fundo melhora a UX e permite fechar clicando fora
- O scroll horizontal funciona em todas as linhas da tabela
- Mobile-first: começa com layout mobile e expande para desktop com `md:` breakpoint
