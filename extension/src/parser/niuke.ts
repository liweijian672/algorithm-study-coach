import type { Difficulty, ParsedProblem, SolvedProblem } from "../types";

export interface NiuKePageInfo {
  uuid?: string;
  questionId?: string;
  problemId?: string;
  questionTitle?: string;
  questionName_var?: string;
  difficulty_var?: string;
}

// 已通过 / 答案正确 / 通过率 / 简单 / 入门 / 较难 / 困难
const SOLVED_TEXT = /(?:\u5df2\u901a\u8fc7|\u7b54\u6848\u6b63\u786e)/;
const EASY_TEXT = /(?:\u7b80\u5355|\u5165\u95e8|\beasy\b)/i;
const HARD_TEXT = /(?:\u8f83\u96be|\u56f0\u96be|\bhard\b)/i;

function mapDifficulty(value: string | null): Difficulty {
  const text = (value ?? "").trim();
  if (!text) return "medium";
  if (text === "1" || EASY_TEXT.test(text)) return "easy";
  if (text === "3" || HARD_TEXT.test(text)) return "hard";
  return "medium";
}

function uuidFromUrl(url: string | null | undefined): string {
  const match = (url ?? "").match(/\/practice\/([a-f0-9]{20,})/i);
  return match?.[1] ?? "";
}

function absoluteUrl(href: string | null | undefined): string {
  if (!href) return "";
  try {
    return new URL(href, "https://www.nowcoder.com").toString();
  } catch {
    return href;
  }
}

export function extractPageInfo(doc: Document): NiuKePageInfo {
  const scriptText = Array.from(doc.querySelectorAll("script"))
    .map((script) => script.textContent ?? "")
    .join("\n");
  const info: NiuKePageInfo = {};

  const title = scriptText.match(/questionTitle\s*:\s*['"]([^'"]+)['"]/);
  if (title) info.questionTitle = title[1];

  const difficulty = scriptText.match(
    /difficulty_var\s*:\s*['"]([0-9]+)['"]/,
  );
  if (difficulty) info.difficulty_var = difficulty[1];

  const uuid = scriptText.match(/\buuid\s*:\s*['"]([a-f0-9]{20,})['"]/i);
  if (uuid) info.uuid = uuid[1];

  const questionId = scriptText.match(/\bquestionId\s*:\s*['"]([0-9]+)['"]/);
  if (questionId) info.questionId = questionId[1];

  const problemId = scriptText.match(/\bproblemId\s*:\s*['"]([0-9]+)['"]/);
  if (problemId) info.problemId = problemId[1];

  return info;
}

function firstText(doc: Document, selectors: string[]): string {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent?.trim()) return element.textContent.trim();
  }
  return "";
}

function tagTexts(doc: Document): string[] {
  const texts = Array.from(
    doc.querySelectorAll(".tag, .subject-tag, .question-tag"),
  )
    .map((element) => element.textContent?.trim())
    .filter((text): text is string => Boolean(text));
  return Array.from(new Set(texts));
}

export function parseProblemPage(
  doc: Document,
  pageInfo?: NiuKePageInfo | null,
): ParsedProblem | null {
  const title =
    pageInfo?.questionTitle ??
    pageInfo?.questionName_var ??
    firstText(doc, [".subject-title", "h1", "[class*='title']"]);
  if (!title) return null;

  const difficultyNode = doc.querySelector("[data-difficulty]");
  const difficultyText =
    difficultyNode?.getAttribute("data-difficulty") ??
    difficultyNode?.textContent?.trim() ??
    pageInfo?.difficulty_var ??
    firstText(doc, [".difficulty", "[class*='difficulty']"]);
  const difficulty = mapDifficulty(difficultyText || null);

  const sourceNode = doc.querySelector(
    "[data-question-id], [data-problem-id], [data-id]",
  );
  const url = doc.querySelector("link[rel='canonical']")?.getAttribute("href")
    ?? doc.location?.href
    ?? "";
  const source_id =
    uuidFromUrl(url) ||
    pageInfo?.uuid ||
    pageInfo?.questionId ||
    pageInfo?.problemId ||
    sourceNode?.getAttribute("data-question-id") ||
    sourceNode?.getAttribute("data-problem-id") ||
    sourceNode?.getAttribute("data-id") ||
    "";

  return {
    platform: "niuke",
    source_id,
    title,
    difficulty,
    tags: tagTexts(doc),
    url,
  };
}

export function parseSolvedList(doc: Document): SolvedProblem[] {
  const anchors = Array.from(
    doc.querySelectorAll("a[href*='/practice/']"),
  ) as HTMLAnchorElement[];
  const results: SolvedProblem[] = [];
  const seen = new Set<string>();

  for (const anchor of anchors) {
    const source_id = uuidFromUrl(anchor.getAttribute("href"));
    if (!source_id || seen.has(source_id)) continue;

    const row = anchor.closest(
      "tr, li, [class*='question-item'], [class*='subject-item'], [class*='list-item']",
    );
    const rowText = row?.textContent ?? anchor.textContent ?? "";
    if (!SOLVED_TEXT.test(rowText)) continue;

    const title = anchor.textContent?.trim() ?? "";
    if (!title) continue;

    seen.add(source_id);
    results.push({
      source_id,
      title,
      difficulty: mapDifficulty(rowText),
      tags: [],
      url: absoluteUrl(anchor.getAttribute("href")),
    });
  }

  return results;
}
