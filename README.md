# moonligdht — minimal website + Notion CMS

## Included
- `index.html`, `style.css`, `script.js`: minimal responsive site, preserving original profile, career, education, research and toolkit content as fallback.
- `api/content.js`: server-side Notion API integration for Vercel.
- Notion integration is **not yet connected**: you must provide your own Notion integration token, share the data sources with the integration, and set the IDs in Vercel.

## Preview without Notion
Open `index.html` in a browser. All original content appears; the CMS API request fails harmlessly. For CMS testing, use `vercel dev` rather than `file://` or a plain static server.

## Notion setup
1. In Notion, create a parent page `moonligdht CMS` and five **databases**: `Profile`, `Experience`, `Education`, `Research`, `Toolkit`.
2. For **each** database, create properties with the exact case-sensitive names below:
   - `Name`: Title
   - `Subtitle`: Text
   - `Date`: Text
   - `Description`: Text
   - `Details`: Text (one bullet per line)
   - `Badge`: Text
   - `Link`: URL
   - `Visible`: Checkbox (checked for public entries)
   - `Order`: Number
3. Use `Profile` for About (Description and Details), `Experience` for company Name, Subtitle for role/location, Date for date range, Details for bullet points; `Education` for university Name and degree Subtitle; `Research` for paper Name and award Badge; `Toolkit` for category Name and Description.
4. Copy the existing content from `index.html` into the Notion rows, preserving its wording. The existing HTML is a fallback until populated rows are available.
5. Create an internal Notion integration at https://www.notion.so/profile/integrations and grant read access. Share each database with the integration through Notion's connections menu.
6. Get the **data source IDs** (not merely database IDs) using Notion's API. A database can contain more than one data source.
7. Set the following Vercel environment variables (do not put them in the HTML or Git repository):

```
NOTION_TOKEN=secret_...
NOTION_PROFILE_DATA_SOURCE_ID=...
NOTION_EXPERIENCE_DATA_SOURCE_ID=...
NOTION_EDUCATION_DATA_SOURCE_ID=...
NOTION_RESEARCH_DATA_SOURCE_ID=...
NOTION_TOOLKIT_DATA_SOURCE_ID=...
```

You may connect sections incrementally. If a section has no configured ID or no published rows, the original HTML stays visible.

## Deployment
- Import this folder as a Vercel project, using **Other** as the framework preset.
- Set the environment variables above in Vercel Project Settings and redeploy.
- Check `https://YOUR_DOMAIN/api/content` (it should return JSON; do not expose the token).
- Changes in Notion are fetched on subsequent page loads, subject to the configured CDN cache (~60 seconds plus stale-while-revalidate).
- If API fails, the website continues to show the original CV content.

## Notes
- The site is public. Do not put private details in visible Notion rows.
- API token is server-side only. The endpoint exposes published row content, not the token.
- No live Notion account or Vercel deployment has been changed by this package.
- This implementation uses the Notion API version `2025-09-03` data-source query endpoint. Confirm integration compatibility and API permissions before deployment.
