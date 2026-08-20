const CONFIRMATION_MESSAGE =
  'Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить.'

export function confirmDelete(onConfirm: () => void): boolean {
  const confirmed = window.confirm(CONFIRMATION_MESSAGE)
  if (confirmed) {
    onConfirm()
  }
  return confirmed
}
