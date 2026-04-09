# Mobile Header Adaptativo — Tarefa 7.1.1

## Objetivo
Implementar header touch-friendly mobile com navegação otimizada para celular, proporcionando UX nativa de app mobile.

## Critérios de Aceite Implementados

### ✅ 1. Hamburguer Icon 44px Touch Target
- Botão de menu com `min-w-[44px] min-h-[44px]` (44x44px)
- Ícone maior no mobile (w-6 h-6 vs w-5 h-5 desktop)
- Classe `touch-manipulation` para resposta imediata
- Área de toque confortável sem zoom acidental

### ✅ 2. Menu Lateral Slide-in 80% Width
- Mobile: `w-[80vw] max-w-[320px]` (80% da viewport, máximo 320px)
- Desktop: `w-64` (256px) quando aberto, `w-16` quando colapsado
- Transição suave de 300ms
- Z-index correto (z-50 mobile, z-40 desktop)

### ✅ 3. Boards Como Lista Vertical Full-Height
- Navegação vertical com scroll suave
- Seções organizadas: Main → Áreas → Favoritos → Recentes
- `overflow-y-auto` com `scrollbar-hide`
- Touch-friendly com `touch-pan-y` e `-webkit-overflow-scrolling: touch`

### ✅ 4. Swipe Right Fecha Menu
- Detecção de swipe implementada no sidebar
- Swipe horizontal > 50px fecha o menu
- Swipe vertical < 30px para evitar conflito com scroll
- Também funciona no overlay (backdrop)
- Eventos touch com `{ passive: true }` para performance

### ✅ 5. Back Button Tasks (iOS Style)
- Overlay escuro com backdrop-blur (`bg-neutral-900/50 backdrop-blur-sm`)
- Toque no overlay fecha o menu
- Transição fade suave (200ms)
- Comportamento nativo iOS/Android

### ✅ 6. Status Bar Awareness (env(safe-area-inset-top))
- Header: `paddingTop: 'env(safe-area-inset-top)'`
- Layout: `paddingTop/Bottom: 'env(safe-area-inset-top/bottom)'`
- Sidebar mobile: `paddingTop: 'env(safe-area-inset-top)'` quando aberto
- Compatível com notch/dynamic island (iPhone X+)
- Compatível com barra de navegação Android

## Arquivos Modificados

### 1. `app/components/AppHeader.vue`
**Mudanças:**
- Hamburguer button: 44x44px touch target
- Avatar button: touch-friendly com área mínima
- Dropdown menu: largura adaptativa mobile (w-64) vs desktop (w-56)
- Itens do menu: padding maior no mobile (py-3) vs desktop (py-2.5)
- Ícones maiores no mobile (w-5 h-5) vs desktop (w-4 h-4)
- Safe-area-inset-top no header
- Classe `touch-manipulation` em todos os botões

**CSS adicionado:**
```css
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
```

### 2. `app/components/AppSidebar.vue`
**Mudanças:**
- Width mobile: `w-[80vw] max-w-[320px]`
- Safe-area-inset-top quando aberto no mobile
- Logo com nome "Qualitec" visível no mobile
- Botão "Adicionar área": 44x44px touch target
- Swipe right detection implementada
- Touch events com passive listeners
- Prop `isMobile` passada para SidebarItem
- Classes `touch-pan-y` e `-webkit-overflow-scrolling: touch`

**Lógica de swipe:**
```typescript
// Detecta swipe horizontal > 50px e vertical < 30px
if (deltaX > 50 && deltaY < 30) {
  emit('toggle')
}
```

**CSS adicionado:**
```css
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.touch-pan-y {
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
}
```

### 3. `app/components/SidebarItem.vue`
**Mudanças:**
- Classe `touch-manipulation` adicionada
- Prop `isMobile` opcional
- Remoção de console.log desnecessário

### 4. `app/layouts/default.vue`
**Mudanças:**
- Safe-area-inset-top e bottom no container principal
- Overlay mais escuro: `bg-neutral-900/50` (era 40%)
- Função `closeSidebar()` centralizada
- Swipe detection no overlay
- Touch events com passive listeners

## Comportamento Mobile vs Desktop

### Mobile (< 768px)
- Sidebar: overlay fixo, 80% width, swipe to close
- Header: botões maiores, touch-friendly
- Menu dropdown: largura maior (w-64)
- Overlay escuro com backdrop-blur
- Safe-area-inset para notch/barra de navegação

### Desktop (>= 768px)
- Sidebar: coluna lateral, colapsável com Ctrl+.
- Header: botões menores, hover states
- Menu dropdown: largura padrão (w-56)
- Sem overlay
- Estado persistido em localStorage

## Padrões Aplicados

### Touch Targets
- Mínimo 44x44px em todos os botões mobile
- Classe `touch-manipulation` para resposta imediata
- `-webkit-tap-highlight-color: transparent` remove flash azul

### Swipe Gestures
- Horizontal > 50px para ação
- Vertical < 30px para evitar conflito com scroll
- Passive event listeners para performance

### Safe Area
- `env(safe-area-inset-top)` no header e layout
- `env(safe-area-inset-bottom)` no layout
- Compatível com iPhone X+ e Android com barra de navegação

### Transições
- Sidebar: 300ms ease
- Overlay: 200ms cubic-bezier
- Dropdown: 150ms ease

## Teste de Aceitação

### Mobile
1. Abra o app no celular (< 768px)
2. Toque no hamburguer (44x44px) → menu abre com 80% width
3. Swipe right no menu → fecha
4. Toque no overlay → fecha
5. Navegue para uma página → menu fecha automaticamente
6. Verifique safe-area no iPhone X+ (notch não sobrepõe conteúdo)
7. Verifique barra de navegação Android (não sobrepõe footer)

### Desktop
1. Abra o app no desktop (>= 768px)
2. Clique no hamburguer → sidebar colapsa/expande
3. Ctrl+. → toggle sidebar
4. Estado persiste após reload
5. Sem overlay, sidebar é coluna lateral

## Benefícios

- UX nativa de app mobile
- Touch targets adequados (WCAG 2.1)
- Swipe gestures intuitivos
- Safe-area awareness (iPhone X+, Android)
- Performance otimizada (passive listeners)
- Transições suaves
- Compatível com notch/dynamic island
- Sem conflito entre swipe e scroll

## Próximos Passos

- Tarefa 7.1.2: Board View Mobile Optimization
- Tarefa 7.1.3: Task Modal Mobile Adaptation
- Tarefa 7.1.4: Dropdown Positioning Mobile

## Referências

- Monday.com mobile navigation
- iOS Human Interface Guidelines
- Android Material Design
- WCAG 2.1 Touch Target Size
- CSS env() safe-area-inset
