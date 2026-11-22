
/**
 * moonligdht — Notion CMS API
 * Vercel Serverless Function
 *
 * IMPORTANT:
 * Keep NOTION_TOKEN in Vercel Environment Variables.
 * Never expose it in frontend JavaScript.
 */

const sections = [
  "profile",
  "experience",
  "education",
  "research",
  "toolkit"
];

const envNames = {
  profile: "NOTION_PROFILE_DATA_SOURCE_ID",
  experience: "NOTION_EXPERIENCE_DATA_SOURCE_ID",
  education: "NOTION_EDUCATION_DATA_SOURCE_ID",
  research: "NOTION_RESEARCH_DATA_SOURCE_ID",
  toolkit: "NOTION_TOOLKIT_DATA_SOURCE_ID"
};

// Read a Notion property safely
function prop(page, key) {
  const p = page.properties?.[key];

  if (!p) return "";

  switch (p.type) {
    case "title":
    case "rich_text":
      return (p[p.type] || [])
        .map(item => item.plain_text || "")
        .join("");

    case "select":
      return p.select?.name || "";

    case "url":
      return p.url || "";

    case "date":
      return p.date?.start || "";

    case "number":
      return p.number ?? "";

    case "checkbox":
      return p.checkbox ?? false;

    default:
      return "";
  }
}

// Convert a date to YYYY.MM
function formatDate(date) {
  if (!date) return "";

  return String(date)
    .slice(0, 7)
    .replace("-", ".");
}

// Format experience date range
function experienceDate(page) {
  const start = prop(page, "Start Date");
  const end = prop(page, "End Date");

  if (!start) return "";

  return (
    formatDate(start) +
    " — " +
    (end ? formatDate(end) : "Present")
  );
}

// Convert a Notion page into website content
function mapPage(page, section) {
  const base = {
    id: page.id,
    title: prop(page, "Name"),
    subtitle: prop(page, "Subtitle"),
    date: prop(page, "Date"),
    description: prop(page, "Description"),
    details: prop(page, "Details"),
    badge: prop(page, "Badge"),
    link: prop(page, "Link"),
    order: Number(prop(page, "Order") ?? 999)
  };

  // Experience uses a dedicated Notion schema
  if (section === "experience") {
    return {
      ...base,

      title:
        prop(page, "Company") ||
        prop(page, "Name"),

      subtitle: prop(page, "Role"),

      date: experienceDate(page),

      description: prop(page, "Description"),

      details: prop(page, "Details")
    };
  }

  // Other sections retain their original schema
  return base;
}

// Fetch all pages from a Notion data source
async function queryDataSource(id, token, section) {
  let cursor = null;
  const rows = [];

  do {
    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${encodeURIComponent(id)}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2025-09-03",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_size: 100,
          ...(cursor
            ? { start_cursor: cursor }
            : {})
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        `Notion API error (${section}):`,
        response.status,
        errorText
      );

      throw new Error(
        `Notion API status ${response.status}`
      );
    }

    const data = await response.json();

    rows.push(...data.results);

    cursor = data.has_more
      ? data.next_cursor
      : null;

  } while (cursor);

  // Only show published content
  return rows
    .filter(page => {
      const visible = prop(page, "Visible");

      return visible !== false;
    })
    .map(page => mapPage(page, section))
    .sort((a, b) => a.order - b.order);
}

// Main Vercel API handler
module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return res.status(503).json({
      error: "Notion CMS is not configured"
    });
  }

  try {
    const content = {};

    for (const section of sections) {
      const dataSourceId =
        process.env[envNames[section]];

      if (!dataSourceId) {
        continue;
      }

      content[section] = await queryDataSource(
        dataSourceId,
        token,
        section
      );
    }

    // Cache for 60 seconds
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );

    return res.status(200).json(content);

  } catch (error) {
    console.error(
      "Notion content error:",
      error.message
    );

    return res.status(502).json({
      error: "Content temporarily unavailable"
    });
  }
};
