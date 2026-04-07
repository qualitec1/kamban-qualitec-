import { ref, type Ref } from 'vue'

/**
 * Retorna classes de posicionamento adaptativo para dropdowns.
 * Verifica se há espaço à direita do elemento trigger.
 * Se não houver, abre à esquerda (right-0).
 */
export function useDropdownPosition(rootRef: Ref<HTMLElement | null>) {
  const alignRight = ref(false)

  function updatePosition() {
    if (!rootRef.value) return
    const rect = rootRef.value.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.left
    // Se menos de 200px à direita, abre para a esquerda
    alignRight.value = spaceRight < 200
  }

  return { alignRight, updatePosition }
}
