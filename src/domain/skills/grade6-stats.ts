import type { Skill, Generator, MathProblemItem } from "../types";
import { engine } from "../generator/engine";

// Helper to get random integer between min and max (inclusive)
const randomInt = (min: number, max: number, rng: () => number = Math.random) =>
  Math.floor(rng() * (max - min + 1)) + min;

// Mock provenance helper
const createMockProvenance = (
  skillId: string,
  diff: number
): MathProblemItem["meta"] => ({
  id: `it_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  version: 1,
  skill_id: skillId,
  difficulty: Math.ceil(diff * 5) || 1,
  created_at: new Date().toISOString(),
  verified_at: new Date().toISOString(),
  status: "VERIFIED",
  provenance: {
    generator_model: "v0-rule-based-engine",
    critic_model: "v0-simulation",
    judge_model: "v0-simulation",
    verifier: { type: "numeric", passed: true },
    attempt: 1,
  },
  verification_report: {
    rubric_scores: {
      solvability: 1,
      ambiguity: 0,
      procedural_correctness: 1,
      pedagogical_alignment: 1,
    },
    underspecified: false,
    issues: [],
  },
});

// Helper for robust rounding

// ----------------------------------------------------------------------
// 1. Mean (6.SP.B.5.c)
// ----------------------------------------------------------------------

export const SKILL_6_SP_MEAN: Skill = {
  id: "6.sp.mean",
  name: "Calculate Mean",
  gradeBand: "6-8",
  prereqs: ["5.nbt.div_whole"],
  misconceptions: ["median_confusion"],
  templates: ["T_MEAN"],
  description: "Calculate the mean of a data set",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const MeanGenerator: Generator = {
  skillId: SKILL_6_SP_MEAN.id,
  templateId: "T_MEAN",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const count = randomInt(4, 6, rng);
    // Generate numbers such that sum is divisible by count for clean mean usually
    const targetMean = randomInt(5, 20, rng);
    const sum = targetMean * count;

    // Distribute sum
    const nums: number[] = [];
    let currentSum = 0;
    for (let i = 0; i < count - 1; i++) {
      const n = randomInt(
        1,
        Math.min(sum - currentSum - (count - i - 1), targetMean * 2),
        rng
      );
      nums.push(n);
      currentSum += n;
    }
    nums.push(sum - currentSum);

    // Shuffle
    nums.sort(() => (rng ?? Math.random)() - 0.5);

    const dataSet = nums.join(", ");

    return {
      meta: createMockProvenance(SKILL_6_SP_MEAN.id, difficulty),
      problem_content: {
        stem: `Find the mean (average) of the following data set:

$${dataSet}$`,
        format: "text",
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
      },
      solution_logic: {
        final_answer_canonical: String(targetMean),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Add all the numbers and divide by the count (${count}).`,
            math: `\\frac{${sum}}{${count}} = ${targetMean}`,
            answer: String(targetMean),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(MeanGenerator);

// ----------------------------------------------------------------------
// 2. Median, Mode, Range (6.SP.B.5.c)
// ----------------------------------------------------------------------

export const SKILL_6_SP_MEDIAN_MODE_RANGE: Skill = {
  id: "6.sp.median_mode_range",
  name: "Median, Mode, and Range",
  gradeBand: "6-8",
  prereqs: ["6.sp.mean"],
  misconceptions: ["mean_median_confusion"],
  templates: ["T_MEDIAN_MODE_RANGE"],
  description: "Calculate median, mode, and range of a data set",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const MedianModeRangeGenerator: Generator = {
  skillId: SKILL_6_SP_MEDIAN_MODE_RANGE.id,
  templateId: "T_MEDIAN_MODE_RANGE",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Type: 0: Median, 1: Mode, 2: Range
    const type = randomInt(0, 2, rng);
    const count = randomInt(5, 9, rng);
    const nums: number[] = [];
    for (let i = 0; i < count; i++) nums.push(randomInt(1, 10, rng));

    const sorted = [...nums].sort((a, b) => a - b);
    const dataSet = nums.join(", ");

    let stem = "";
    let ans = 0;
    let exp = "";

    if (type === 0) {
      // Median
      const mid = Math.floor(count / 2);
      if (count % 2 === 1) {
        ans = sorted[mid];
        exp = `Order the numbers: ${sorted.join(
          ", "
        )}. The middle number is ${ans}.`;
      } else {
        ans = (sorted[mid - 1] + sorted[mid]) / 2;
        exp = `Order the numbers: ${sorted.join(
          ", "
        )}. The median is average of ${sorted[mid - 1]} and ${sorted[mid]}.`;
      }
      stem = `Find the median of: $${dataSet}$`;
    } else if (type === 1) {
      // Mode
      // Ensure a mode exists by injecting duplicates
      const dup = nums[0];
      nums.push(dup); // make sure at least one dup
      // recalculate sorted/dataset
      const finalNums = nums.sort(() => (rng ?? Math.random)() - 0.5);
      // const finalDataSet = finalNums.join(", ");

      // count freqs
      const counts: Record<number, number> = {};
      let maxFreq = 0;
      const modes: number[] = [];
      for (const n of finalNums) {
        counts[n] = (counts[n] || 0) + 1;
        if (counts[n] > maxFreq) maxFreq = counts[n];
      }
      for (const n in counts) {
        if (counts[n] === maxFreq) modes.push(Number(n));
      }

      // Force single mode:
      const targetMode = randomInt(1, 9, rng);
      const other = randomInt(1, 9, rng);
      const list = [
        targetMode,
        targetMode,
        targetMode,
        other,
        other + 1,
        other + 2,
      ]; // Mode is targetMode (3 vs 1 each)
      const mixed = list.sort(() => (rng ?? Math.random)() - 0.5).join(", ");
      stem = `Find the mode of: $${mixed}$`;
      ans = targetMode;
      exp = `${targetMode} appears most often (3 times).`;
    } else {
      // Range
      stem = `Find the range of: $${dataSet}$`;
      ans = sorted[sorted.length - 1] - sorted[0];
      exp = `Subtract the lowest value from the highest: ${
        sorted[sorted.length - 1]
      } - ${sorted[0]} = ${ans}.`;
    }

    return {
      meta: createMockProvenance(SKILL_6_SP_MEDIAN_MODE_RANGE.id, difficulty),
      problem_content: { stem, format: "latex" },
      answer_spec: { answer_mode: "final_only", input_type: "decimal" }, // Median can be .5
      solution_logic: {
        final_answer_canonical: String(ans),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: exp,
            math: String(ans),
            answer: String(ans),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(MedianModeRangeGenerator);

// ----------------------------------------------------------------------
// 3. IQR & Box Plots (6.SP.B.5.c, 6.SP.B.4)
// ----------------------------------------------------------------------

export const SKILL_6_SP_IQR: Skill = {
  id: "6.sp.iqr",
  name: "Interquartile Range (IQR)",
  gradeBand: "6-8",
  prereqs: ["6.sp.median_mode_range"],
  misconceptions: ["range_confusion"],
  templates: ["T_IQR"],
  description: "Calculate Interquartile Range",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const IqrGenerator: Generator = {
  skillId: SKILL_6_SP_IQR.id,
  templateId: "T_IQR",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Create a dataset with easy quartiles (e.g. 8 numbers, split 4 and 4, then split 2 and 2) or 7, 11 etc.
    // 7 numbers: med is 4th. Lower half is 3 (med is 2nd). Upper half is 3 (med is 2nd).
    // 1, 2, 3, [4], 5, 6, 7
    // Q1 = 2, Q3 = 6.

    const nums = [];
    const len = 7;
    for (let i = 0; i < len; i++) nums.push(randomInt(1, 20, rng));
    nums.sort((a, b) => a - b);

    const q1 = nums[1]; // 2nd item of sorted 7 items is median of lower 3.
    const q3 = nums[5]; // 6th item
    const iqr = q3 - q1;

    const mixed = [...nums].sort(() => (rng ?? Math.random)() - 0.5).join(", ");

    return {
      meta: createMockProvenance(SKILL_6_SP_IQR.id, difficulty),
      problem_content: {
        stem: `Find the Interquartile Range (IQR) of the data set: $${mixed}$`,
        format: "latex",
      },
      answer_spec: { answer_mode: "final_only", input_type: "integer" },
      solution_logic: {
        final_answer_canonical: String(iqr),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Order the data: ${nums.join(", ")}.`,
            math: "",
            answer: "",
          },
          {
            step_index: 2,
            explanation: `Find median (${nums[3]}). Lower half: ${nums.slice(
              0,
              3
            )}. Q1 = ${q1}. Upper half: ${nums.slice(4)}. Q3 = ${q3}.`,
            math: `Q_3 - Q_1 = ${iqr}`,
            answer: String(iqr),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(IqrGenerator);

export const SKILL_6_SP_BOX_PLOTS: Skill = {
  id: "6.sp.box_plots",
  name: "Box Plots",
  gradeBand: "6-8",
  prereqs: ["6.sp.iqr"],
  misconceptions: ["read_error"],
  templates: ["T_BOX_PLOTS"],
  description: "Interpret box plots",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const BoxPlotGenerator: Generator = {
  skillId: SKILL_6_SP_BOX_PLOTS.id,
  templateId: "T_BOX_PLOTS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    const min = randomInt(0, 10, rng);
    const q1 = min + randomInt(2, 5, rng);
    const med = q1 + randomInt(2, 5, rng);
    const q3 = med + randomInt(2, 5, rng);
    const max = q3 + randomInt(2, 5, rng);

    const type = (rng ?? Math.random)() < 0.5 ? "range" : "iqr";

    // Replaced Text Description with Visual Spec
    const stem =
      type === "range"
        ? "Use the box plot below to find the **range** of the data."
        : "Use the box plot below to find the **interquartile range (IQR)** of the data.";

    const ans = type === "range" ? max - min : q3 - q1;

    return {
      meta: createMockProvenance(SKILL_6_SP_BOX_PLOTS.id, difficulty),
      problem_content: {
        stem,
        format: "text",
        visual_spec: {
          type: "box_plot",
          data: { min, q1, median: med, q3, max },
        },
      },
      answer_spec: { answer_mode: "final_only", input_type: "integer" },
      solution_logic: {
        final_answer_canonical: String(ans),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation:
              type === "range"
                ? `Range = Max - Min = ${max} - ${min}`
                : `IQR = Q3 - Q1 = ${q3} - ${q1}`,
            math: `${ans}`,
            answer: String(ans),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(BoxPlotGenerator);

export const SKILL_6_SP_DOT_PLOTS: Skill = {
  id: "6.sp.dot_plots",
  name: "Dot Plots",
  gradeBand: "6-8",
  prereqs: ["6.sp.median_mode_range"],
  misconceptions: ["counting_error"],
  templates: ["T_DOT_PLOTS"],
  description: "Interpret dot plots",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const DotPlotGenerator: Generator = {
  skillId: SKILL_6_SP_DOT_PLOTS.id,
  templateId: "T_DOT_PLOTS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // 3 to 5 categories
    const base = randomInt(1, 5, rng);
    const counts = [
      randomInt(1, 5, rng),
      randomInt(1, 5, rng),
      randomInt(1, 5, rng),
    ];

    let total = 0;
    let maxCount = 0;
    const modeVals: number[] = [];
    const rawData: number[] = [];

    counts.forEach((c, i) => {
      const val = base + i;
      for (let k = 0; k < c; k++) rawData.push(val);
      total += c;
      if (c > maxCount) {
        maxCount = c;
        modeVals.length = 0; // Reset modes
        modeVals.push(val);
      } else if (c === maxCount) {
        modeVals.push(val);
      }
    });

    const type = (rng ?? Math.random)() < 0.5 ? "count" : "mode"; // count total, or find mode

    const ans = type === "count" ? String(total) : String(modeVals[0]);
    const accepted_forms =
      type === "mode" && modeVals.length > 1 ? modeVals.map(String) : undefined;

    return {
      meta: createMockProvenance(SKILL_6_SP_DOT_PLOTS.id, difficulty),
      problem_content: {
        stem: `Consider the following dot plot:\n\n${
          type === "count"
            ? "How many total data points are there?"
            : "What is the mode of the data?"
        }`,
        format: "text",
        visual_spec: {
          type: "dot_plot",
          data: { data: rawData },
        },
      },
      answer_spec: {
        answer_mode: "final_only",
        input_type: "integer",
        accepted_forms,
      },
      solution_logic: {
        final_answer_canonical: ans,
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation:
              type === "count"
                ? "Count all the dots."
                : "Find the value with the most dots.",
            math: "",
            answer: ans,
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(DotPlotGenerator);

export const SKILL_6_SP_HISTOGRAMS: Skill = {
  id: "6.sp.histograms",
  name: "Histograms",
  gradeBand: "6-8",
  prereqs: ["6.sp.median_mode_range"],
  misconceptions: ["bin_reading"],
  templates: ["T_HISTOGRAMS"],
  description: "Interpret histograms",
  bktParams: { learningRate: 0.1, slip: 0.1, guess: 0.1 },
};

export const HistogramGenerator: Generator = {
  skillId: SKILL_6_SP_HISTOGRAMS.id,
  templateId: "T_HISTOGRAMS",
  generate: (difficulty: number, rng?: () => number): MathProblemItem => {
    // Bins: 0-9, 10-19, 20-29
    const bins = ["0-9", "10-19", "20-29", "30-39"];
    const counts = [
      randomInt(2, 8, rng),
      randomInt(2, 10, rng),
      randomInt(1, 6, rng),
      randomInt(0, 4, rng),
    ];

    const targetBinIdx = randomInt(0, 3, rng);
    const targetBin = bins[targetBinIdx];
    const ans = counts[targetBinIdx];

    let table = "| Interval | Frequency |\n|---|---|\n";
    bins.forEach((b, i) => {
      table += `| ${b} | ${counts[i]} |\n`;
    });

    return {
      meta: createMockProvenance(SKILL_6_SP_HISTOGRAMS.id, difficulty),
      problem_content: {
        stem: `Here is a frequency table for a histogram:\n\n${table}\n\nHow many values are in the interval **${targetBin}**?`,
        format: "text",
      },
      answer_spec: { answer_mode: "final_only", input_type: "integer" },
      solution_logic: {
        final_answer_canonical: String(ans),
        final_answer_type: "numeric",
        steps: [
          {
            step_index: 1,
            explanation: `Look at the table row for ${targetBin}.`,
            math: "",
            answer: String(ans),
          },
        ],
      },
      misconceptions: [],
    };
  },
};

engine.register(HistogramGenerator);
