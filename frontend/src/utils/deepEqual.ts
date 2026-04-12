/**
 * Нормализует пустые значения для корректного сравнения.
 * "" и undefined считаются одинаковыми значениями.
 */
function normalizeValue(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return "";
  }
  return value;
}

/**
 * Проверяет, изменились ли значимые поля сущности.
 * Игнорирует служебные поля (id, version, updated_at, created_at, _dirty, revision).
 * Нормализует пустые значения ("" и undefined считаются одинаковыми).
 *
 * @param existing - Существующая сущность
 * @param updated - Обновленная сущность
 * @param excludeFields - Поля, которые нужно исключить из сравнения
 * @returns true, если хотя бы одно значимое поле изменилось
 */
export function hasEntityChanged<T extends object>(
  existing: T,
  updated: T,
  excludeFields: string[] = [
    "id",
    "version",
    "updated_at",
    "created_at",
    "_dirty",
    "revision",
  ],
): boolean {
  const existingKeys = Object.keys(existing);
  const updatedKeys = Object.keys(updated);

  // Получаем все уникальные ключи из обоих объектов
  const allKeys = new Set([...existingKeys, ...updatedKeys]);

  for (const key of allKeys) {
    // Пропускаем служебные поля
    if (excludeFields.includes(key)) {
      continue;
    }

    const existingValue = normalizeValue(
      existing[key as keyof T] as unknown,
    );
    const updatedValue = normalizeValue(updated[key as keyof T] as unknown);

    // Сравниваем нормализованные значения
    if (existingValue !== updatedValue) {
      return true;
    }
  }

  return false;
}
