type JsonRecord = Record<string, unknown>;

function stripHtml(input: string): string {
  return input
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, "");
}

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function normalizeText(input: string): string {
  return decodeEntities(stripHtml(input))
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

function toLines(input: string): string[] {
  return normalizeText(input)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseFaqPairs(content: string): Array<{ question: string; answer: string }> {
  const pairs: Array<{ question: string; answer: string }> = [];
  const seen = new Set<string>();
  const lines = toLines(content);

  for (let index = 0; index < lines.length - 1; index += 1) {
    const line = lines[index];
    const next = lines[index + 1];
    if (!line.endsWith("?") || next.endsWith("?")) {
      continue;
    }
    if (next.length < 8) {
      continue;
    }

    const key = `${line}::${next}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    pairs.push({ question: line, answer: next });
  }

  if (pairs.length > 0) {
    return pairs.slice(0, 8);
  }

  const qaRegex =
    /Q[:\-]\s*([\s\S]+?)\s*(?:\n|<br\s*\/?>)+\s*A[:\-]\s*([\s\S]+?)(?=(?:\n|<br\s*\/?>)+Q[:\-]|\s*$)/gim;
  let match: RegExpExecArray | null;
  while ((match = qaRegex.exec(content)) !== null) {
    const question = normalizeText(match[1]);
    const answer = normalizeText(match[2]);
    if (!question || !answer) {
      continue;
    }
    pairs.push({ question: question.endsWith("?") ? question : `${question}?`, answer });
  }

  return pairs.slice(0, 8);
}

function parseHowToSteps(content: string): string[] {
  const lines = toLines(content);
  const steps: string[] = [];

  lines.forEach((line) => {
    const stepMatch = line.match(/^(?:step\s*\d+[:.-]?\s+|\d+\.\s+)(.+)$/i);
    if (stepMatch) {
      steps.push(stepMatch[1].trim());
    }
  });

  return steps.filter(Boolean);
}

export function generateFaqSchema(content: string): JsonRecord | null {
  const faqPairs = parseFaqPairs(content);
  if (faqPairs.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqPairs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function generateHowToSchema(content: string): JsonRecord | null {
  const steps = parseHowToSteps(content);
  if (steps.length < 2) {
    return null;
  }

  const lines = toLines(content);
  const nameCandidate =
    lines.find((line) => !/^step\s*\d+/i.test(line) && !/^\d+\./.test(line)) ||
    "How to execute this workflow";

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: nameCandidate,
    step: steps.map((stepText, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: stepText,
      text: stepText,
    })),
  };
}
