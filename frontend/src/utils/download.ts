/** Сохранить файл из ответа API: вне MAX и на ПК — обычное скачивание браузером. */
export const saveFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Даём браузеру начать загрузку, потом освобождаем память
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
