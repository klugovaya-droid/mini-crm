export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Email не подтверждён. Обратитесь к руководителю.";
  }
  if (normalized.includes("signups not allowed") || normalized.includes("signup")) {
    return "Регистрация отключена. Доступ выдаёт руководитель.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Слишком много попыток. Попробуйте позже.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "Нет связи с сервером. Проверьте подключение.";
  }

  return "Не удалось войти. Проверьте данные и попробуйте ещё раз.";
}
