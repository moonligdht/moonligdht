// Original HTML remains visible when Notion is not configured or unavailable.
document.getElementById('year').textContent = new Date().getFullYear();
function el(tag, cls, value){const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=value;return node;}
function appendDetails(target,text){if(!text)return;const items=text.split('\n').map(x=>x.trim()).filter(Boolean);const list=el('ul');items.forEach(item=>list.append(el('li','',item)));target.append(list);}
function render(section,rows){
  if(!Array.isArray(rows)||!rows.length)return;
  const root=document.querySelector(`[data-cms="${section}"]`);if(!root)return;
  const fragment=document.createDocumentFragment();
  for(const row of rows){
    if(section==='profile'){
      const wrapper=el('div');if(row.description)wrapper.append(el('p','',row.description));if(row.details)wrapper.append(el('p','',row.details));fragment.append(wrapper);
    } else if(section==='experience'){
      const article=el('article','timeline-item');article.append(el('div','date',row.date));const body=el('div');body.append(el('h3','',row.title),el('div','role',row.subtitle));if(row.description)body.append(el('p','',row.description));appendDetails(body,row.details);article.append(body);fragment.append(article);
    } else if(section==='education'){
      const article=el('article','edu');article.append(el('span','date',row.date),el('h3','',row.title),el('p','',row.subtitle+(row.description?'\n'+row.description:'')));fragment.append(article);
    } else if(section==='research'){
      const article=el('article','research');const title=el('h3','',row.title);if(row.link && /^https:\/\//.test(row.link)){const a=el('a','',row.title);a.href=row.link;a.target='_blank';a.rel='noopener noreferrer';title.replaceChildren(a);}article.append(title,el('span','badge',row.badge));fragment.append(article);
    } else if(section==='toolkit'){
      const item=el('div','skill');item.append(el('h3','',row.title),el('p','',row.description));fragment.append(item);
    }
  }
  root.replaceChildren(fragment);
}
fetch('/api/content').then(r=>{if(!r.ok)throw Error('CMS not configured');return r.json()}).then(data=>Object.entries(data).forEach(([section,rows])=>render(section,rows))).catch(()=>{/* fallback is original CV content */});
