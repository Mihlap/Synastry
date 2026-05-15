import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
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

export function notFoundHandler(_request: FastifyRequest, reply: FastifyReply) {
  return reply.status(404).send({ message: "Маршрут не найден" });
}

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: "Проверьте заполнение формы",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const publicError = error as PublicError;
  const status = publicError.status ?? 500;

  return reply.status(status).send({
    message:
      status >= 500
        ? "Сервис временно недоступен. Попробуйте позже."
        : publicError.message,
  });
}
