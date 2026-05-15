import { AnalyzeWizard } from "../features/analyze/AnalyzeWizard";
import { appName } from "../shared/lib/env";

export function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">HR astrology intelligence</span>
          <h1>{appName}: совместимость кандидата и роли без лишней мистики</h1>
          <p>
            Приложение берёт данные кандидата, описание компании и вакансии,
            строит карту в безопасном backend-контуре и отдаёт ИИ только
            структурированный контекст. Ключи GigaChat остаются на сервере.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#analysis">
              Начать анализ
            </a>
            <a className="button button-ghost" href="#security">
              Как защищены ключи
            </a>
          </div>
        </div>
        <div className="hero-card" aria-label="Ключевые преимущества">
          <div>
            <strong>0</strong>
            <span>секретов во фронтенде</span>
          </div>
          <div>
            <strong>3</strong>
            <span>шага до отчёта</span>
          </div>
          <div>
            <strong>API</strong>
            <span>через BFF и RTK Query</span>
          </div>
        </div>
      </section>

      <AnalyzeWizard />

      <section className="security-strip" id="security">
        <span className="eyebrow">Безопасность</span>
        <h2>Ключи ИИ не попадают в браузер</h2>
        <p>
          Frontend использует только публичный `VITE_API_URL`. `GIGACHAT_*`
          хранится в окружении API, GitHub Secrets или настройках хостинга.
          Ответы и ошибки API не раскрывают токены, заголовки авторизации и
          внутреннюю конфигурацию.
        </p>
      </section>
    </main>
  );
}
