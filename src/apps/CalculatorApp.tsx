import { useState } from "react";

type Operator = "+" | "-" | "*" | "/" | null;

type CalculatorButton = {
  label: string;
  variant?: "accent" | "muted" | "operator";
};

const buttonRows: CalculatorButton[][] = [
  [
    { label: "C", variant: "muted" },
    { label: "+/-", variant: "muted" },
    { label: "%", variant: "muted" },
    { label: "/", variant: "operator" },
  ],
  [
    { label: "7" },
    { label: "8" },
    { label: "9" },
    { label: "*", variant: "operator" },
  ],
  [
    { label: "4" },
    { label: "5" },
    { label: "6" },
    { label: "-", variant: "operator" },
  ],
  [
    { label: "1" },
    { label: "2" },
    { label: "3" },
    { label: "+", variant: "operator" },
  ],
  [
    { label: "0" },
    { label: "." },
    { label: "=", variant: "accent" },
  ],
];

function formatValue(value: string) {
  if (value.length <= 12) {
    return value;
  }

  return Number(value).toPrecision(10);
}

function calculate(left: number, right: number, operator: Exclude<Operator, null>) {
  if (operator === "+") {
    return left + right;
  }

  if (operator === "-") {
    return left - right;
  }

  if (operator === "*") {
    return left * right;
  }

  if (right === 0) {
    return Number.NaN;
  }

  return left / right;
}

function CalculatorApp() {
  const [displayValue, setDisplayValue] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
      return;
    }

    setDisplayValue((current) => (current === "0" ? digit : `${current}${digit}`));
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplayValue("0.");
      setWaitingForOperand(false);
      return;
    }

    setDisplayValue((current) => (current.includes(".") ? current : `${current}.`));
  };

  const handleClear = () => {
    setDisplayValue("0");
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleToggleSign = () => {
    setDisplayValue((current) => {
      if (current === "0") {
        return current;
      }

      return current.startsWith("-") ? current.slice(1) : `-${current}`;
    });
  };

  const handlePercent = () => {
    setDisplayValue((current) => `${Number(current) / 100}`);
  };

  const handleOperator = (nextOperator: Exclude<Operator, null>) => {
    const inputValue = Number(displayValue);

    if (storedValue === null) {
      setStoredValue(inputValue);
    } else if (operator && !waitingForOperand) {
      const nextValue = calculate(storedValue, inputValue, operator);
      const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
      setStoredValue(safeValue);
      setDisplayValue(`${safeValue}`);
    }

    setOperator(nextOperator);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    if (operator === null || storedValue === null) {
      return;
    }

    const nextValue = calculate(storedValue, Number(displayValue), operator);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    setDisplayValue(`${safeValue}`);
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleButtonClick = (label: string) => {
    if (/\d/.test(label)) {
      handleDigit(label);
      return;
    }

    if (label === ".") {
      handleDecimal();
      return;
    }

    if (label === "C") {
      handleClear();
      return;
    }

    if (label === "+/-") {
      handleToggleSign();
      return;
    }

    if (label === "%") {
      handlePercent();
      return;
    }

    if (label === "=") {
      handleEquals();
      return;
    }

    handleOperator(label as Exclude<Operator, null>);
  };

  return (
    <div className="calculator-app">
      <div className="calculator-display-shell">
        <div className="calculator-status">
          <span>calc</span>
          <span>{operator ?? "ready"}</span>
        </div>
        <div className="calculator-display">{formatValue(displayValue)}</div>
      </div>

      <div className="calculator-grid">
        {buttonRows.flat().map((button) => (
          <button
            key={button.label}
            className={`calculator-button${button.variant ? ` calculator-button--${button.variant}` : ""}${
              button.label === "0" ? " calculator-button--wide" : ""
            }`}
            type="button"
            onClick={() => handleButtonClick(button.label)}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CalculatorApp;
