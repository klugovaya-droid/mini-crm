import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/features/auth/login-page";
import {
  AuthContext,
  type AuthContextValue,
} from "@/features/auth/auth-context";
import { mapAuthError } from "@/lib/auth-errors";

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    session: null,
    profile: null,
    loading: false,
    configError: null,
    profileError: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

function renderLogin(value: AuthContextValue) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("renders the login form without a registration link", () => {
    renderLogin(authValue());

    expect(screen.getByRole("heading", { name: "Вход" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByText(/Регистрация отключена/)).toBeInTheDocument();
  });

  it("shows the configuration error", () => {
    renderLogin(authValue({ configError: "Нет переменных окружения" }));

    expect(
      screen.getByRole("heading", { name: "Приложение не настроено" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Нет переменных окружения")).toBeInTheDocument();
  });

  it("validates the email before calling signIn", async () => {
    const signIn = vi.fn();
    renderLogin(authValue({ signIn }));
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Пароль"), "Demo1234!");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Введите корректный email")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });
});

describe("mapAuthError", () => {
  it("maps invalid credentials", () => {
    expect(mapAuthError("Invalid login credentials")).toBe("Неверный email или пароль.");
  });

  it("maps disabled signups", () => {
    expect(mapAuthError("Signups not allowed for this instance")).toContain(
      "Регистрация отключена",
    );
  });

  it("falls back to a safe message", () => {
    expect(mapAuthError("unexpected")).toContain("Не удалось войти");
  });
});
