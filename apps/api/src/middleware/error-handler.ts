import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

type PublicError = {
  message: string;
  status?: number;
};

export class AppError extends Error {
  public readonly status: number;

  public constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export const notFoundHandler = () => {
  throw new AppError("Маршрут не найден", 404);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Проверьте заполнение формы",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  const publicError = error as PublicError;
  const status = publicError.status ?? 500;

  res.status(status).json({
    message:
      status >= 500
        ? "Сервис временно недоступен. Попробуйте позже."
        : publicError.message,
  });
};
