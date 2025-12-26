/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DotPlot } from "./DotPlot";
import { BoxPlot } from "./BoxPlot";
import { ProblemVisualizer } from "./ProblemVisualizer";
import type { VisualSpec } from "../../domain/types";

describe("Visualizers", () => {
  describe("ProblemVisualizer", () => {
    it("renders BoxPlot when spec.type is 'box_plot'", () => {
      const spec: VisualSpec = {
        type: "box_plot",
        data: { min: 0, q1: 25, median: 50, q3: 75, max: 100 },
      };
      const { container } = render(<ProblemVisualizer spec={spec} />);
      
      // BoxPlot renders an SVG with a rect (the box)
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      const rect = container.querySelector("rect");
      expect(rect).toBeInTheDocument();
    });

    it("renders DotPlot when spec.type is 'dot_plot'", () => {
      const spec: VisualSpec = {
        type: "dot_plot",
        data: { data: [1, 2, 2, 3] },
      };
      const { container } = render(<ProblemVisualizer spec={spec} />);
      
      // DotPlot renders circles for each data point
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      const circles = container.querySelectorAll("circle");
      expect(circles.length).toBe(4);
    });

    it("returns null when spec is undefined or null", () => {
      // Test undefined
      const { container: container1 } = render(
        <ProblemVisualizer spec={undefined as unknown as VisualSpec} />
      );
      expect(container1.firstChild).toBeNull();

      // Test null
      const { container: container2 } = render(
        <ProblemVisualizer spec={null as unknown as VisualSpec} />
      );
      expect(container2.firstChild).toBeNull();
    });

    it("shows fallback message for unimplemented visualizer types", () => {
      const spec: VisualSpec = {
        type: "histogram" as VisualSpec["type"],
        data: {},
      };
      render(<ProblemVisualizer spec={spec} />);
      
      expect(screen.getByText(/Visualizer not implemented for histogram/)).toBeInTheDocument();
    });
  });

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

    it("includes accessibility attributes", () => {
      render(<DotPlot data={[1, 2, 3]} />);
      const svg = screen.getByRole("img");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-labelledby");

      // Check for title content via the aria-labelledby connection or direct title text
      // Since title element text isn't directly "visible" text in all queries, we might find it by text if we query carefully,
      // but easier to check if the title element exists and has content.
      const titleId = svg.getAttribute("aria-labelledby");
      // eslint-disable-next-line testing-library/no-node-access
      const title = document.getElementById(titleId!);
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent("Dot plot showing 3 data points ranging from 1 to 3");
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

    it("includes accessibility attributes with formatted numbers", () => {
      render(
        <BoxPlot min={0} q1={25.123} median={50.567} q3={75} max={100} />
      );
      const svg = screen.getByRole("img");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("aria-labelledby");

      const titleId = svg.getAttribute("aria-labelledby");
      // eslint-disable-next-line testing-library/no-node-access
      const title = document.getElementById(titleId!);
      expect(title).toBeInTheDocument();
      // "Box plot showing distribution with minimum 0.00, first quartile 25.12, median 50.57, third quartile 75.00, and maximum 100.00."
      expect(title).toHaveTextContent(/Box plot showing distribution with minimum 0.00, first quartile 25.12, median 50.57, third quartile 75.00, and maximum 100.00/);
    });
  });
});
