/**
 * Склоняет существительное в зависимости от числительного.
 * @param count — число
 * @param words — кортеж из трёх форм: [один, два-четыре, пять+]
 * @returns строка вида "5 декоров"
 */
export function pluralizeRu(count: number, words: [string, string, string]): string {
  const cases = [2, 0, 1, 1, 1, 2]
  const index =
    count % 100 > 4 && count % 100 < 20
      ? 2
      : cases[count % 10 < 5 ? count % 10 : 5]
  return `${count} ${words[index]}`
}
