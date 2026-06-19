/**
 * Delete a Convex cloud preview deployment by preview name (e.g. pr-42).
 *
 * Required env:
 *   CONVEX_TEAM_ACCESS_TOKEN — team access token from the Convex dashboard
 *   PREVIEW_DEPLOYMENT_NAME — preview identifier (CI uses pr-<number>)
 *
 * Required env:
 *   CONVEX_TEAM_ACCESS_TOKEN — team access token from the Convex dashboard
 *   PREVIEW_DEPLOYMENT_NAME — preview identifier (CI uses pr-<number>)
 *   CONVEX_TEAM_SLUG — team slug from the Convex dashboard URL
 *
 * Optional env:
 *   CONVEX_PROJECT_SLUG — default: flip-x
 *   CONVEX_API_BASE — default: https://api.convex.dev/v1
 */

const API_BASE = process.env.CONVEX_API_BASE ?? "https://api.convex.dev/v1";
const TEAM_SLUG = process.env.CONVEX_TEAM_SLUG;
const PROJECT_SLUG = process.env.CONVEX_PROJECT_SLUG ?? "flip-x";
const PREVIEW_NAME = process.env.PREVIEW_DEPLOYMENT_NAME;
const TOKEN = process.env.CONVEX_TEAM_ACCESS_TOKEN;

if (!TEAM_SLUG) {
  throw new Error(
    "CONVEX_TEAM_SLUG is required. Use the team slug from your Convex dashboard URL.",
  );
}

if (!TOKEN) {
  throw new Error(
    "CONVEX_TEAM_ACCESS_TOKEN is required. Create a team access token in the Convex dashboard.",
  );
}

if (!PREVIEW_NAME) {
  throw new Error("PREVIEW_DEPLOYMENT_NAME is required (e.g. pr-42).");
}

const reference = `preview/${PREVIEW_NAME}`;
const lookupUrl = new URL(
  `${API_BASE}/teams/${encodeURIComponent(TEAM_SLUG)}/projects/${encodeURIComponent(PROJECT_SLUG)}/deployment`,
);
lookupUrl.searchParams.set("reference", reference);

const headers = { Authorization: `Bearer ${TOKEN}` };

const lookupResponse = await fetch(lookupUrl, { headers });
const lookupBody = await readJson(lookupResponse);

if (lookupResponse.status === 404) {
  console.log(
    `No preview deployment for ${reference} in ${TEAM_SLUG}/${PROJECT_SLUG}; nothing to delete.`,
  );
  process.exit(0);
}

if (!lookupResponse.ok) {
  throw apiError("lookup preview deployment", lookupResponse.status, lookupBody);
}

const deploymentName = lookupBody.name;
if (!deploymentName) {
  throw new Error(`Lookup succeeded but response had no deployment name.`);
}

const deleteUrl = `${API_BASE}/deployments/${encodeURIComponent(deploymentName)}/delete`;
const deleteResponse = await fetch(deleteUrl, { method: "POST", headers });

if (!deleteResponse.ok) {
  const deleteBody = await readJson(deleteResponse);
  throw apiError("delete preview deployment", deleteResponse.status, deleteBody);
}

console.log(
  `Deleted preview deployment ${deploymentName} (${reference}) from ${TEAM_SLUG}/${PROJECT_SLUG}.`,
);

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function apiError(action, status, body) {
  const detail =
    typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return new Error(`Failed to ${action} (${status}): ${detail}`);
}
