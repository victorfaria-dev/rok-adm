// @vitest-environment happy-dom
// Q2 P2-3 / P2-4: tools number fields share the k/m/b parser, refuse negatives and scientific notation.
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NumberField, inputText } from "./NumberField";

afterEach(cleanup);

function field(props: Partial<Parameters<typeof NumberField>[0]> = {}) {
  const onChange = vi.fn();
  render(h(NumberField, { id: "f", label: "Seus pontos VIP agora", value: 0, onChange, ...props }));
  const input = screen.getByLabelText("Seus pontos VIP agora") as HTMLInputElement;
  const type = (t: string) => fireEvent.input(input, { target: { value: t } });
  return { onChange, input, type };
}

describe("NumberField", () => {
  it("accepts shorthand and thousands commas", () => {
    const { onChange, type } = field();
    type("1.5k");
    expect(onChange).toHaveBeenLastCalledWith(1500);
    type("2,400,000");
    expect(onChange).toHaveBeenLastCalledWith(2_400_000);
    type("3m");
    expect(onChange).toHaveBeenLastCalledWith(3_000_000);
  });

  it("rejects a negative number with an inline error and keeps the last value", () => {
    const { onChange, input, type } = field();
    type("-5");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Use 0 ou mais.")).toBeTruthy();
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("rejects scientific notation instead of reading 1e3 as 1000", () => {
    const { onChange, type } = field();
    type("1e3");
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Digite um número inteiro, como 1500/)).toBeTruthy();
  });

  it("decimal fields keep decimals; whole-number fields refuse them", () => {
    const d = field({ integer: false });
    d.type("12.5");
    expect(d.onChange).toHaveBeenLastCalledWith(12.5);
    cleanup();
    const w = field();
    w.type("12.5");
    expect(w.onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Digite um número inteiro.")).toBeTruthy();
  });

  it("shows stored values without scientific notation", () => {
    expect(inputText(1e21)).toBe("1000000000000000000000");
    expect(inputText(0.0000005)).toBe("0.000001");
    expect(inputText(45.68)).toBe("45.68");
    const { input } = field({ value: 1e9 });
    expect(input.value).toBe("1000000000");
  });
});
