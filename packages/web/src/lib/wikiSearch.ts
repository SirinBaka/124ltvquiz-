export interface WikiArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  categoryId: string;
  keywords: string[];
  status: "verified" | "conditional" | "unavailable" | "needs_verification";
  relatedIds: string[];
}

export interface SearchResult {
  article: WikiArticle;
  score: number;
  matchType: string;
  excerpt: string;
}

// 1. Text Normalization
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ") // Remove punctuation but keep alphanumeric and spaces
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

// Keep special terms intact or normalized differently
export function tokenize(str: string): string[] {
  const normalized = normalizeVietnamese(str);
  return normalized.split(" ").filter((t) => t.length > 0);
}

// 2. Synonyms Dictionary
const SYNONYMS: Record<string, string[]> = {
  "tai len": ["upload", "tai file", "dua len", "nhap"],
  upload: ["tai len", "tai file", "nhap"],
  "tai file": ["tai len", "upload"],
  "trich xuat": ["doc", "nhan dien", "xu ly", "quet", "extract"],
  extract: ["trich xuat", "doc", "nhan dien", "xu ly"],
  "doc pdf": ["trich xuat pdf", "quet pdf"],
  loi: [
    "khong the",
    "khong duoc",
    "bi sai",
    "hong",
    "khong luu",
    "error",
    "fail",
    "issue",
    "problem",
    "bug",
  ],
  error: [
    "loi",
    "khong the",
    "khong duoc",
    "bi sai",
    "problem",
    "fail",
    "issue",
  ],
  fail: ["loi", "that bai", "khong duoc", "error"],
  issue: ["loi", "su co", "van de", "error"],
  "khong luu": [
    "loi luu",
    "khong luu duoc",
    "mat du lieu",
    "not save",
    "unsaved",
  ],
  "chinh sua": [
    "sua",
    "thay doi",
    "cap nhat",
    "sua dap an",
    "edit",
    "modify",
    "update",
  ],
  edit: ["chinh sua", "sua", "thay doi", "cap nhat", "modify"],
  "hinh anh": ["anh", "hinh", "mat hinh", "image", "picture", "photo"],
  image: ["hinh anh", "anh", "hinh", "picture"],
  "chia se": ["gui link", "gui", "share"],
  share: ["chia se", "gui link", "link", "qr"],
  "cau hoi trac nghiem": [
    "cau abcd",
    "cau trac nghiem",
    "cau hoi lua chon",
    "multiple choice",
  ],
  "cau hoi dung sai": ["cau dung sai", "dung sai", "cau t f", "true false"],
  "kiem tra": ["de thi", "bai thi", "test", "quiz", "exam"],
  quiz: ["kiem tra", "de thi", "bai thi", "test", "exam"],
  test: ["kiem tra", "de thi", "bai thi", "quiz", "exam"],
  exam: ["kiem tra", "de thi", "bai thi", "quiz", "test"],
  "cong thuc": ["toan", "ly", "hoa", "formula", "math", "equation"],
  formula: ["cong thuc", "toan", "math", "equation"],
  math: ["toan", "cong thuc", "formula", "equation"],
};

export function expandSynonyms(tokens: string[]): string[] {
  const expanded = new Set<string>(tokens);

  // Bigram check
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i + 1]}`;
    if (SYNONYMS[bigram]) {
      SYNONYMS[bigram].forEach((syn) => expanded.add(syn));
    }
  }

  // Unigram check
  tokens.forEach((token) => {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach((syn) => expanded.add(syn));
    }
  });

  return Array.from(expanded);
}

// 3. Intent Detection
export type QueryIntent =
  "how_to" | "troubleshooting" | "definition" | "general";

export function detectIntent(query: string): QueryIntent {
  const norm = normalizeVietnamese(query);
  if (
    norm.includes("cach") ||
    norm.includes("lam sao") ||
    norm.includes("huong dan") ||
    norm.includes("lam the nao") ||
    norm.includes("how") ||
    norm.includes("guide")
  ) {
    return "how_to";
  }
  if (
    norm.includes("tai sao") ||
    norm.includes("loi") ||
    norm.includes("khong duoc") ||
    norm.includes("bi sai") ||
    norm.includes("khong the") ||
    norm.includes("why") ||
    norm.includes("error") ||
    norm.includes("fail") ||
    norm.includes("problem") ||
    norm.includes("troubleshoot")
  ) {
    return "troubleshooting";
  }
  if (
    norm.includes("la gi") ||
    norm.includes("nghia la gi") ||
    norm.includes("what is") ||
    norm.includes("define") ||
    norm.includes("meaning")
  ) {
    return "definition";
  }
  return "general";
}

// 4. Relevance Scoring
export function searchArticles(
  query: string,
  articles: WikiArticle[],
): SearchResult[] {
  if (!query.trim()) return [];

  const rawQuery = query.toLowerCase();
  const normQuery = normalizeVietnamese(query);
  const queryTokens = tokenize(query);
  const expandedTokens = expandSynonyms(queryTokens);
  const intent = detectIntent(query);

  const results: SearchResult[] = [];

  for (const article of articles) {
    let score = 0;
    const normTitle = normalizeVietnamese(article.title);
    const normContent = normalizeVietnamese(article.content);

    let matchType = "Liên quan";
    let excerpt = article.summary;

    // 1. Exact Phrase Matching (Title) - 35% weight base
    if (normTitle.includes(normQuery)) {
      score += 35;
      matchType = "Trùng khớp tiêu đề";
    }

    // 2. Keyword & Token Matching (Title & Keywords) - 25% weight base
    let tokenMatchCount = 0;
    for (const token of expandedTokens) {
      if (normTitle.includes(token)) {
        tokenMatchCount += 2;
      } else if (
        article.keywords.some((k) => normalizeVietnamese(k).includes(token))
      ) {
        tokenMatchCount += 1.5;
      } else if (normContent.includes(token)) {
        tokenMatchCount += 0.5;
      }
    }
    score += Math.min(25, tokenMatchCount * 5); // cap at 25

    // 3. Full text matching - 20% weight base
    if (normContent.includes(normQuery)) {
      score += 20;
      if (matchType === "Liên quan") matchType = "Trùng khớp nội dung";

      // Find excerpt
      const rawContentLower = article.content.toLowerCase();
      const matchIdx = rawContentLower.indexOf(rawQuery);
      if (matchIdx !== -1) {
        const start = Math.max(0, matchIdx - 40);
        const end = Math.min(article.content.length, matchIdx + 80);
        excerpt =
          "..." +
          article.content.substring(start, end).replace(/\n/g, " ") +
          "...";
      }
    }

    // 4. Intent Compatibility - 10% weight base
    if (
      intent === "how_to" &&
      (normTitle.includes("cach") || normTitle.includes("huong dan"))
    ) {
      score += 10;
    } else if (
      intent === "troubleshooting" &&
      (normTitle.includes("loi") ||
        normTitle.includes("khac phuc") ||
        normTitle.includes("xu ly"))
    ) {
      score += 10;
    } else if (intent === "definition" && normTitle.includes("la gi")) {
      score += 10;
    }

    // 5. Article Quality / Verification - 10% weight base
    if (article.status === "verified") score += 10;
    else if (article.status === "conditional") score += 5;
    else if (article.status === "needs_verification") score += 2;
    // unavailable gets 0

    if (score > 10) {
      // Threshold
      results.push({
        article,
        score,
        matchType,
        excerpt,
      });
    }
  }

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}
