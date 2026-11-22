// Vercel serverless function. Keep NOTION_TOKEN on the server only.
const sections = ['profile','experience','education','research','toolkit'];
const envNames = {profile:'NOTION_PROFILE_DATA_SOURCE_ID',experience:'NOTION_EXPERIENCE_DATA_SOURCE_ID',education:'NOTION_EDUCATION_DATA_SOURCE_ID',research:'NOTION_RESEARCH_DATA_SOURCE_ID',toolkit:'NOTION_TOOLKIT_DATA_SOURCE_ID'};
function prop(page, key) {
  const p = page.properties?.[key];
  if (!p) return '';
  if (p.type === 'title' || p.type === 'rich_text') return (p[p.type] || []).map(x => x.plain_text).join('');
  if (p.type === 'select') return p.select?.name || '';
  if (p.type === 'url') return p.url || '';
  if (p.type === 'date') return p.date?.start || '';
  if (p.type === 'number') return p.number ?? '';
  if (p.type === 'checkbox') return p.checkbox;
  return '';
}
async function queryDataSource(id, token) {
  let cursor, rows = [];
  do {
    const response = await fetch(`https://api.notion.com/v1/data_sources/${encodeURIComponent(id)}/query`, {
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'},
      body:JSON.stringify({page_size:100,...(cursor?{start_cursor:cursor}:{})})
    });
    if(!response.ok) throw new Error(`Notion API status ${response.status}`);
    const data = await response.json();
    rows.push(...data.results);
    cursor = data.has_more ? data.next_cursor : null;
  } while(cursor);
  return rows.filter(p => p.properties?.Visible?.checkbox !== false)
    .map(p => ({id:p.id,title:prop(p,'Name'),subtitle:prop(p,'Subtitle'),date:prop(p,'Date'),description:prop(p,'Description'),details:prop(p,'Details'),badge:prop(p,'Badge'),link:prop(p,'Link'),order:Number(prop(p,'Order') || 999)}))
    .sort((a,b)=>a.order-b.order);
}
module.exports = async (req,res) => {
  if(req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const token = process.env.NOTION_TOKEN;
  if(!token) return res.status(503).json({error:'Notion CMS is not configured'});
  try {
    const content = {};
    for(const section of sections){
      const id = process.env[envNames[section]];
      if(id) content[section] = await queryDataSource(id,token);
    }
    res.setHeader('Cache-Control','public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(content);
  } catch(e){console.error('Notion content error:',e.message);return res.status(502).json({error:'Content temporarily unavailable'});}
};
