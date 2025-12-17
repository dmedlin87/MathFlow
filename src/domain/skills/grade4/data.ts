import type { Skill, Generator, MathProblemItem } from "../../types";
import { engine } from "../../generator/engine";
import { randomInt, createProblemMeta } from "../../math-utils";

// --- 6. Data Representation: Line Plots (4.MD.B.4) ---

export const SKILL_LINE_PLOTS: Skill = {
  id: "meas_data_line_plots",
  name: "Interpret Line Plots",
  gradeBand: "3-5",
  prereqs: ["frac_add_like_01"], // Often involves adding fractions
  misconceptions: ["count_vs_value"],
  templates: ["T_LINE_PLOT"],
  description:
    "Make a line plot to display a data set of measurements in fractions of a unit (1/2, 1/4, 1/8). Solve problems involving addition and subtraction of fractions by using information presented in line plots.",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const LinePlotGenerator: Generator = {
  templateId: "T_LINE_PLOT",
  skillId: SKILL_LINE_PLOTS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Generates a list of data points (e.g. lengths of insects in inches)
    // Fractions: 1/2, 1/4, 3/4, maybe 1/8s for harder difficulty.
    // We will provide the list textually as a "Line Plot Data" block.

    // const den = 4; // Use 4ths for simplicity
    const values = ["1/4", "1/2", "3/4", "1"]; // 1/2 is 2/4, 1 is 4/4
    // Generate random counts for each value
    const counts = [
      randomInt(1, 4, rng),
      randomInt(2, 5, rng),
      randomInt(1, 4, rng),
      randomInt(0, 3, rng),
    ];

    // Create a flat list for the problem stem
    const dataList: string[] = [];
    counts.forEach((count, i) => {
      for (let k = 0; k < count; k++) dataList.push(values[i]);
    });
    // Shuffle roughly? No need for exact line plot visual, just data.
    // "Here is the data from a line plot:"

    // Question types:
    // 1. "How many items are length X?" (Reading)
    // 2. "What is the total length of all items of size X?" (Mult/Add)
    // 3. "Difference between longest and shortest?" (Range)

    const qType = randomInt(1, 3, rng);

    if (qType === 1) {
      // Reading count
      const targetIdx = randomInt(0, 3, rng);
      const targetVal = values[targetIdx];
      const ans = counts[targetIdx];

      return {
        meta: createProblemMeta(SKILL_LINE_PLOTS.id, difficulty),
        problem_content: {
          stem: `A science class measured the length of several leaves. Data (inches):
**${dataList.join(", ")}**

How many leaves were **${targetVal}** inch long?`,
          format: "text",
          variables: { targetVal },
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "integer",
        },
        solution_logic: {
          final_answer_canonical: String(ans),
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Count the number of times ${targetVal} appears in the list.`,
              math: `Count = ${ans}`,
              answer: String(ans),
            },
          ],
        },
        misconceptions: [],
      };
    } else if (qType === 2) {
      // Total length of specific size
      // "What is the total length of all the leaves that are 1/2 inch long?"
      const targetIdx = 1; // 1/2 is index 1
      const targetVal = values[targetIdx]; // "1/2"
      const count = counts[targetIdx];
      // 1/2 * count = count/2
      // Simplify if possible.
      // const totalNum = count;
      // const totalDen = 2;
      // We'll ask for mixed number or improper fraction? Let's just ask for improper for simplicity or decimal?
      // "Enter as a fraction"
      // actually 1/2 * count. If count is even, integer.
      const isInt = count % 2 === 0;
      const ans = isInt ? String(count / 2) : `${count}/2`;

      return {
        meta: createProblemMeta(SKILL_LINE_PLOTS.id, difficulty),
        problem_content: {
          stem: `Data (inches): **${dataList.join(", ")}**

What is the **total length** of all the leaves that are exactly **${targetVal}** inch long?
(Add them all together)`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction", // accepts integer too usually
        },
        solution_logic: {
          final_answer_canonical: ans,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `There are ${count} leaves of size ${targetVal}. Multiply or add them.`,
              math: `${count} \\times \\frac{1}{2} = \\frac{${count}}{2}`,
              answer: ans,
            },
          ],
        },
        misconceptions: [],
      };
    } else {
      // Range (Longest - Shortest)
      // Assuming we have at least one of each extreme or check actual list
      // Find actual min/max in generated list
      let minVal = 10;
      let maxVal = 0;
      const valMap: Record<string, number> = {
        "1/4": 0.25,
        "1/2": 0.5,
        "3/4": 0.75,
        "1": 1.0,
      };

      dataList.forEach((v) => {
        const num = valMap[v];
        if (num < minVal) minVal = num;
        if (num > maxVal) maxVal = num;
      });

      const diff = maxVal - minVal;
      // Convert back to fraction string (0.25, 0.5, 0.75)
      let ansStr = String(diff);
      if (diff === 0.75) ansStr = "3/4";
      if (diff === 0.5) ansStr = "1/2"; // or 2/4
      if (diff === 0.25) ansStr = "1/4";
      if (diff === 0) ansStr = "0";

      return {
        meta: createProblemMeta(SKILL_LINE_PLOTS.id, difficulty),
        problem_content: {
          stem: `Data (inches): **${dataList.join(", ")}**

What is the difference between the **longest** and **shortest** leaf?`,
          format: "text",
        },
        answer_spec: {
          answer_mode: "final_only",
          input_type: "fraction",
        },
        solution_logic: {
          final_answer_canonical: ansStr,
          final_answer_type: "numeric",
          steps: [
            {
              step_index: 1,
              explanation: `Find max and min values in the list and subtract.`,
              math: `${maxVal} - ${minVal} = ${diff}`,
              answer: ansStr,
            },
          ],
        },
        misconceptions: [],
      };
    }
  },
};

engine.register(LinePlotGenerator);

// --- 10. Data Graphs (Freq Tables, Bar Graphs) (4.DS.A) ---

export const SKILL_DATA_GRAPHS: Skill = {
  id: "meas_data_graphs",
  name: "Interpret Frequency Tables and Bar Graphs",
  gradeBand: "3-5",
  prereqs: ["nbt_add_sub_multi"],
  misconceptions: ["read_wrong_bar", "miscount_freq"],
  templates: ["T_DATA_GRAPH"],
  description:
    "Analyze data found in frequency tables or bar graphs. Solve problems comparing categories.",
  bktParams: { learningRate: 0.15, slip: 0.1, guess: 0.1 },
};

export const DataGraphGenerator: Generator = {
  templateId: "T_DATA_GRAPH",
  skillId: SKILL_DATA_GRAPHS.id,
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Mode: Frequency Table vs Bar Graph
    const mode = (rng ?? Math.random)() > 0.5 ? "FREQ_TABLE" : "BAR_GRAPH";

    const categories = ["Red", "Blue", "Green", "Yellow"];
    // Or maybe "Books", "Pencils", "Erasers"

    // Generate data
    const data = categories.map((c) => ({
      name: c,
      val: randomInt(2, 15, rng),
    }));

    // Shuffle categories for variety? Optional.

    // Select questions:
    // 1. Value of X?
    // 2. Most/Least popular?
    // 3. How many more X than Y?
    // 4. Total?

    const qType = randomInt(1, 3, rng); // 1=Value, 2=Compare, 3=Total

    let stem = "";
    let ans = "";
    let logic = "";

    // Build display string
    let display = "";
    if (mode === "FREQ_TABLE") {
      display = "Color   | Count\n";
      display += "--------|------\n";
      data.forEach((d) => {
        display += `${d.name.padEnd(8)}| ${d.val}\n`;
      });
    } else {
      // ASCII Bar Graph
      // Color | #### (4)
      display = "Color   | Graph\n";
      display += "--------|------\n";
      data.forEach((d) => {
        const bar = "#".repeat(d.val);
        display += `${d.name.padEnd(8)}| ${bar} (${d.val})\n`;
      });
    }

    const chartType = mode === "FREQ_TABLE" ? "Frequency Table" : "Bar Graph";

    if (qType === 1) {
      const target = data[randomInt(0, data.length - 1, rng)];
      stem = `Look at the ${chartType} below:\n\n${display}\nHow many items are **${target.name}**?`;
      ans = String(target.val);
      logic = `Find the row for ${target.name} and read the count: ${target.val}.`;
    } else if (qType === 2) {
      // Compare: How many more X than Y?
      const idx1 = randomInt(0, data.length - 1, rng);
      let idx2 = randomInt(0, data.length - 1, rng);
      while (idx1 === idx2) idx2 = randomInt(0, data.length - 1, rng);
      const d1 = data[idx1];
      const d2 = data[idx2];

      const more = d1.val > d2.val ? d1 : d2;
      const less = d1.val > d2.val ? d2 : d1;
      const diff = more.val - less.val;

      stem = `Look at the ${chartType}:\n\n${display}\nHow many **more** ${more.name} items are there than ${less.name} items?`;
      ans = String(diff);
      logic = `${more.name} has ${more.val}. ${less.name} has ${less.val}. Difference: ${more.val} - ${less.val} = ${diff}.`;
    } else {
      // Total
      const total = data.reduce((sum, d) => sum + d.val, 0);
      stem = `Look at the ${chartType}:\n\n${display}\nWhat is the **total** number of items?`;
      ans = String(total);
      logic = `Add up all the counts: ${data
        .map((d) => d.val)
        .join(" + ")} = ${total}.`;
    }

    if (!ans || ans === "NaN") {
      console.error("DataGraphGenerator Error: Resulting ans is invalid", {
        ans,
        qType,
        data,
      });
      // Fallback or throw
      throw new Error(`DataGraphGenerator produced invalid answer: ${ans}`);
    }

    return {
      meta: createProblemMeta(SKILL_DATA_GRAPHS.id, difficulty),
      problem_content: {
        stem,
        format: "text", // Preformatted ASCII
        variables: { mode, qType },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: ans,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: logic,
            math: `Answer: ${ans}`,
            answer: ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(DataGraphGenerator);
