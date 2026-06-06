import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const inputPath = args[0];
const formatIndex = args.indexOf("--format");
const format = formatIndex >= 0 ? args[formatIndex + 1] : "json";

if (!inputPath || !["json", "markdown"].includes(format)) {
  console.error("Usage: node normalize-quotes.mjs <quotes.json> --format <json|markdown>");
  process.exit(2);
}

const required = ["platform", "title", "base_price", "collected_at"];
const quotes = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));

if (!Array.isArray(quotes)) {
  throw new Error("Input must be a JSON array.");
}

const stageScore = {
  checkout: 1,
  product_page: 0.82,
  search_card: 0.55,
  discovery_only: 0.25,
};
const matchScore = { exact: 1, probable: 0.72, ambiguous: 0.35, mismatch: 0 };

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function discountTotal(items = []) {
  return items.reduce((sum, item) => sum + Math.max(0, finiteNumber(item.amount)), 0);
}

function normalize(quote, index) {
  const missing = required.filter((field) => quote[field] === undefined || quote[field] === "");
  if (missing.length) {
    throw new Error(`Quote ${index + 1} is missing: ${missing.join(", ")}`);
  }

  const collected = new Date(quote.collected_at);
  if (Number.isNaN(collected.getTime())) {
    throw new Error(`Quote ${index + 1} has invalid collected_at.`);
  }

  const base = finiteNumber(quote.base_price);
  const shipping = finiteNumber(quote.shipping);
  const unconditional = discountTotal(quote.discounts);
  const conditional = discountTotal(quote.conditional_discounts);
  const computed = Math.max(0, base + shipping - unconditional);
  const finalPrice = quote.observed_final_price === undefined
    ? computed
    : finiteNumber(quote.observed_final_price);
  const bestCasePrice = Math.max(0, finalPrice - conditional);
  const ageHours = Math.max(0, (Date.now() - collected.getTime()) / 3_600_000);
  const stale = ageHours > finiteNumber(quote.max_age_hours, 24);
  const stage = quote.price_stage || "discovery_only";
  const match = quote.match || "ambiguous";
  const confidence = Math.min(1, Math.max(0, finiteNumber(quote.confidence, 0.5)));
  const verification = stageScore[stage] ?? 0.2;
  const alignment = matchScore[match] ?? 0.2;
  const stockPenalty = quote.stock === "out_of_stock" ? 1 : 0;
  const stalePenalty = stale ? 0.25 : 0;
  const conditionalPenalty = conditional > 0 ? 0.08 : 0;
  const qualityScore = Math.max(
    0,
    confidence * 0.35 + verification * 0.35 + alignment * 0.3
      - stockPenalty - stalePenalty - conditionalPenalty,
  );

  const flags = [];
  if (stale) flags.push("stale");
  if (conditional > 0) flags.push("conditional_best_case");
  if (stage === "discovery_only") flags.push("unverified_snippet");
  if (match !== "exact") flags.push(`sku_${match}`);
  if (quote.stock === "out_of_stock") flags.push("out_of_stock");
  if (quote.observed_final_price === undefined) flags.push("computed_not_checkout_observed");

  return {
    ...quote,
    normalized_final_price: Number(finalPrice.toFixed(2)),
    conditional_best_case_price: Number(bestCasePrice.toFixed(2)),
    unconditional_discount_total: Number(unconditional.toFixed(2)),
    conditional_discount_total: Number(conditional.toFixed(2)),
    age_hours: Number(ageHours.toFixed(1)),
    quality_score: Number(qualityScore.toFixed(3)),
    flags,
  };
}

const normalized = quotes
  .map(normalize)
  .sort((a, b) => {
    const unusableA = a.match === "mismatch" || a.stock === "out_of_stock";
    const unusableB = b.match === "mismatch" || b.stock === "out_of_stock";
    if (unusableA !== unusableB) return unusableA ? 1 : -1;
    if (Math.abs(a.quality_score - b.quality_score) >= 0.15) {
      return b.quality_score - a.quality_score;
    }
    return a.normalized_final_price - b.normalized_final_price;
  });

if (format === "json") {
  process.stdout.write(`${JSON.stringify(normalized, null, 2)}\n`);
} else {
  const escapeCell = (value) => String(value ?? "").replaceAll("|", "\\|");
  const lines = [
    "| Rank | Platform | Item | Final price | Conditional best | Stage | Match | Quality | Flags |",
    "| ---: | --- | --- | ---: | ---: | --- | --- | ---: | --- |",
    ...normalized.map((quote, index) =>
      `| ${index + 1} | ${escapeCell(quote.platform)} | ${escapeCell(quote.title)} | ¥${quote.normalized_final_price.toFixed(2)} | ¥${quote.conditional_best_case_price.toFixed(2)} | ${escapeCell(quote.price_stage || "discovery_only")} | ${escapeCell(quote.match || "ambiguous")} | ${quote.quality_score.toFixed(3)} | ${escapeCell(quote.flags.join(", "))} |`,
    ),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}
