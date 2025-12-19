/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DotPlot } from "./DotPlot";
import { BoxPlot } from "./BoxPlot";

describe("Visualizers", () => {
  describe("DotPlot", () => {
    it("renders SVG with correct dimensions", () => {
      const { container } = render(<DotPlot data={[1, 2, 2, 3]} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "400");
      expect(svg).toHaveAttribute("height", "200");
    });

    it("renders with custom dimensions", () => {
      const { container } = render(
        <DotPlot data={[1, 2, 3]} width={600} height={300} />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "600");
      expect(svg).toHaveAttribute("height", "300");
    });

    it("renders dots for each data point", () => {
      const { container } = render(<DotPlot data={[1, 1, 2, 3]} />);
      const circles = container.querySelectorAll("circle");
      // 4 data points = 4 dots
      expect(circles.length).toBe(4);
    });

    it("renders tick marks for each unique value", () => {
      const { container } = render(<DotPlot data={[2, 4]} />);
      // Range is 2-4, so ticks at 2, 3, 4 = 3 ticks
      const tickGroups = container.querySelectorAll("g");
      expect(tickGroups.length).toBe(3);
    });
  });

  describe("BoxPlot", () => {
    it("renders SVG with correct dimensions", () => {
      const { container } = render(
        <BoxPlot min={0} q1={25} median={50} q3={75} max={100} />
      );
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("width", "400");
      expect(svg).toHaveAttribute("height", "150");
    });

    it("renders with custom dimensions", () => {
      const { container } = render(
        <BoxPlot
          min={0}
          q1={25}
          median={50}
          q3={75}
          max={100}
          width={500}
          height={200}
        />
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("width", "500");
      expect(svg).toHaveAttribute("height", "200");
    });

    it("renders box rectangle", () => {
      const { container } = render(
        <BoxPlot min={0} q1={25} median={50} q3={75} max={100} />
      );
      const rect = container.querySelector("rect");
      expect(rect).toBeInTheDocument();
    });

    it("renders five-number summary labels", () => {
      const { container } = render(
        <BoxPlot min={10} q1={25} median={50} q3={75} max={90} />
      );
      const texts = container.querySelectorAll("text");
      // Labels for: min, q1, median, q3, max = 5 labels
      expect(texts.length).toBe(5);
    });
  });
});
