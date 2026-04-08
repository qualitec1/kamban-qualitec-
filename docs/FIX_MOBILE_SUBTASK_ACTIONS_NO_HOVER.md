# Correção: Ações de Subtarefa Acessíveis no Mobile (Sem Hover)

## Problema Identificado

No mobile, os botões de ação das subtarefas (abrir detalhes e excluir) eram invisíveis porque dependiam de hover do mouse:
- Desktop: botões aparecem ao passar o mouse (`group-hover:opacity-100`)
- Mobile: não existe hover, então botões ficam sempre invisíveis (`opacity-0`)
- Usuário não consegue acessar ações essenciais no mobile
- UX completamente quebrada em dispositivos touch

## Causa Raiz

Os botões usavam classes que dependem de hover:
```vue
<button class="opacity-0 group-hover:opacity-100">
  <!-- Invisível no mobile! -->
</button>
```

No mobile, sem mouse hover, os botões permaneciam com `opacity-0` permanentemente.

## Solução Implementada

Separei o comportamento mobile/desktop usando prefixo `lg:`:

### Antes (Quebrado no Mobile)
```vue
<button class="opacity-0 group-hover:opacity-100">
  Abrir detalhes
</button>
```

### Depois (Funciona em Ambos)
```vue
<button class="lg:opacity-0 lg:group-hover:opacity-100 touch-manipulation">
  Abrir detalhes
</button>
```

## Como Funciona

### Mobile (< 1024px)
- Botões SEMPRE visíveis (sem `opacity-0`)
- Touch-friendly com área mínima de 40x40px
- `touch-manipulation` para resposta imediata
- `-webkit-tap-highlight-color: transparent` remove flash azul
- Ícones claros e acessíveis

### Desktop (>= 1024px)
- Botões aparecem ao hover (`lg:opacity-0 lg:group-hover:opacity-100`)
- Comportamento original preservado
- Interface limpa quando não está em uso
- Hover reveal mantido

## Melhorias Aplicadas

1. **Visibilidade no Mobile**:
   - Botões sempre visíveis (sem `opacity-0` no mobile)
   - Apenas desktop usa hover reveal (`lg:` prefix)
   - Ícones com contraste adequado

2. **Touch-Friendly**:
   - Área de toque mínima: 40x40px
   - `touch-manipulation` para resposta imediata
   - Sem conflito com scroll horizontal
   - Feedback visual ao tocar

3. **Botões Afetados**:
   - ✅ Abrir detalhes (seta direita)
   - ✅ Excluir/deletar (lixeira)
   - Ambos agora acessíveis no mobile

4. **CSS Adicionado**:
```css
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  min-width: 40px;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

## Arquivos Modificados

- `app/components/SubtaskRow.vue`
  - Removido `opacity-0 group-hover:opacity-100` global
  - Adicionado `lg:opacity-0 lg:group-hover:opacity-100` (desktop only)
  - Adicionado `touch-manipulation` para melhor UX mobile
  - CSS para área de toque adequada

## Resultado

✅ Mobile: botões sempre visíveis e clicáveis
✅ Desktop: hover reveal preservado
✅ Touch target adequado (40x40px mínimo)
✅ Resposta imediata ao toque
✅ Sem conflito com scroll horizontal
✅ Feedback visual apropriado
✅ Acessibilidade mantida

## Teste de Aceitação

1. Abra o board no mobile
2. Expanda uma tarefa com subtarefas
3. Veja os botões de ação à direita de cada subtarefa
4. Botões devem estar SEMPRE visíveis
5. Toque em "Abrir detalhes" → painel abre
6. Toque em "Excluir" → confirmação aparece
7. Desktop: hover ainda funciona normalmente
8. Sem necessidade de mouse ou hover

## Padrão Aplicado

Este padrão deve ser usado em qualquer componente que tenha ações dependentes de hover:

```vue
<!-- ❌ ERRADO: Invisível no mobile -->
<button class="opacity-0 group-hover:opacity-100">

<!-- ✅ CORRETO: Visível no mobile, hover no desktop -->
<button class="lg:opacity-0 lg:group-hover:opacity-100 touch-manipulation">
```

## Benefícios

- UX consistente entre mobile e desktop
- Ações sempre acessíveis em touch devices
- Mantém interface limpa no desktop
- Segue padrões de acessibilidade
- Touch targets adequados (WCAG 2.1)
