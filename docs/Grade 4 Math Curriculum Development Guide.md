# **Comprehensive Curriculum Architecture and Application Design for Grade 4 Mathematics**

## **Executive Summary: The Pedagogical Pivot of Fourth Grade**

The development of a mathematics application for a fourth-grade student represents a significant architectural challenge because Grade 4 acts as the "pedagogical pivot" of elementary mathematics. Educational research consistently identifies this grade level as the transition point where students move from additive reasoning (counting and accumulation) to multiplicative reasoning (scaling, grouping, and proportional thinking).1 Furthermore, the curriculum shifts from "learning to read" mathematical symbols to "reading to learn" complex mathematical relationships, requiring students to generalize their understanding of place value up to 1,000,000 and encounter abstract concepts like fraction equivalence and angle measurement for the first time.3

To construct an "authentic" curriculum—one that mirrors high-quality classroom instruction while leveraging digital affordances—the application must not simply present randomized problems. It must embody a rigorous Scope and Sequence derived from evidence-based frameworks such as the Common Core State Standards (CCSS), the Missouri Learning Standards (MLS), and the Texas Essential Knowledge and Skills (TEKS).5 This report provides a blueprint for such an application, detailing the instructional hierarchy, algorithmic logic for homework generation, and the visual models necessary to build conceptual depth.

The following comprehensive analysis dissects the Grade 4 curriculum into actionable engineering and content specifications, organized by mathematical domain. It integrates the rigorous progression of *Eureka Math* (EngageNY), the conceptual clarity of *Singapore Math*, and the problem-based inquiry of *Illustrative Mathematics* to create a hybrid, best-in-class learning pathway.8

## ---

**Domain I: Number and Operations in Base Ten (NBT)**

The "Number and Operations in Base Ten" domain is the spine of the fourth-grade curriculum. Unlike Grade 3, where the focus was on numbers within 1,000, Grade 4 demands fluency with numbers up to 1,000,000. The application must treat this not merely as "bigger numbers" but as a new conceptual system where the structure of base-ten is generalized.

### **Module 1: Generalizing Place Value**

#### **Conceptual Framework**

The curriculum begins by establishing that in a multi-digit whole number, a digit in one place represents ten times what it represents in the place to its right.1 This "x10" relationship is the foundational logic for all subsequent arithmetic.

Instructional Strategy: The Place Value Chart  
The application must utilize an interactive Place Value Chart that extends to the millions. Unlike static worksheets, the digital interface should allow for "Exploding Dots" or dynamic regrouping. When a user drags ten "1,000" disks into the "10,000" column, they should merge (animate) into a single "10,000" disk. This visualizes the standard 4.NBT.A.1 intimately.5

#### **Scope and Sequence Details**

| Topic Focus | Learning Objective | Generator Constraints | Visual Model |
| :---- | :---- | :---- | :---- |
| **Place Value Relationships** | Recognize that $700 \\div 70 \= 10$. | Integers $A, B$ where $A \= B \\times 10$ or $A \= B \\div 10$. | Interactive Place Value Disks. |
| **Reading & Writing Numbers** | Read/write numbers to 1,000,000 in standard, word, and expanded forms. | Generate integers $$. Avoid zeroes initially, then introduce as trap. | Text-to-Speech & Drag-and-Drop Labels. |
| **Comparing Numbers** | Compare two multi-digit numbers using $\>, \=, \<$. | Generate numbers with identical digits in different positions (e.g., 54,302 vs 54,203) to force place value analysis. | Vertical Number Line. |
| **Rounding** | Round multi-digit numbers to any place. | Target number $N$. Rounding pivot $P$ (tens, hundreds, etc.). | Vertical Number Line (Hill Model). |

#### **Tutorial Scripting and Misconception Management**

* **Misconception**: Students often think a number is larger simply because it has a larger leading digit, ignoring the number of digits (e.g., thinking 9,876 \> 12,000).  
* **Tutorial Logic**: The app must detect this specific error pattern. If a student selects 9,876 \> 12,000, the feedback loop should not just say "Wrong." It should trigger a "Digit Count" animation, highlighting that 12,000 has 5 digits while 9,876 has only 4, visually demonstrating magnitude.  
* **Comma Placement**: A specific mini-game should focus on comma placement. The Missouri Learning Standards emphasize reading numbers specifically; the app should strip commas from a number like "123456" and ask the user to place them to create "123,456," reinforcing the "thousands period" concept.12

#### **Homework Generator Specifications: Rounding**

To generate authentic rounding problems that mimic high-stakes testing (like MAP or STAAR), the algorithm must produce three distinct types of questions:

1. **Direct Rounding**: "Round 34,567 to the nearest thousand."  
2. **Reverse Rounding**: "Which number, when rounded to the nearest hundred, becomes 4,500?" (Options: 4,449; 4,501; 4,590; 4,499).  
3. **Range Determination**: "Select all numbers that round to 60,000 when rounded to the nearest ten thousand."

### **Module 2: Addition and Subtraction Algorithms**

#### **Fluency Requirements**

Standard 4.NBT.B.4 requires fluency with the standard algorithm for addition and subtraction.14 However, "fluency" implies accuracy and flexibility, not just speed.

Algorithmic Logic for Problem Generation  
The generator should categorize addition/subtraction problems by "Regrouping Complexity":

* **Level 1**: No regrouping ($12,345 \+ 54,321$).  
* **Level 2**: Single regrouping (carrying over once).  
* **Level 3**: Multi-regrouping across non-zero digits.  
* **Level 4 (Boss Level)**: Subtracting across zeros ($40,005 \- 12,348$). This is the most common failure point for 4th graders.16

#### **Interactive Mechanics**

The tutorial component must support the "Compensation Strategy" as an alternative to borrowing.

* *Scenario*: $1,000 \- 456$.  
* *Standard Way*: Cross out 1, make it 0, make 10, cross out, make 9... (High cognitive load/error prone).  
* *Compensation Way*: Subtract 1 from both numbers \-\> $999 \- 455$.  
* *App Feature*: A "Magic Wand" tool that allows the student to subtract 1 from both operands, transforming the visual problem into a no-regrouping scenario. This builds deep number sense (4.NBT.B.4).4

## ---

**Domain II: Operations and Algebraic Thinking (OA)**

This domain encompasses the transition from arithmetic to algebra. The key conceptual shift is understanding multiplication not just as "groups of" (Grade 3\) but as "comparison" (Grade 4).

### **Module 3: Multiplicative Comparison**

#### **The Narrative Arc**

Grade 4 introduces the language of "times as many." A student must translate "Sarah has 5 times as many apples as John" into the algebraic equation $S \= 5 \\times J$. This is a prerequisite for ratios in Grade 6\.1

#### **Visual Model: Tape Diagrams**

The application must heavily utilize **Tape Diagrams** (Bar Models).

* *Structure*: A short bar representing the base quantity (John's apples) and a long bar composed of 5 identical segments representing the compared quantity (Sarah's apples).  
* *Problem Type*:  
  * **Unknown Product**: "A hat costs $5. A coat costs 6 times as much. How much is the coat?"  
  * **Unknown Factor**: "A coat costs $30. That is 6 times as much as a hat. How much is the hat?"  
  * **Total Unknown**: "A hat costs $5. A coat is 6 times as much. How much do they cost *together*?" (Two-step: $5 \\times 6 \= 30$; $30 \+ 5 \= 35$).19

#### **Homework Generator Logic: Word Problems**

Generating coherent word problems is difficult. The app should use a "Template-Slot" system.

* *Template*: "{Entity\_A} has {Quantity\_1} {Object}. {Entity\_B} has {Multiplier} times as many {Object} as {Entity\_A}. How many {Object} does {Entity\_B} have?"  
* *Variables*:  
  * Entity\_A:  
  * Object: \[marbles, dollars, meters of rope\]  
  * Multiplier: Integer \[2-9\]  
  * Quantity\_1: Integer \[2-12\] for mental math, \[13-99\] for algorithmic work.

### **Module 4: Multi-Digit Multiplication**

This is the most complex computational skill in Grade 4\. The curriculum must progress strictly from **Area Models** to **Partial Products** to the **Standard Algorithm**. Jumping straight to the algorithm is pedagogically malpractice for this age group.21

#### **The Area Model (Box Method)**

The app must feature a dynamic grid interface.

* **Problem**: $34 \\times 12$.  
* **Step 1 (Decomposition)**: User must split numbers into $(30 \+ 4)$ and $(10 \+ 2)$.  
* **Step 2 (Visual Setup)**: A $2 \\times 2$ grid appears.  
  * Top Left Box: $30 \\times 10 \= 300$  
  * Top Right Box: $4 \\times 10 \= 40$  
  * Bottom Left Box: $30 \\times 2 \= 60$  
  * Bottom Right Box: $4 \\times 2 \= 8$  
* **Step 3 (Summation)**: $300 \+ 40 \+ 60 \+ 8 \= 408$.

**Gamification Element**: "The Construction Zone." The student acts as a builder calculating the square footage of rooms. The visual reinforcement of the "size" of 300 vs 8 is crucial for number sense.23

#### **Generator Specifications: Multiplication**

* **Category A**: 2-digit by 1-digit ($45 \\times 6$).  
* **Category B**: 3-digit by 1-digit ($345 \\times 6$).  
* **Category C**: 4-digit by 1-digit ($1,234 \\times 5$).  
* **Category D**: 2-digit by 2-digit ($34 \\times 56$).  
* **Constraint**: For Category D, avoid numbers where the product exceeds 10,000 initially to keep summation manageable.

### **Module 5: Division with Remainders**

#### **Conceptual Approach**

Division in Grade 4 focuses on finding whole number quotients and remainders with up to four-digit dividends and one-digit divisors (4.NBT.B.6).

* **Visual Model**: The app should use "Place Value Disks" for division. To divide $52 \\div 4$, the student sees 5 "tens" and 2 "ones." They must distribute the tens into 4 groups. One ten remains. They must physically "unbundle" that ten into 10 ones, resulting in 12 ones. These are then distributed.  
* **Interpreting Remainders**: This is a critical critical-thinking skill. The app must generate word problems where the remainder forces different actions:  
  * *Round Up*: "25 students are going on a trip. Each car holds 4\. How many cars are needed?" ($25 \\div 4 \= 6 R1$. Answer: 7 cars).  
  * *Drop It*: "You have $25. Each book costs $4. How many books can you buy?" (Answer: 6 books).  
  * *Share It*: "Share 25 cookies among 4 friends." (Answer: $6 \\frac{1}{4}$).

## ---

**Domain III: Number and Operations—Fractions (NF)**

Research indicates that fractions are the primary stumbling block for students entering middle school. The Grade 4 curriculum must focus on "Fractions as Numbers" rather than just "Fractions as Pizza Slices.".1

### **Module 6: Fraction Equivalence and Ordering**

#### **Visual Model: The Number Line**

The app must prioritize the **Number Line** over circle models. Circles can be misleading (a large slice of a small pizza vs. a small slice of a large pizza). Number lines standardize the unit.3

* **Interactive Tool**: "The Fraction Zoom." A user sees a number line from 0 to 1\. They can "zoom in" to see halves, fourths, eighths. They can stack number lines to see that $\\frac{2}{4}$ aligns perfectly with $\\frac{1}{2}$.  
* **Standard 4.NF.A.1**: Explain why a fraction $\\frac{a}{b}$ is equivalent to $\\frac{n \\times a}{n \\times b}$. The app should use "multiplication by 1" visuals (e.g., overlaying a grid to cut the parts into smaller pieces without changing the shaded amount).5

#### **Homework Generator Logic: Comparisons**

To test Standard 4.NF.A.2 (Comparing Fractions), the generator should produce three specific problem subtypes:

1. **Common Denominator**: $\\frac{3}{8}$ vs $\\frac{5}{8}$ (Compare numerators).  
2. **Common Numerator**: $\\frac{3}{5}$ vs $\\frac{3}{8}$ (Conceptual: reasoning that fifths are larger chunks than eighths).  
3. **Benchmark Comparison**: $\\frac{4}{9}$ vs $\\frac{6}{10}$ (Reasoning: $\\frac{4}{9}$ is less than half; $\\frac{6}{10}$ is more than half).

### **Module 7: Operations with Fractions**

#### **Decomposition and Addition**

Standard 4.NF.B.3.b requires decomposing fractions into sums of unit fractions.25

* *Task*: "Break apart $\\frac{5}{6}$."  
* *Correct Inputs*: $\\frac{1}{6} \+ \\frac{1}{6} \+ \\frac{1}{6} \+ \\frac{1}{6} \+ \\frac{1}{6}$ OR $\\frac{2}{6} \+ \\frac{3}{6}$.  
* *Misconception Alert*: If a student inputs $\\frac{2}{3} \+ \\frac{3}{3}$, the app must flag the denominator change as an error (adding denominators is a common trap).

#### **Multiplication of Fraction by Whole Number**

This is new to Grade 4 (4.NF.B.4). It should be taught as repeated addition.

* *Problem*: $5 \\times \\frac{2}{3}$.  
* *Visual*: A frog hopping 5 times. Each hop is length $\\frac{2}{3}$.  
* *Calculation*: $5 \\times \\frac{2}{3} \= \\frac{10}{3}$.  
* *Conversion*: The app should then prompt the student to convert the improper fraction $\\frac{10}{3}$ to a mixed number ($3 \\frac{1}{3}$) using division.

### **Module 8: Decimal Fractions**

Decimals are introduced as a translation of fractions with denominators of 10 and 100\.

* **Visual**: A $10 \\times 10$ grid.  
  * 1 column shaded \= $\\frac{1}{10} \= 0.1$.  
  * 1 small square shaded \= $\\frac{1}{100} \= 0.01$.  
* **Generator Logic**:  
  * Provide problems adding tenths and hundredths (e.g., $\\frac{3}{10} \+ \\frac{4}{100} \= \\frac{34}{100}$).  
  * *Constraint*: Denominators must be limited to 10 and 100\.14

## ---

**Domain IV: Measurement and Data (MD)**

### **Module 9: Measurement Conversions**

Grade 4 focuses on converting from larger units to smaller units (e.g., meters to centimeters, hours to minutes). This reinforces multiplicative reasoning.3

* **Gamification**: "The Potion Maker."  
  * *Task*: "The recipe needs 2 liters of slime. You only have a measuring cup in milliliters. How many mL do you need?"  
  * *Table Integration*: The app should encourage building a "Two-Column Table" (Input/Output table) for conversions, linking this to algebraic patterns.

### **Module 10: Geometry and Angles**

#### **The Protractor and Angle Additivity**

Geometry in Grade 4 is dynamic. It involves measuring turns (angles).

* **Standard 4.MD.C.6**: Measure angles in whole-number degrees using a protractor.  
* **Digital Implementation**: The app needs a rotatable, semi-transparent protractor tool.  
  * *Challenge*: "Align the vertex." The zero line must align with one ray.  
  * *Assessment Item*: Provide an angle where the ray points to 130° and 50°. The student must choose the correct measure based on whether the angle is acute or obtuse.  
* **Angle Addition**: "The Laser Game."  
  * *Scenario*: A laser reflects off a mirror. Total angle is $180^\\circ$. Incoming angle is $45^\\circ$. What is the remaining angle? ($180 \- 45 \= 135$).

## ---

**Part V: Authentic Assessment & Homework Generation**

To truly prepare a student, the homework generator must mimic the cognitive demand of standardized tests like the Missouri MAP, Texas STAAR, and Smarter Balanced.7

### **5.1 Item Types and Cognitive Complexity (DOK)**

The app should generate problems across three Depth of Knowledge (DOK) levels.

| DOK Level | Description | Item Type Example | Generator Logic |
| :---- | :---- | :---- | :---- |
| **DOK 1** | Recall / Fluency | Multiple Choice: "What is $7 \\times 8$?" | RandInt(0,12) \* RandInt(0,12) |
| **DOK 2** | Concept / Skill | Drag & Drop: "Drag the partial products to the correct part of the area model." | Generate area model grid; randomize partial product positions. |
| **DOK 3** | Strategic Thinking | Multi-Select: "Select ALL rectangles that have a perimeter of 20." | Generate set of rectangles $\\{(1,9), (2,8), (4,6), (5,5)\\}$. Filter for $2(L+W)=20$. |

### **5.2 Authentic Released Item Analysis (Reverse Engineering)**

By analyzing released items from Texas (STAAR) and Missouri (MAP), we can identify specific "trap" structures the app should replicate.7

* **The "Not" Question**: "Which of these shapes does NOT have a line of symmetry?"  
  * *Coding Implication*: The generator must support negative logic queries.  
* **Data Analysis (Texas Specific)**: TEKS requires "Stem and Leaf Plots" and "Dot Plots".7  
  * *Feature*: If the user toggles "Texas Mode," the app must generate Stem and Leaf problems. E.g., "Here is a stem and leaf plot of ages. How many people are older than 25?"  
* **Measurement Contexts**: "A parade started at 11:30 AM and lasted 2 hours 18 minutes. What time did it end?"  
  * *Logic*: This requires base-60 arithmetic. The generator must calculate time deltas, handling the AM/PM crossover correctly.

## ---

**Part VI: Gamification and Engagement Strategy**

For a 9-year-old user, engagement is driven by competence, autonomy, and relatedness (Self-Determination Theory). The app should avoid "chocolate-covered broccoli" (boring math with fake points) and instead use "intrinsic gamification".29

### **6.1 The "Octalysis" Framework Implementation**

1. **Epic Meaning**: The "Campaign" should have a narrative. The student isn't just solving problems; they are "Architecting a City" or "Navigating a Space Station." Each math concept unlocks a new capability (e.g., Learning Area allows them to buy land plots).  
2. **Development & Accomplishment**:  
   * **Badges**: Specific badges for specific skills. "The Zero Hero" (mastering subtraction across zeros).  
   * **Streaks**: Visual trackers of daily activity.  
3. **Ownership & Possession**:  
   * **Avatar Customization**: Math currency earned allows buying items for their avatar.  
   * **Project Gallery**: A place to save their "Playground Designs" or "Fractal Art."

### **6.2 Project-Based Learning (PBL) Integration**

Authentic learning requires application. The app should feature "Weekend Challenges"—longer, multi-step tasks.31

**Project Example: The "Playground Architect"**

* **Brief**: "You have a budget of $10,000 and a lot size of 100x100 feet. Design a park."  
* **Step 1 (Geometry)**: Draw the perimeter fence. Calculate fencing cost ($5/foot).  
* **Step 2 (Area)**: Allocate zones. Swing set needs 200 sq ft. Sandbox needs 50 sq ft.  
* **Step 3 (Budgeting)**: Subtract costs from the $10,000 budget.  
* **Step 4 (Presentation)**: The app generates a PDF "Proposal" of their design.

## ---

**Part VII: The Parent Dashboard & Analytics**

Since this app is for your son, the "Admin Panel" is your tool for intervention and support. It must provide actionable intelligence, not just grades.33

### **7.1 Dashboard Features**

1. **The Heatmap**: A color-coded grid of standards (4.NBT.1, 4.NBT.2, etc.).  
   * *Green*: Mastered (\>90% accuracy).  
   * *Yellow*: Developing (70-90%).  
   * *Red*: Needs Intervention (\<70%).  
   * *Click Action*: Clicking a "Red" standard immediately launches a "Remediation Generator" that creates a targeted 5-question worksheet for that specific skill.  
2. **Misconception Tracker**: The app should log specific error types.  
   * *Alert*: "Your son is consistently adding denominators (e.g., $\\frac{1}{4} \+ \\frac{2}{4} \= \\frac{3}{8}$). Recommended activity: Fraction Strip addition."  
3. **"Dinner Table" Prompts**: Based on the day's lesson, the dashboard sends you a push notification.  
   * *Example*: "Today he learned about factors. Ask him: 'What are the factor pairs of the number 24?'".35

### **7.2 Printable Resources**

The app should include a "Print to PDF" engine. Sometimes, a child needs a break from screens. The engine should be able to take the current adaptive difficulty level and generate a traditional worksheet with an answer key for offline practice.

## ---

**Part VIII: Technical Specifications for Homework Generation**

To guide the development process, here are the algorithmic constraints for the core "Daily Practice" generator.

### **8.1 Algorithm: "The Spiral Review"**

An effective homework set of 15 questions should follow the **60/20/20 Rule**:

* **60% Current Topic**: Problems related to the active module (e.g., Multiplying Fractions).  
* **20% Fluency Maintenance**: Quick mental math (e.g., multiplication facts, rounding) to prevent atrophy.36  
* **20% Spiral Review**: Concepts from 2+ months ago (e.g., asking a Place Value question during the Geometry unit) to ensure long-term retention.

### **8.2 Difficulty Scaling (Adaptive Logic)**

The generator must adjust int\_complexity based on user performance history perf\_hist.

* **If perf\_hist \> 90% (Last 3 sessions)**:  
  * Increase number\_magnitude (e.g., 2-digit \-\> 3-digit).  
  * Introduce multi\_step (e.g., Add then Subtract).  
  * Shift Item Type from Multiple\_Choice to Text\_Entry (remove guessing).  
* **If perf\_hist \< 70%**:  
  * Activate scaffolding\_mode (Show hints automatically).  
  * Reduce number\_complexity (Use "friendly numbers" like 10, 20, 25).  
  * Enable visual\_model\_overlay (Show the number line by default).

## ---

**Conclusion**

Building a Grade 4 math app is an exercise in "scaffolded complexity." The curriculum must respect the massive cognitive leap students take this year—generalizing the base-ten system, mastering multi-digit algorithms, and conceptualizing fractions. By anchoring the application in the visual models of **Area Arrays** and **Tape Diagrams**, and by driving engagement through **Project-Based Learning** and **Gamification**, you can create a tool that not only generates homework but generates mathematical confidence.

The roadmap provided here—spanning from the theoretical "Why" of the Missouri and Texas standards to the technical "How" of the generator algorithms—ensures the final product will be authentic, rigorous, and effective for your son's educational journey.

## ---

**Appendix A: Detailed Scope and Sequence by Week**

The following table provides a recommended pacing guide for the application, aligning specific generator topics with the school year.

| Week | Unit Focus | Generator Topic ID | Visual Model | Project/PBL |
| :---- | :---- | :---- | :---- | :---- |
| **1-2** | Place Value to 1M | NBT\_ReadWrite, NBT\_Compare | Place Value Chart | Million Dollar Budget |
| **3-4** | Rounding & Estimation | NBT\_Round\_All, NBT\_Est\_Sum | Vertical Number Line | Population Analysis |
| **5-7** | Add/Sub Algorithm | NBT\_Add\_Regroup, NBT\_Sub\_Zeros | Chip Model | Trip Planner (Distance) |
| **8-9** | Multi-Digit Mult (Intro) | NBT\_Mult\_10s, NBT\_Area\_2x1 | Area Model (Grid) | Garden Design |
| **10-12** | Multi-Digit Mult (Full) | NBT\_Mult\_2x2, NBT\_Partial | Area Model | Event Planner (Seating) |
| **13-15** | Division | NBT\_Div\_Remain, OA\_Interpret\_R | Number Disks | Cookie Factory |
| **16-17** | Factors & Patterns | OA\_Factors, OA\_Prime | 100 Chart | Code Breaker |
| **18-20** | Fractions (Equiv/Order) | NF\_Equiv, NF\_Compare | Fraction Strips | Pizza Shop Owner |
| **21-23** | Fractions (Ops) | NF\_Add\_Like, NF\_Mult\_Whole | Number Line | Relay Race Analysis |
| **24-25** | Decimals | NF\_Decimal\_Tenths, NF\_Money | 10x10 Grid | Store Receipt Audit |
| **26-28** | Geometry (Angles) | MD\_Angle\_Meas, MD\_Add\_Angle | Protractor Tool | Laser Maze Design |
| **29-30** | Geometry (Shapes) | G\_Symmetry, G\_Classify | Geoboard | Logo Designer |
| **31-33** | Measurement | MD\_Convert, MD\_Area\_Perim | Conversion Table | Tiny House Architect |
| **34+** | Review / Prep | Mix\_Spiral, Test\_Sim | All Models | Final Boss Battle |

## **Appendix B: Fluency Benchmarks for Generator Settings**

To ensure the "Fluency Mode" of your app is calibrated correctly, use these settings.36

* **Multiplication Facts (0-12)**:  
  * *Target Speed*: 3 seconds per problem.  
  * *Pass Criteria*: 35 correct in 1 minute.  
* **Division Facts (0-12)**:  
  * *Target Speed*: 3-4 seconds per problem.  
  * *Pass Criteria*: 30 correct in 1 minute.  
* **Mental Addition (2-digit)**:  
  * *Target Speed*: Untimed (Accuracy Focus).  
  * *Pass Criteria*: 5 consecutive correct without paper.

## **Appendix C: Common Core vs. Missouri vs. Texas Nuances**

| Topic | Common Core (Standard) | Missouri (MLS) Difference | Texas (TEKS) Difference |
| :---- | :---- | :---- | :---- |
| **Data** | Line Plots only (4.MD.B) | Line Plots | **Stem & Leaf Plots**, Dot Plots (TEKS 4.9) |
| **Money** | Integrated in decimals/word problems | Integrated | **Personal Financial Literacy**: Fixed vs. Variable Expenses, Profit, Savings (TEKS 4.10) |
| **Measurement** | Conversion (Lg to Sm) | Conversion | **Input/Output Tables** heavily emphasized for conversions. |
| **Geometry** | Lines & Angles | Lines & Angles | Classifying 2D shapes is more rigorous; emphasis on "Attributes" |

*Recommendation*: If you live in Texas or Missouri, enable the specific "State Mode" in your app settings to unlock these specific problem types.

### ---

**Detailed Module Breakdown: Authentic Problem Sets**

To ensure the app generates *authentic* problems, I have reverse-engineered released test items and standard specifications. Below is the granular logic for the most critical modules.

#### **1\. The "Place Value" Generator (NBT)**

**Problem Type A: The "Ten Times" Logic**

* *Text Template*: "In the number {Number}, how does the value of the digit {Digit} in the {Pos1} place compare to the digit {Digit} in the {Pos2} place?"  
* *Variables*:  
  * Number: e.g., 44,321  
  * Digit: 4  
  * Pos1: Ten-thousands  
  * Pos2: Thousands  
* *Correct Answer*: "It is 10 times greater."  
* *Distractors*: "It is 10 times less.", "It is 100 times greater.", "It is 1 greater."  
* *Authenticity Check*: This directly assesses 4.NBT.A.1.13

**Problem Type B: Expanded Form with "Traps"**

* *Text Template*: "Which expression is equivalent to {Number}?"  
* *Variables*:  
  * Number: 50,203  
* *Correct Answer*: $50,000 \+ 200 \+ 3$  
* *Trap Answer 1*: $50,000 \+ 2,000 \+ 3$ (Misplacing the hundreds digit).  
* *Trap Answer 2*: $5 \+ 0 \+ 2 \+ 0 \+ 3$ (Adding digits).  
* *Authenticity Check*: Released MAP/STAAR items frequently test "internal zeros" to catch students who don't understand place holding.28

#### **2\. The "Multiplication" Generator (NBT)**

**Problem Type C: Area Model Deconstruction**

* *Visual*: A rectangle split into 4 parts. Top side labeled "20 \+ 6". Left side labeled "30 \+ 4". Inside the boxes are blank fields or partial products.  
* *Question*: "Which equation represents the total area of the model?"  
* *Correct Answer*: $(30 \\times 20\) \+ (30 \\times 6\) \+ (4 \\times 20\) \+ (4 \\times 6)$  
* *Trap Answer*: $(30 \\times 20\) \+ (4 \\times 6)$ (Multiplying firsts and lasts only).  
* *Pedagogical Note*: This serves as a diagnostic for the "FOIL" concept (First, Outer, Inner, Last) which appears in algebra later.

**Problem Type D: Multi-Step Word Problems (The "Hidden Question")**

* *Text Template*: "Mrs. Garcia bought {Num1} boxes of pencils. Each box has {Num2} pencils. She gave {Num3} pencils to her students. How many pencils does she have left?"  
* *Variables*:  
  * Num1: \[3-9\]  
  * Num2: \[10-24\]  
  * Num3: \[Integer \< Product of 1 & 2\]  
* *Logic*: Requires (Num1 \* Num2) \- Num3.  
* *Hint System*: If the student answers Num1 \* Num2, the app prompts: "You calculated the total pencils bought. But did she keep them all?".19

#### **3\. The "Fraction" Generator (NF)**

**Problem Type E: Benchmark Comparison (Mental Math)**

* *Text Template*: "Select the fraction that is greater than 1/2."  
* *Options*: {A: 3/8, B: 2/5, C: 4/9, D: 6/10}  
* *Logic*:  
  * A: 3 is less than half of 8\.  
  * B: 2 is less than half of 5\.  
  * C: 4 is less than half of 9\.  
  * D: 6 is more than half of 10\. (Correct).  
* *Why this matters*: This prevents students from relying on cross-multiplication for everything and builds number sense.5

**Problem Type F: Decomposing Mixed Numbers**

* *Text Template*: "Which equation shows {MixedNum} decomposed?"  
* *Variables*:  
  * MixedNum: $2 \\frac{1}{4}$  
* *Correct*: $1 \+ 1 \+ \\frac{1}{4}$  
* *Alternative Correct*: $\\frac{4}{4} \+ \\frac{4}{4} \+ \\frac{1}{4}$  
* *Trap*: $2 \+ 1 \+ 4$ (Adding integers).  
* *Visual Support*: The app should show "Number Bonds" breaking the whole numbers into fractions.

#### **4\. The "Geometry" Generator (G/MD)**

**Problem Type G: Symmetry Select**

* *Interaction*: "Click on all the shapes that have at least one line of symmetry."  
* *Assets*: A set of SVG shapes (Isosceles Triangle, Scalene Triangle, Letter 'H', Letter 'R', Parallelogram).  
* *Tricky Case*: The Parallelogram. Most Grade 4 students think it has diagonal symmetry (it does not). The app must specifically include non-rhombus parallelograms to test this misconception.28

**Problem Type H: Missing Angle (Additive)**

* *Visual*: A large angle of $120^\\circ$ is split into two smaller angles. One is labeled $x$, the other is $45^\\circ$.  
* *Question*: "The total angle measure is $120^\\circ$. What is the value of $x$?"  
* *Logic*: $120 \- 45 \= 75$.  
* *Generator Constraints*: Total angle usually $90^\\circ$ or $180^\\circ$ to reinforce right/straight angle concepts, but can be arbitrary.

### ---

**Implementation Guide: The "Parent-Teacher" Persona**

The app needs a "Voice." Based on the "Number Talks" research, the app shouldn't just be a quiz master; it should be a facilitator.38

The "Hint" System Architecture  
Instead of giving the answer, the app should use scaffolding prompts:

1. **Level 1 Hint (Visual)**: "Let's draw a picture." (App auto-generates the Tape Diagram or Area Model).  
2. **Level 2 Hint (Process)**: "We need to find the total first. What is $4 \\times 8$?"  
3. **Level 3 Hint (Conceptual)**: "Remember, 'times as many' means we are multiplying, not adding."

**The "Error" Feedback Loop**

* *Scenario*: Student adds denominators ($\\frac{1}{4} \+ \\frac{2}{4} \= \\frac{3}{8}$).  
* *App Response*: "Whoops\! If I eat 1 slice of pizza and you eat 2 slices, do the slices suddenly get smaller (eighths)? Or do we just count the slices (fourths)?"  
* *Source*: This mirrors the "Conceptual Change" pedagogy found in Eureka Math.2

### **Final Recommendation for Development**

Start by building the **Unit 3 (Multiplication)** and **Unit 5 (Fractions)** modules. These are the "Heavy Lifts" of Grade 4\. If the app can explain the Area Model and Fraction Equivalence effectively, the rest of the curriculum (Geometry, Measurement) can be built using standard templates.

By strictly adhering to the visual models (Area Model, Tape Diagram, Number Line, Place Value Disks) and avoiding "tricks" (like cross-multiplication without understanding), you will create a tool that not only helps your son with his homework but genuinely teaches him mathematics.

#### **Works cited**

1. Grade 4 » Introduction | Common Core State Standards Initiative, accessed December 15, 2025, [https://www.thecorestandards.org/Math/Content/4/introduction/](https://www.thecorestandards.org/Math/Content/4/introduction/)  
2. The Progression Of Grade 4 Modules \- Great Minds, accessed December 15, 2025, [https://greatminds.org/math/blog/eureka/the-progression-of-grade-4-modules](https://greatminds.org/math/blog/eureka/the-progression-of-grade-4-modules)  
3. CCSS WHERE TO FOCUS GRADE 4 MATHEMATICS \- Achievethecore.org, accessed December 15, 2025, [https://achievethecore.org/file/1260](https://achievethecore.org/file/1260)  
4. Math Fact Fluency: Everything You Need To Know \- Hoboken Public School District, accessed December 15, 2025, [https://www.hoboken.k12.nj.us/curriculum/math\_fact\_fluency\_\_everything\_you\_need\_to\_know](https://www.hoboken.k12.nj.us/curriculum/math_fact_fluency__everything_you_need_to_know)  
5. Missouri Learning Standards \- Crosswalk \- Math \- Grade 4, accessed December 15, 2025, [https://www.drtaylormathcoach.com/uploads/8/1/9/1/8191522/cur-mls-crosswalk-ma-gr4.pdf](https://www.drtaylormathcoach.com/uploads/8/1/9/1/8191522/cur-mls-crosswalk-ma-gr4.pdf)  
6. Common Core Math Standards Grade 4 1, accessed December 15, 2025, [https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server\_27925495/File/%20Grade%20Level%20Info/Grade%202/Common%20Core/4th%20Grade%20Common%20Core%20Math%20Resources/CommonCoreMathGrade4.pdf](https://cdnsm5-ss18.sharpschool.com/UserFiles/Servers/Server_27925495/File/%20Grade%20Level%20Info/Grade%202/Common%20Core/4th%20Grade%20Common%20Core%20Math%20Resources/CommonCoreMathGrade4.pdf)  
7. Practice Test – Grade 4 Math Answer Key, accessed December 15, 2025, [https://tea.texas.gov/student-assessment/staar/released-test-questions/2022-staar-redesign-4-math-paper-key.pdf](https://tea.texas.gov/student-assessment/staar/released-test-questions/2022-staar-redesign-4-math-paper-key.pdf)  
8. EUREKA MATH: GRADE 4 PACING AND PREPARATION GUIDE \- Great Minds, accessed December 15, 2025, [https://greatminds.org/hubfs/knowledge/resources/math/EM\_Basic\_Curriculum\_Files/Pacing\_Preparation\_Guide/EM\_G4\_PacingPreparation\_Guide.pdf](https://greatminds.org/hubfs/knowledge/resources/math/EM_Basic_Curriculum_Files/Pacing_Preparation_Guide/EM_G4_PacingPreparation_Guide.pdf)  
9. Scope and Sequence \- Illustrative Mathematics, accessed December 15, 2025, [https://curriculum.illustrativemathematics.org/k5/teachers/grade-4/course-guide/scope-and-sequence.html](https://curriculum.illustrativemathematics.org/k5/teachers/grade-4/course-guide/scope-and-sequence.html)  
10. Singapore Math Grade 4: Online practice, accessed December 15, 2025, [https://esingaporemath.com/program-grade-4](https://esingaporemath.com/program-grade-4)  
11. GRADE 4 • MODULE 1, accessed December 15, 2025, [https://bays3rdgrade.weebly.com/uploads/4/2/5/4/42542857/math-g4-m1-full-module.pdf](https://bays3rdgrade.weebly.com/uploads/4/2/5/4/42542857/math-g4-m1-full-module.pdf)  
12. MLS Math Expanded Expectations Grade 4 | Missouri Department of Elementary and Secondary Education, accessed December 15, 2025, [https://dese.mo.gov/media/pdf/curr-math-mls%20expanded-expectaions-grade-4](https://dese.mo.gov/media/pdf/curr-math-mls%20expanded-expectaions-grade-4)  
13. curr-math-mls expanded-expectaions-grade-4.docx \- Missouri Department of Elementary and Secondary Education, accessed December 15, 2025, [https://dese.mo.gov/sites/dese/files/media/file/2021/04/curr-math-mls%20expanded-expectaions-grade-4.docx](https://dese.mo.gov/sites/dese/files/media/file/2021/04/curr-math-mls%20expanded-expectaions-grade-4.docx)  
14. Learning Standards \- Grade 4 \- Mathematics \- TeacherEase, accessed December 15, 2025, [https://www.teacherease.com/app/standards/StandardTreeView?sid=11684\&state=OK](https://www.teacherease.com/app/standards/StandardTreeView?sid=11684&state=OK)  
15. curr-mapa-math-k-12-crosswalk.docx \- Missouri Department of Elementary and Secondary Education, accessed December 15, 2025, [https://dese.mo.gov/sites/dese/files/media/file/2021/04/curr-mapa-math-k-12-crosswalk.docx](https://dese.mo.gov/sites/dese/files/media/file/2021/04/curr-mapa-math-k-12-crosswalk.docx)  
16. Eureka Math® Grade 4 Modules 1 & 2 \- Cloudfront.net, accessed December 15, 2025, [https://d1yqpar94jqbqm.cloudfront.net/documents/EM\_TEKS\_G4\_M2\_TE\_ENG.pdf](https://d1yqpar94jqbqm.cloudfront.net/documents/EM_TEKS_G4_M2_TE_ENG.pdf)  
17. Mental Math Strategies And Tips Every Child Should Know \- Third Space Learning, accessed December 15, 2025, [https://thirdspacelearning.com/us/blog/mental-math-strategies/](https://thirdspacelearning.com/us/blog/mental-math-strategies/)  
18. Fourth Grade Math Student Learning Objective Template \- Illinois State Board of Education, accessed December 15, 2025, [https://www.isbe.net/Documents/slo-4th-grade-math.pdf](https://www.isbe.net/Documents/slo-4th-grade-math.pdf)  
19. Common Core fourth-grade math standards \- IXL, accessed December 15, 2025, [https://www.ixl.com/standards/common-core/math/grade-4](https://www.ixl.com/standards/common-core/math/grade-4)  
20. 4 Grade Mathematics ○ Unpacked Content For the new Common Core State Standards that will be effective in all North Carolina sc, accessed December 15, 2025, [https://gcps4thgradecommoncoretraining.weebly.com/uploads/1/2/4/4/12440763/unpacked-4th.pdf](https://gcps4thgradecommoncoretraining.weebly.com/uploads/1/2/4/4/12440763/unpacked-4th.pdf)  
21. Partial Products | PBS LearningMedia, accessed December 15, 2025, [https://www.pbslearningmedia.org/resource/1f6fae76-9490-4980-9d3a-0a2c132d48ed/partial-products/](https://www.pbslearningmedia.org/resource/1f6fae76-9490-4980-9d3a-0a2c132d48ed/partial-products/)  
22. Multiplying Using An Area Model | Educational Kids Math Video \- YouTube, accessed December 15, 2025, [https://www.youtube.com/watch?v=qiwJQxMvPMM](https://www.youtube.com/watch?v=qiwJQxMvPMM)  
23. Multiplying With Area Models and Partial Product \- \- Ashleigh's Education Journey, accessed December 15, 2025, [https://www.ashleigh-educationjourney.com/multiplying-with-area-models/](https://www.ashleigh-educationjourney.com/multiplying-with-area-models/)  
24. What's the Multiplication Area Model and How Do You Teach it? Comprehensive Guide, accessed December 15, 2025, [https://shelleygrayteaching.com/multiplication-area-model/](https://shelleygrayteaching.com/multiplication-area-model/)  
25. Common Core State Standards Crosswalk to Missouri GLEs/CLEs for Mathematics- Grade 4, accessed December 15, 2025, [https://www.desoto.k12.mo.us/common/pages/DisplayFile.aspx?itemId=1031379](https://www.desoto.k12.mo.us/common/pages/DisplayFile.aspx?itemId=1031379)  
26. Free MAP Practice Test & Sample Questions \- Missouri State Test |Lumos Learning, accessed December 15, 2025, [https://www.lumoslearning.com/llwp/resources/missouri-assessment-program-map-practice-tests-sample-questions.html](https://www.lumoslearning.com/llwp/resources/missouri-assessment-program-map-practice-tests-sample-questions.html)  
27. 2022 Grade 4 Mathematics Released Questions \- Regents Exams, accessed December 15, 2025, [https://www.nysedregents.org/ei/math/2022/english/2022-released-items-math-g4.pdf](https://www.nysedregents.org/ei/math/2022/english/2022-released-items-math-g4.pdf)  
28. GRADE 4 Mathematics Practice Assessment \- Texas Education ..., accessed December 15, 2025, [https://tea.texas.gov/student-assessment/staar/released-test-questions/2023-staar-redesign-4-math-practice-test.pdf](https://tea.texas.gov/student-assessment/staar/released-test-questions/2023-staar-redesign-4-math-practice-test.pdf)  
29. How to Gamify Your Math Lessons | Aug 27, 2024 \- Elephant Learning, accessed December 15, 2025, [https://www.elephantlearning.com/post/how-to-gamify-your-math-lessons](https://www.elephantlearning.com/post/how-to-gamify-your-math-lessons)  
30. 29 Gamification Tools to Jazz Up Your Learners in 2024\! \- Xperiencify, accessed December 15, 2025, [https://xperiencify.com/gamification-tools/](https://xperiencify.com/gamification-tools/)  
31. Playground Architect \- Project Based Learning \- 4th Grade Math \- MagiCore, accessed December 15, 2025, [https://magicorelearning.com/shop/product-line/project-based-learning/playground-architect-project-learning-4th-grade-print-digital](https://magicorelearning.com/shop/product-line/project-based-learning/playground-architect-project-learning-4th-grade-print-digital)  
32. 4th Grade Project Based Learning Projects | TPT, accessed December 15, 2025, [https://www.teacherspayteachers.com/browse?search=4th%20grade%20project%20based%20learning%20projects](https://www.teacherspayteachers.com/browse?search=4th+grade+project+based+learning+projects)  
33. Set parental controls with the Amazon Kids Parent Dashboard, accessed December 15, 2025, [https://www.aboutamazon.com/news/devices/set-parental-controls-using-amazon-parent-dashboard](https://www.aboutamazon.com/news/devices/set-parental-controls-using-amazon-parent-dashboard)  
34. Navigating the Parent Dashboard \- YouTube, accessed December 15, 2025, [https://www.youtube.com/watch?v=91Ykw5CsiRw](https://www.youtube.com/watch?v=91Ykw5CsiRw)  
35. Grade 4 Family Support Materials, accessed December 15, 2025, [https://www.wrentham.k12.ma.us/subsites/Mrs--Haughey/documents//Grade-4-Family-Support-Materials.pdf](https://www.wrentham.k12.ma.us/subsites/Mrs--Haughey/documents//Grade-4-Family-Support-Materials.pdf)  
36. Grade 4 Math Curriculum Benchmarks, accessed December 15, 2025, [https://www.westfordk12.us/district/curriculum-and-instruction/files/grade-4-math](https://www.westfordk12.us/district/curriculum-and-instruction/files/grade-4-math)  
37. Rocket Math Fact Fluency Benchmarks, accessed December 15, 2025, [https://rocketmath.com/wp-content/uploads/2015/05/Rocket\_Math\_2013\_Fact\_Fluency\_Benchmarks.pdf](https://rocketmath.com/wp-content/uploads/2015/05/Rocket_Math_2013_Fact_Fluency_Benchmarks.pdf)  
38. Daily Math Fluency, Problem Strings and Problem Talks, Grade 4 \- hand2mind, accessed December 15, 2025, [https://www.hand2mind.com/item/daily-math-fluency-problem-strings-and-problem-talks-grade-4](https://www.hand2mind.com/item/daily-math-fluency-problem-strings-and-problem-talks-grade-4)  
39. 7 tips for encouraging student discourse about math with number talks \- NWEA, accessed December 15, 2025, [https://www.nwea.org/blog/2024/7-tips-for-encouraging-student-discourse-about-math-with-number-talks/](https://www.nwea.org/blog/2024/7-tips-for-encouraging-student-discourse-about-math-with-number-talks/)
