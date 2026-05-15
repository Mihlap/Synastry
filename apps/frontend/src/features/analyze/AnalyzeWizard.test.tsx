import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { store } from "../../app/store";
import { AnalyzeWizard } from "./AnalyzeWizard";

describe("AnalyzeWizard", () => {
  it("renders the first candidate step", () => {
    render(
      <Provider store={store}>
        <AnalyzeWizard />
      </Provider>,
    );

    expect(screen.getByLabelText(/ФИО кандидата/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Далее/i })).toBeInTheDocument();
  });
});
