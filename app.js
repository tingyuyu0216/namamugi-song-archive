const $=id=>document.getElementById(id);
async function initialize() {
const response = await fetch('./songs.json');
if (!response.ok) throw new Error(`歌曲資料載入失敗 (${response.status})`);
const songs = await response.json();
if (!Array.isArray(songs)) throw new Error('歌曲資料格式錯誤');
const norm=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[\s・･_－-]+/g,'');
const alias={'我推的孩子':'推しの子 oshi no ko','我推':'推しの子 oshi no ko','福音戰士':'新世紀エヴァンゲリオン','eva':'新世紀エヴァンゲリオン','賽馬娘':'uma musume','火影':'naruto','我英':'僕のヒーローアカデミア','藥師少女':'薬屋のひとりごと','咒術':'呪術廻戦'};
let tab='artists',selected='',page=1,query='';const PAGE=10;
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sorted=[...songs].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const artistCounts=new Map();for(const s of songs)artistCounts.set(s.artist,(artistCounts.get(s.artist)||0)+1);const artists=[...artistCounts.keys()].sort((a,b)=>artistCounts.get(b)-artistCounts.get(a)||a.localeCompare(b,'ja'));
const workNames={
'推しの子':'推しの子','Oshi no Ko':'推しの子','我推的孩子':'推しの子',
'Uma Musume: Pretty Derby':'ウマ娘','賽馬娘Pretty Derby':'ウマ娘',
'新世紀エヴァンゲリオン':'新世紀エヴァンゲリオン','新世紀福音戰士':'新世紀エヴァンゲリオン',
'呪術廻戦':'呪術廻戦','Jujutsu Kaisen':'呪術廻戦','咒術迴戰':'呪術廻戦',
'MASHLE':'マッシュル','肌肉魔法使':'マッシュル',
'名偵探柯南：唐红的戀歌':'名探偵コナン から紅の恋歌','から紅の恋歌':'名探偵コナン から紅の恋歌',
'藥師少女的獨語':'薬屋のひとりごと','薬屋のひとりごと':'薬屋のひとりごと',
'吉伊卡哇':'ちいかわ','ちいかわ':'ちいかわ',
'想哭的我戴上了猫的面具':'泣きたい私は猫をかぶる','泣きたい私は猫をかぶる':'泣きたい私は猫をかぶる',
'我的英雄學院':'僕のヒーローアカデミア','僕のヒーローアカデミア':'僕のヒーローアカデミア',
'Attack on Titan':'進撃の巨人','進撃的巨人':'進撃の巨人','進撃の巨人':'進撃の巨人',
'超時空輝耀姬！':'超かぐや姫！','超かぐや姫！':'超かぐや姫！',
'穿越时空的少女':'時をかける少女','時をかける少女':'時をかける少女',
'烟花':'打ち上げ花火','NARUTO':'NARUTO','火影忍者':'NARUTO'};
function canonicalWork(s){if(!s)return '';const parts=s.split('/').map(x=>x.trim()).filter(Boolean);return parts.map(x=>workNames[x]).find(Boolean)||parts[0]||''}
const workCounts=new Map();for(const s of songs){const w=canonicalWork(s.work);if(w)workCounts.set(w,(workCounts.get(w)||0)+1)}const works=[...workCounts.keys()].sort((a,b)=>workCounts.get(b)-workCounts.get(a)||a.localeCompare(b,'ja'));
function inGroup(s,n){return tab==='artists'?s.artist===n:canonicalWork(s.work)===n}
function groupCard(n){const included=sorted.filter(s=>inGroup(s,n));const names=included.map(s=>s.title).join(' ・ ');return `<button class="card artist-card" data-select="${esc(n)}"><h3>${esc(n)}</h3><div class="count">${included.length} 曲 →</div><div class="group-songs">${esc(names)}</div></button>`}

$('songCount').textContent=songs.length;$('artistCount').textContent=artists.length;
function matched(s,q){const words=[q,...Object.entries(alias).filter(([k])=>norm(k)===norm(q)).map(([,v])=>v)];return words.some(w=>norm([s.title,s.artist,s.en,s.zh,s.work].join(' ')).includes(norm(w))||w.split(' ').some(t=>t.length>3&&norm([s.title,s.artist,s.en,s.zh,s.work].join(' ')).includes(norm(t))))}
function songCard(s){return `<article class="card"><h3>${esc(s.title)}</h3><div class="meta">🎤 ${esc(s.artist)}<br>${s.en?esc(s.en)+'<br>':''}${s.zh?esc(s.zh)+'<br>':''}📅 ${esc(s.date||'日付未登録')}</div>${s.work?`<span class="pill">🎬 ${esc(canonicalWork(s.work))}</span><br>`:''}${s.url?`<a class="song-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Instagram で聴く ↗</a>`:''}</article>`}
function pagination(total){const max=Math.ceil(total/PAGE);if(max<=1)return '';return `<div class="pager"><button data-page="${page-1}" ${page===1?'disabled':''}>‹ 前へ</button>${Array.from({length:max},(_,i)=>`<button data-page="${i+1}" class="${page===i+1?'active':''}">${i+1}</button>`).join('')}<button data-page="${page+1}" ${page===max?'disabled':''}>次へ ›</button></div>`}
function cards(items){const slice=items.slice((page-1)*PAGE,page*PAGE);$('results').innerHTML=slice.length?`<div class="grid">${slice.map(songCard).join('')}</div>${pagination(items.length)}`:'<div class="empty">該当する曲が見つかりませんでした 🌸</div>';$('status').textContent=`${items.length} 曲 · ${Math.max(1,page)} / ${Math.max(1,Math.ceil(items.length/PAGE))} ページ`}
function render(){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('back').hidden=!selected;let list=sorted;
if(query.trim()){list=list.filter(s=>matched(s,query.trim()));$('heading').textContent=`「${query}」の検索結果`;cards(list);return}
if(selected){list=list.filter(s=>inGroup(s,selected));$('heading').textContent=selected;cards(list);return}
if(tab==='artists'||tab==='works'){const names=tab==='artists'?artists:works;$('heading').textContent=tab==='artists'?'アーティストから探す':'作品から探す';$('status').textContent=`${names.length} 件`;const p=names.slice((page-1)*PAGE,page*PAGE);$('results').innerHTML=`<div class="grid">${p.map(groupCard).join('')}</div>${pagination(names.length)}`;return}
if(tab==='random'){const s=songs[Math.floor(Math.random()*songs.length)];$('heading').textContent='今日のナマムギ 🎲';$('status').textContent='';$('results').innerHTML=`<div class="grid">${songCard(s)}</div><div style="text-align:center;margin-top:18px"><button id="again">もう一曲 🎲</button></div>`;return}
$('heading').textContent='投稿順 · 新しい順';cards(list)}
document.querySelector('nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;tab=b.dataset.tab;selected='';query='';$('search').value='';page=1;render()});
$('search').addEventListener('input',e=>{query=e.target.value;selected='';page=1;render()});
$('back').addEventListener('click',()=>{selected='';page=1;render()});
$('results').addEventListener('click',e=>{const a=e.target.closest('[data-select]');if(a){selected=a.dataset.select;page=1;render();window.scrollTo({top:0,behavior:'smooth'});return}const p=e.target.closest('[data-page]');if(p&&!p.disabled){page=Number(p.dataset.page);render();window.scrollTo({top:0,behavior:'smooth'});return}if(e.target.closest('#again'))render()});
render();
}
initialize().catch(error => {
  console.error(error);
  $('status').textContent = '歌曲資料載入失敗，請重新整理後再試。';
  $('results').textContent = '請透過 HTTP 伺服器開啟網站，並確認 songs.json 可以讀取。';
});
