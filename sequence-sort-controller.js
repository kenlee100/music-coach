export function createSequenceSortController(container, { onReorder, onAnnounce, beforeSort }) {
  let drag = null;
  let keyboardIndex = null;

  function items() {
    return [...container.querySelectorAll('.sequence-item')];
  }

  function move(from, to) {
    if (from === to || to < 0 || to >= items().length) return from;
    beforeSort();
    onReorder(from, to);
    onAnnounce(`已將第 ${from + 1} 顆和弦移到第 ${to + 1} 個位置`);
    return to;
  }

  function clearDrag() {
    drag = null;
    container.querySelector('.dragging')?.classList.remove('dragging');
    container.querySelectorAll('.drop-target').forEach(item => item.classList.remove('drop-target'));
  }

  function reset() {
    clearDrag();
    keyboardIndex = null;
    container.querySelectorAll('[data-drag-handle][aria-pressed="true"]').forEach(handle => handle.setAttribute('aria-pressed', 'false'));
  }

  container.addEventListener('pointerdown', event => {
    const handle = event.target.closest('[data-drag-handle]');
    if (!handle) return;
    const item = handle.closest('.sequence-item');
    drag = { pointerId: event.pointerId, from: Number(item.dataset.index), to: Number(item.dataset.index) };
    handle.setPointerCapture(event.pointerId);
    item.classList.add('dragging');
  });

  container.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const candidates = items();
    const target = candidates.find(item => event.clientX < item.getBoundingClientRect().left + item.offsetWidth / 2);
    drag.to = target ? Number(target.dataset.index) : candidates.length - 1;
    candidates.forEach(item => item.classList.toggle('drop-target', Number(item.dataset.index) === drag.to));
  });

  function completePointer(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const { from, to } = drag;
    clearDrag();
    move(from, to);
  }

  function cancelPointer(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    clearDrag();
  }

  container.addEventListener('pointerup', completePointer);
  container.addEventListener('pointercancel', cancelPointer);
  container.addEventListener('lostpointercapture', cancelPointer);
  container.addEventListener('keydown', event => {
    const handle = event.target.closest('[data-drag-handle]');
    if (!handle) return;
    const index = Number(handle.closest('.sequence-item').dataset.index);
    if (event.code === 'Space') {
      event.preventDefault();
      keyboardIndex = keyboardIndex == null ? index : null;
      handle.setAttribute('aria-pressed', String(keyboardIndex != null));
      onAnnounce(keyboardIndex == null ? '排序完成' : `已選取第 ${index + 1} 顆和弦，可用左右方向鍵移動`);
    } else if (keyboardIndex != null && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault();
      const next = move(keyboardIndex, keyboardIndex + (event.key === 'ArrowLeft' ? -1 : 1));
      keyboardIndex = next;
      requestAnimationFrame(() => {
        const nextHandle = container.querySelector(`[data-index="${next}"] [data-drag-handle]`);
        nextHandle?.setAttribute('aria-pressed', 'true');
        nextHandle?.focus();
      });
    } else if (event.key === 'Escape') {
      keyboardIndex = null;
      handle.setAttribute('aria-pressed', 'false');
      onAnnounce('已取消鍵盤排序');
    }
  });

  return { reset };
}
