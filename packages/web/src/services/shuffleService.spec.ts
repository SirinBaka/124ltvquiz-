import { describe, it, expect } from "vitest";
import type { Question } from "@ltvquiz/shared";
import {
  createSeededRng,
  fisherYatesShuffle,
  classifyQuestion,
  shuffleQuestionOptions,
  formatQuestionAnswer,
  generateExamVariant,
  generateExamCodes,
  generateMultipleVariants,
  generateMultipleVariantsAsync,
  isPinnedSummaryOption,
  getVariantSignature,
  recomputeVariantAnswerKey,
  splitQuestionsIntoStandardSections,
  parseQuickAnswerKeyString,
  shouldPreserveQuestionOptions,
  groupQuestionsIntoClusters,
} from "./shuffleService";

const sampleQuestions: Question[] = [
  {
    id: "q1",
    type: "multiple_choice",
    sectionTitle: "PHẦN I. Trắc nghiệm nhiều phương án lựa chọn",
    points: 0.25,
    question: [{ type: "text", content: "Nghiệm của $2^x = 8$ là?" }],
    options: [
      { id: "q1_a", label: "A", content: [{ type: "text", content: "x = 1" }] },
      { id: "q1_b", label: "B", content: [{ type: "text", content: "x = 3" }] },
      { id: "q1_c", label: "C", content: [{ type: "text", content: "x = 4" }] },
      { id: "q1_d", label: "D", content: [{ type: "text", content: "x = 2" }] },
    ],
    correctAnswer: ["q1_b"],
    validation: { status: "valid", warnings: [] },
  },
  {
    id: "q2",
    type: "multiple_choice",
    sectionTitle: "PHẦN I. Trắc nghiệm nhiều phương án lựa chọn",
    points: 0.25,
    question: [{ type: "text", content: "Công thức hóa học của axit sunfuric?" }],
    options: [
      { id: "q2_a", label: "A", content: [{ type: "text", content: "HCl" }] },
      { id: "q2_b", label: "B", content: [{ type: "text", content: "HNO3" }] },
      { id: "q2_c", label: "C", content: [{ type: "text", content: "H2SO4" }] },
      { id: "q2_d", label: "D", content: [{ type: "text", content: "H3PO4" }] },
    ],
    correctAnswer: ["q2_c"],
    validation: { status: "valid", warnings: [] },
  },
  {
    id: "q3",
    type: "true_false_multiple",
    sectionTitle: "PHẦN II. Câu trắc nghiệm đúng sai",
    points: 1.0,
    question: [{ type: "text", content: "Xét tính đúng sai các mệnh đề sau:" }],
    options: [
      { id: "q3_a", label: "a", content: [{ type: "text", content: "Mệnh đề Đúng 1" }] },
      { id: "q3_b", label: "b", content: [{ type: "text", content: "Mệnh đề Sai 1" }] },
      { id: "q3_c", label: "c", content: [{ type: "text", content: "Mệnh đề Đúng 2" }] },
      { id: "q3_d", label: "d", content: [{ type: "text", content: "Mệnh đề Sai 2" }] },
    ],
    correctAnswer: ["q3_a", "q3_c"],
    validation: { status: "valid", warnings: [] },
  },
  {
    id: "q4",
    type: "multiple_choice",
    sectionTitle: "PHẦN III. Câu trắc nghiệm trả lời ngắn",
    points: 0.5,
    question: [{ type: "text", content: "Tính giá trị tích phân $\\int_0^2 3x^2 dx$." }],
    options: [],
    correctAnswer: ["8"],
    validation: { status: "valid", warnings: [] },
  },
];

describe("shuffleService", () => {
  it("fisherYatesShuffle is deterministic with the same seed and does not mutate input", () => {
    const input = [1, 2, 3, 4, 5, 6];
    const r1 = fisherYatesShuffle(input, createSeededRng(12345));
    const r2 = fisherYatesShuffle(input, createSeededRng(12345));

    expect(r1).toEqual(r2);
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect(r1.slice().sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("classifyQuestion detects MC, true_false_multiple, and short_answer", () => {
    expect(classifyQuestion(sampleQuestions[0])).toBe("multiple_choice");
    expect(classifyQuestion(sampleQuestions[2])).toBe("true_false_multiple");
    expect(classifyQuestion(sampleQuestions[3])).toBe("short_answer");
  });

  it("shuffleQuestionOptions updates A-D labels and preserves correctAnswer ID", () => {
    const original = sampleQuestions[0];
    const shuffled = shuffleQuestionOptions(original, createSeededRng(42));

    expect(shuffled.options.map((o) => o.label)).toEqual(["A", "B", "C", "D"]);
    expect(shuffled.correctAnswer).toEqual(["q1_b"]);

    const correctOpt = shuffled.options.find((o) =>
      shuffled.correctAnswer.includes(o.id),
    );
    expect(correctOpt?.content[0].content).toBe("x = 3");
    // Original options must stay untouched
    expect(original.options.map((o) => o.id)).toEqual([
      "q1_a",
      "q1_b",
      "q1_c",
      "q1_d",
    ]);
  });

  it("shuffleQuestionOptions shuffles true_false_multiple a-d statements accurately", () => {
    const original = sampleQuestions[2];
    const shuffled = shuffleQuestionOptions(original, createSeededRng(99));

    expect(shuffled.options.map((o) => o.label)).toEqual(["a", "b", "c", "d"]);
    expect(shuffled.correctAnswer).toEqual(["q3_a", "q3_c"]);

    // Verify true statements still map to their true IDs after re-labeling
    const trueTexts = shuffled.options
      .filter((o) => shuffled.correctAnswer.includes(o.id))
      .map((o) => o.content[0].content)
      .sort();
    expect(trueTexts).toEqual(["Mệnh đề Đúng 1", "Mệnh đề Đúng 2"]);
  });

  it("generateExamVariant keeps PHẦN I, II, III separated when groupBySection is true", () => {
    const variant = generateExamVariant(
      sampleQuestions,
      "101",
      { shuffleQuestions: true, shuffleOptions: true, groupBySection: true },
      createSeededRng(7),
    );

    expect(variant.questions).toHaveLength(4);
    expect(variant.questions[0].sectionTitle).toContain("PHẦN I");
    expect(variant.questions[1].sectionTitle).toContain("PHẦN I");
    expect(variant.questions[2].sectionTitle).toContain("PHẦN II");
    expect(variant.questions[3].sectionTitle).toContain("PHẦN III");
    expect(variant.answerKey[3].shuffledAnswer).toBe("8");
  });

  it("generateExamCodes produces sequential and unique random codes", () => {
    expect(generateExamCodes(4, 1, 3, false)).toEqual([
      "001",
      "002",
      "003",
      "004",
    ]);

    const randomCodes = generateExamCodes(
      500,
      101,
      3,
      true,
      createSeededRng(2026),
    );
    expect(randomCodes).toHaveLength(500);
    expect(new Set(randomCodes).size).toBe(500);
  });

  it("generateMultipleVariants produces distinct shuffled variants efficiently", () => {
    const variants = generateMultipleVariants(sampleQuestions, {
      baseName: "Đề Toán 12",
      variantCount: 50,
      shuffleQuestions: true,
      shuffleOptions: true,
      groupBySection: true,
      startingCode: 101,
      codeDigits: 3,
      randomCodes: false,
      seed: 555,
    });

    expect(variants).toHaveLength(50);
    expect(variants[0].examCode).toBe("101");
    expect(variants[49].examCode).toBe("150");
    // Answer key entries match question count
    expect(variants[0].answerKey).toHaveLength(4);
    expect(formatQuestionAnswer(sampleQuestions[3])).toBe("8");
  });

  it("generateMultipleVariantsAsync scales to 1000 variants with progress callbacks", async () => {
    const updates: number[] = [];
    const variants = await generateMultipleVariantsAsync(
      sampleQuestions,
      {
        baseName: "Đề lớn",
        variantCount: 1000,
        shuffleQuestions: true,
        shuffleOptions: true,
        groupBySection: true,
        startingCode: 1,
        codeDigits: 4,
        randomCodes: false,
        seed: 777,
      },
      (done) => updates.push(done),
    );

    expect(variants).toHaveLength(1000);
    expect(variants[999].examCode).toBe("1000");
    expect(updates[updates.length - 1]).toBe(1000);
  });

  it("strips stale option prefixes before relabeling and avoids double labels", () => {
    const prefixed: Question = {
      id: "qp",
      type: "multiple_choice",
      points: 0.25,
      question: [{ type: "text", content: "Câu có sẵn tiền tố:" }],
      options: [
        { id: "a", label: "A", content: [{ type: "text", content: "A. Giá trị 10" }] },
        { id: "b", label: "B", content: [{ type: "text", content: "B) Giá trị 20" }] },
        { id: "c", label: "C", content: [{ type: "text", content: "*C. Giá trị 30" }] },
        { id: "d", label: "D", content: [{ type: "text", content: "d: Giá trị 40" }] },
      ],
      correctAnswer: ["c"],
      validation: { status: "valid", warnings: [] },
    };

    const shuffled = shuffleQuestionOptions(prefixed, createSeededRng(17));
    expect(shuffled.options.map((o) => o.label)).toEqual(["A", "B", "C", "D"]);
    for (const opt of shuffled.options) {
      expect(opt.content[0].content).toMatch(/^Giá trị \d+$/);
    }
    expect(prefixed.options[0].content[0].content).toBe("A. Giá trị 10");
  });

  it("pins summary options at their trailing slot while shuffling regular options", () => {
    const summaryQ: Question = {
      id: "qs",
      type: "multiple_choice",
      points: 0.25,
      question: [{ type: "text", content: "Nhận định nào đúng?" }],
      options: [
        { id: "opt1", label: "A", content: [{ type: "text", content: "Ý thứ nhất đúng" }] },
        { id: "opt2", label: "B", content: [{ type: "text", content: "Ý thứ hai đúng" }] },
        { id: "opt3", label: "C", content: [{ type: "text", content: "Ý thứ ba đúng" }] },
        { id: "opt4", label: "D", content: [{ type: "text", content: "Tất cả đều đúng" }] },
      ],
      correctAnswer: ["opt4"],
      validation: { status: "valid", warnings: [] },
    };

    expect(isPinnedSummaryOption(summaryQ.options[3])).toBe(true);
    expect(isPinnedSummaryOption(summaryQ.options[0])).toBe(false);

    for (let s = 1; s <= 15; s++) {
      const shuffled = shuffleQuestionOptions(summaryQ, createSeededRng(s), {
        pinSummaryOptions: true,
      });
      expect(shuffled.options[3].id).toBe("opt4");
      expect(shuffled.options[3].label).toBe("D");
    }
  });

  it("balances A/B/C/D answer distribution and prevents >2 consecutive identical keys", () => {
    const bank: Question[] = Array.from({ length: 20 }, (_, i) => ({
      id: `mc_${i + 1}`,
      type: "multiple_choice",
      sectionTitle: "PHẦN I. Trắc nghiệm",
      points: 0.25,
      question: [{ type: "text", content: `Câu ${i + 1}` }],
      options: [
        { id: `mc_${i}_a`, label: "A", content: [{ type: "text", content: "Đáp án A" }] },
        { id: `mc_${i}_b`, label: "B", content: [{ type: "text", content: "Đáp án B" }] },
        { id: `mc_${i}_c`, label: "C", content: [{ type: "text", content: "Đáp án C" }] },
        { id: `mc_${i}_d`, label: "D", content: [{ type: "text", content: "Đáp án D" }] },
      ],
      correctAnswer: [`mc_${i}_a`], // all originally A!
      validation: { status: "valid", warnings: [] },
    }));

    const variant = generateExamVariant(
      bank,
      "201",
      {
        shuffleQuestions: true,
        shuffleOptions: true,
        balanceAnswers: true,
        groupBySection: true,
      },
      createSeededRng(1024),
    );

    const keys = variant.answerKey.map((k) => k.shuffledAnswer);
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    let streak = 1;
    let maxStreak = 1;

    keys.forEach((k, idx) => {
      counts[k as keyof typeof counts]++;
      if (idx > 0 && k === keys[idx - 1]) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 1;
      }
    });

    expect(maxStreak).toBeLessThanOrEqual(2);
    expect(counts).toEqual({ A: 5, B: 5, C: 5, D: 5 });
  });

  it("respects separate shuffleTrueFalseStatements and shuffleShortAnswer flags", () => {
    const mixedBank: Question[] = [
      sampleQuestions[2], // true_false_multiple a,b,c,d
      {
        ...sampleQuestions[3],
        id: "sa_1",
        question: [{ type: "text", content: "TLN 1" }],
      },
      {
        ...sampleQuestions[3],
        id: "sa_2",
        question: [{ type: "text", content: "TLN 2" }],
      },
      {
        ...sampleQuestions[3],
        id: "sa_3",
        question: [{ type: "text", content: "TLN 3" }],
      },
    ];

    const variant = generateExamVariant(
      mixedBank,
      "301",
      {
        shuffleQuestions: true,
        shuffleOptions: true,
        shuffleTrueFalseStatements: false,
        shuffleShortAnswer: false,
        groupBySection: true,
      },
      createSeededRng(88),
    );

    expect(variant.questions[0].options.map((o) => o.id)).toEqual([
      "q3_a",
      "q3_b",
      "q3_c",
      "q3_d",
    ]);
    expect(variant.questions.slice(1).map((q) => q.id)).toEqual([
      "sa_1",
      "sa_2",
      "sa_3",
    ]);
  });

  it("deduplicates generated variants against original and prior variants and recomputes answer keys on direct edit", () => {
    const biggerBank: Question[] = [
      ...sampleQuestions,
      {
        ...sampleQuestions[0],
        id: "q5",
        question: [{ type: "text", content: "Câu hỏi thêm 5" }],
      },
      {
        ...sampleQuestions[1],
        id: "q6",
        question: [{ type: "text", content: "Câu hỏi thêm 6" }],
      },
    ];

    const variants = generateMultipleVariants(biggerBank, {
      baseName: "Đề chuẩn",
      variantCount: 10,
      shuffleQuestions: true,
      shuffleOptions: true,
      ensureUniqueVariants: true,
      groupBySection: true,
      startingCode: 101,
      codeDigits: 3,
      randomCodes: false,
      seed: 999,
    });

    const sigs = variants.map((v) => getVariantSignature(v));
    expect(new Set(sigs).size).toBe(10);

    // Direct edit: flip Q1's correct answer to its last option and verify recomputeVariantAnswerKey updates shuffledAnswer
    const editedQuestions = variants[0].questions.map((q) => ({ ...q }));
    if (editedQuestions[0].options.length > 0) {
      const lastOpt = editedQuestions[0].options[editedQuestions[0].options.length - 1];
      editedQuestions[0] = {
        ...editedQuestions[0],
        correctAnswer: [lastOpt.id],
      };
      const updatedKey = recomputeVariantAnswerKey(
        editedQuestions,
        biggerBank,
        variants[0].answerKey,
      );
      expect(updatedKey[0].shuffledAnswer).toBe(lastOpt.label);
    }
  });

  it("splitQuestionsIntoStandardSections segregates Phần I, II, III strictly without mixing", () => {
    const sections = splitQuestionsIntoStandardSections(sampleQuestions);
    expect(sections).toHaveLength(3);
    expect(sections[0].kind).toBe("multiple_choice");
    expect(sections[0].questions).toHaveLength(2);
    expect(sections[0].title).toContain("PHẦN I");

    expect(sections[1].kind).toBe("true_false_multiple");
    expect(sections[1].questions).toHaveLength(1);
    expect(sections[1].title).toContain("PHẦN II");

    expect(sections[2].kind).toBe("short_answer");
    expect(sections[2].questions).toHaveLength(1);
    expect(sections[2].title).toContain("PHẦN III");
  });

  it("parseQuickAnswerKeyString recognizes both numbered format and raw letter sequence", () => {
    // 1. Numbered format: 1A 2D
    const parsed1 = parseQuickAnswerKeyString("1A 2D", sampleQuestions);
    expect(parsed1.recognizedCount).toBe(2);
    expect(parsed1.updates.get("q1")).toEqual(["q1_a"]);
    expect(parsed1.updates.get("q2")).toEqual(["q2_d"]);

    // 2. Raw letter sequence: A D
    const parsed2 = parseQuickAnswerKeyString("A D", sampleQuestions);
    expect(parsed2.recognizedCount).toBe(2);
    expect(parsed2.updates.get("q1")).toEqual(["q1_a"]);
    expect(parsed2.updates.get("q2")).toEqual(["q2_d"]);
  });

  it("shouldPreserveQuestionOptions identifies questions with images, ordered numbers, or chemical labels", () => {
    // 1. Question with image in options
    const qWithImgOpt: Question = {
      id: "q_img",
      type: "multiple_choice",
      question: [{ type: "text", content: "Sơ đồ mạch điện nào sau đây đúng?" }],
      options: [
        { id: "opt_1", label: "A", content: [{ type: "image", content: "circuit_a.png" }] },
        { id: "opt_2", label: "B", content: [{ type: "image", content: "circuit_b.png" }] },
      ],
      correctAnswer: ["opt_1"],
      points: 0.25,
      validation: { status: "valid", warnings: [] },
    };
    expect(shouldPreserveQuestionOptions(qWithImgOpt)).toBe(true);

    // 2. Question with ordered numeric counts: A. 1, B. 2, C. 3, D. 4
    const qWithCounts: Question = {
      id: "q_cnt",
      type: "multiple_choice",
      question: [{ type: "text", content: "Số đồng phân amin bậc 1 của C3H9N là:" }],
      options: [
        { id: "opt_a", label: "A", content: [{ type: "text", content: "1" }] },
        { id: "opt_b", label: "B", content: [{ type: "text", content: "2" }] },
        { id: "opt_c", label: "C", content: [{ type: "text", content: "3" }] },
        { id: "opt_d", label: "D", content: [{ type: "text", content: "4" }] },
      ],
      correctAnswer: ["opt_b"],
      points: 0.25,
      validation: { status: "valid", warnings: [] },
    };
    expect(shouldPreserveQuestionOptions(qWithCounts)).toBe(true);

    // 3. Question with statement subsets: A. (1), (2); B. (2), (3)
    const qWithSubsets: Question = {
      id: "q_sub",
      type: "multiple_choice",
      question: [{ type: "text", content: "Các phát biểu đúng là:" }],
      options: [
        { id: "o1", label: "A", content: [{ type: "text", content: "(1), (2)" }] },
        { id: "o2", label: "B", content: [{ type: "text", content: "(2), (3)" }] },
      ],
      correctAnswer: ["o1"],
      points: 0.25,
      validation: { status: "valid", warnings: [] },
    };
    expect(shouldPreserveQuestionOptions(qWithSubsets)).toBe(true);

    // 4. Question referring to chemical substance labels: "chất A", "chất B"
    const qWithChemLabel: Question = {
      id: "q_chem",
      type: "multiple_choice",
      question: [{ type: "text", content: "Cho sơ đồ phản ứng: chất A tác dụng với dung dịch B tạo kết tủa trắng." }],
      options: [
        { id: "ca", label: "A", content: [{ type: "text", content: "BaCl2 và Na2SO4" }] },
        { id: "cb", label: "B", content: [{ type: "text", content: "NaCl và KNO3" }] },
      ],
      correctAnswer: ["ca"],
      points: 0.25,
      validation: { status: "valid", warnings: [] },
    };
    expect(shouldPreserveQuestionOptions(qWithChemLabel)).toBe(true);

    // 5. Normal question without dependencies: should NOT be preserved
    const qNormal: Question = {
      id: "q_norm",
      type: "multiple_choice",
      question: [{ type: "text", content: "Kim loại có tính dẫn điện tốt nhất là:" }],
      options: [
        { id: "na", label: "A", content: [{ type: "text", content: "Bạc" }] },
        { id: "nb", label: "B", content: [{ type: "text", content: "Đồng" }] },
      ],
      correctAnswer: ["na"],
      points: 0.25,
      validation: { status: "valid", warnings: [] },
    };
    expect(shouldPreserveQuestionOptions(qNormal)).toBe(false);
  });

  it("groupQuestionsIntoClusters keeps questions sharing an experiment diagram together", () => {
    const qList: Question[] = [
      {
        id: "q1",
        type: "multiple_choice",
        question: [{ type: "text", content: "Câu hỏi độc lập 1" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "q2_exp",
        type: "multiple_choice",
        question: [
          { type: "text", content: "Cho hình vẽ mô tả thí nghiệm điều chế khí Cl2:" },
          { type: "image", content: "exp_cl2.png" },
        ],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "q3_exp",
        type: "multiple_choice",
        question: [{ type: "text", content: "Trong thí nghiệm trên, bình chứa dung dịch NaCl có tác dụng:" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "q4_exp",
        type: "multiple_choice",
        question: [{ type: "text", content: "Vai trò của bông tẩm kiềm ở miệng bình trong thí nghiệm trên là:" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "q5",
        type: "multiple_choice",
        question: [{ type: "text", content: "Câu hỏi độc lập 2" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
    ];

    const clusters = groupQuestionsIntoClusters(qList);
    expect(clusters).toHaveLength(3);
    // Cluster 1: Q1
    expect(clusters[0].map((q) => q.id)).toEqual(["q1"]);
    // Cluster 2: Q2, Q3, Q4 grouped together because of the experiment diagram and references
    expect(clusters[1].map((q) => q.id)).toEqual(["q2_exp", "q3_exp", "q4_exp"]);
    // Cluster 3: Q5
    expect(clusters[2].map((q) => q.id)).toEqual(["q5"]);
  });

  it("generateExamVariant with preserveMediaChemistry keeps clusters consecutive and preserves image options", () => {
    const questionsWithCluster: Question[] = [
      {
        id: "c1",
        type: "multiple_choice",
        question: [
          { type: "text", content: "Cho hình vẽ thí nghiệm điều chế este:" },
          { type: "image", content: "ester_setup.png" },
        ],
        options: [
          { id: "c1_a", label: "A", content: [{ type: "text", content: "CH3COOCH=CH2" }] },
          { id: "c1_b", label: "B", content: [{ type: "text", content: "CH3COOC2H5" }] },
        ],
        correctAnswer: ["c1_b"],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "c2",
        type: "multiple_choice",
        question: [{ type: "text", content: "Trong thí nghiệm trên, đá bọt có tác dụng gì?" }],
        options: [
          { id: "c2_a", label: "A", content: [{ type: "text", content: "Tránh trào sôi đột ngột" }] },
          { id: "c2_b", label: "B", content: [{ type: "text", content: "Xúc tác phản ứng" }] },
        ],
        correctAnswer: ["c2_a"],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "c3",
        type: "multiple_choice",
        question: [{ type: "text", content: "Sơ đồ nào mô tả đúng?" }],
        options: [
          { id: "c3_a", label: "A", content: [{ type: "image", content: "diagram_a.png" }] },
          { id: "c3_b", label: "B", content: [{ type: "image", content: "diagram_b.png" }] },
        ],
        correctAnswer: ["c3_a"],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
    ];

    const variant = generateExamVariant(
      questionsWithCluster,
      "901",
      {
        shuffleQuestions: true,
        shuffleOptions: true,
        preserveMediaChemistry: true,
      },
      createSeededRng(777),
    );

    // c1 and c2 must be adjacent in the shuffled exam!
    const idx1 = variant.questions.findIndex((q) => q.id === "c1");
    const idx2 = variant.questions.findIndex((q) => q.id === "c2");
    expect(idx2).toBe(idx1 + 1);

    // c3 options with images must stay in original order (diagram_a.png remains A)
    const q3 = variant.questions.find((q) => q.id === "c3");
    expect(q3?.options[0].content[0].content).toBe("diagram_a.png");
    expect(q3?.options[0].label).toBe("A");
  });

  it("keeps multi-question ranges ('Dùng cho các câu 1 đến 3') and inline markdown option images intact", () => {
    const rangeBank: Question[] = [
      {
        id: "r1",
        type: "multiple_choice",
        question: [
          { type: "text", content: "Dùng cho các câu 1 đến 3. Cho hình vẽ:" },
          { type: "image", content: "data:image/png;base64,RANGE" },
        ],
        options: [
          { id: "r1_a", label: "A", content: [{ type: "text", content: "![a](data:image/png;base64,OA)" }] },
          { id: "r1_b", label: "B", content: [{ type: "text", content: "![b](data:image/png;base64,OB)" }] },
        ],
        correctAnswer: ["r1_a"],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "r2",
        type: "multiple_choice",
        question: [{ type: "text", content: "Nhận xét thứ nhất về đồ thị?" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "r3",
        type: "multiple_choice",
        question: [{ type: "text", content: "Kết luận cuối cùng là gì?" }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
      {
        id: "r4",
        type: "multiple_choice",
        question: [{ type: "text", content: "Câu hỏi độc lập khác." }],
        options: [],
        correctAnswer: [],
        points: 0.25,
        validation: { status: "valid", warnings: [] },
      },
    ];

    expect(shouldPreserveQuestionOptions(rangeBank[0])).toBe(true);
    const clusters = groupQuestionsIntoClusters(rangeBank);
    expect(clusters).toHaveLength(2);
    expect(clusters[0].map((q) => q.id)).toEqual(["r1", "r2", "r3"]);
    expect(clusters[1].map((q) => q.id)).toEqual(["r4"]);
  });
});
