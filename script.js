'use strict';
const KEY = 'church-bulletin-draft-v1';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function clone(o) { return JSON.parse(JSON.stringify(o)); }

const THEMES = {
  navy:     {'--p':'#14213D','--a':'#C6A15B','--bg':'#F8F5EF','--t':'#252525'},
  burgundy: {'--p':'#6D1A2B','--a':'#C6A15B','--bg':'#FBF6EC','--t':'#252525'},
  emerald:  {'--p':'#0F4D3A','--a':'#C6A15B','--bg':'#F6F5EC','--t':'#252525'},
  black:    {'--p':'#111111','--a':'#C6A15B','--bg':'#FAF8F2','--t':'#252525'},
  white:    {'--p':'#1D3557','--a':'#1D3557','--bg':'#FFFFFF','--t':'#252525'},
  purple:   {'--p':'#3F2A63','--a':'#9AA3AE','--bg':'#F7F6FA','--t':'#252525'}
};
const PAGES = {a4:'A4 portrait', a5:'A5 portrait', land:'A4 landscape', digital:'A4 portrait'};
const CATS = ['Sunday Worship','Thanksgiving Service','Revival Programme','Youth Convention','Annual Convention','Church Anniversary','Evangelism Programme','Bible Study','Prayer Meeting','Leadership Conference','Wedding Ceremony','Funeral Service','Special Celebration'];

const FIELDS = {
  church: [['name','Church name'],['denom','Denomination'],['address','Address'],['phone','Telephone'],['email','Email'],['web','Website'],['motto','Motto'],['pastor','Pastor / minister']],
  event: [['title','Event title'],['theme','Theme'],['subtitle','Subtitle'],['category','Category','select'],['date','Date','date'],['start','Starting time','time'],['end','Closing time','time'],['venue','Venue'],['scripture','Theme scripture (reference)'],['verse','Scripture text (type your own)','textarea'],['desc','Description','textarea']]
};
const LISTS = {
  program:   {title:'Programme schedule', keys:[['time','Time'],['act','Activity'],['who','Responsible']]},
  ministers: {title:'Ministers and guests', keys:[['name','Name'],['role','Role / title']]},
  notes:     {title:'Announcements', keys:[['title','Title'],['text','Details']]}
};

const SAMPLE = {
  sample: true,
  church: {name:"St. Peter's Anglican Church", denom:'Anglican Communion', address:'', phone:'', email:'', web:'', motto:'', pastor:'', logo:''},
  event: {title:'Annual Youth Thanksgiving Service', theme:'Arise and Shine', subtitle:'', category:'Thanksgiving Service', date:'2026-11-22', start:'08:00', end:'', venue:'Church Auditorium', scripture:'Isaiah 60:1', verse:'', desc:''},
  program: [
    {time:'8:00 AM', act:'Welcome Address', who:'Chairman'},
    {time:'8:10 AM', act:'Opening Prayer', who:'Prayer Team'},
    {time:'8:20 AM', act:'Praise and Worship', who:'Choir'},
    {time:'8:45 AM', act:'Hymn', who:'Congregation'},
    {time:'8:55 AM', act:'Bible Reading', who:'Assigned Reader'},
    {time:'9:05 AM', act:'Special Ministration', who:'Youth Choir'},
    {time:'9:20 AM', act:'Sermon', who:'Officiating Minister'},
    {time:'10:00 AM', act:'Thanksgiving Offering', who:'Finance Team'},
    {time:'10:15 AM', act:'Announcements', who:'Secretary'},
    {time:'10:25 AM', act:'Closing Prayer', who:'Minister'},
    {time:'10:30 AM', act:'Benediction', who:'Officiating Minister'}
  ],
  ministers: [{name:'[Name]', role:'Officiating Minister'},{name:'[Name]', role:'Guest Preacher'}],
  notes: [{title:'Sample announcement', text:'Replace this with your own notice.'}],
  show: {verse:true, program:true, ministers:true, notes:true, contact:true},
  design: {tpl:'royal', theme:'navy', fmt:'a4'}
};

let S = load();
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || clone(SAMPLE); }
  catch (e) { return clone(SAMPLE); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { say('Draft could not be saved (try a smaller logo).'); }
}
let timer;
function say(t) { $('#msg').textContent = t; clearTimeout(timer); timer = setTimeout(() => $('#msg').textContent = '', 4000); }

/* ---------- Editor ---------- */
function fieldHTML(path, label, type, val) {
  const id = 'f-' + path.replace('.', '-');
  let inp;
  if (type === 'textarea') inp = `<textarea id="${id}" rows="3" data-path="${path}">${esc(val)}</textarea>`;
  else if (type === 'select') inp = `<select id="${id}" data-path="${path}">${CATS.map(c => `<option${c === val ? ' selected' : ''}>${c}</option>`).join('')}</select>`;
  else inp = `<input id="${id}" type="${type || 'text'}" data-path="${path}" value="${esc(val)}">`;
  return `<div class="f"><label for="${id}">${label}</label>${inp}</div>`;
}
function groupHTML(title, grp) {
  return `<fieldset><legend>${title}</legend>` +
    FIELDS[grp].map(([k, l, t]) => fieldHTML(grp + '.' + k, l, t, S[grp][k])).join('') + '</fieldset>';
}
function listHTML(n) {
  const L = LISTS[n];
  return `<fieldset><legend>${L.title}</legend>` + S[n].map((r, i) =>
    `<div class="row">` +
    L.keys.map(([k, l]) => `<input aria-label="${l} ${i + 1}" placeholder="${l}" data-list="${n}" data-i="${i}" data-k="${k}" value="${esc(r[k])}">`).join('') +
    `<span class="ctl"><button type="button" data-mv="${n}:${i}:-1" aria-label="Move ${l0(L, i)} up">&uarr;</button>` +
    `<button type="button" data-mv="${n}:${i}:1" aria-label="Move ${l0(L, i)} down">&darr;</button>` +
    `<button type="button" data-del="${n}:${i}" aria-label="Remove ${l0(L, i)}">Remove</button></span></div>`
  ).join('') + `<button type="button" data-add="${n}">+ Add</button></fieldset>`;
}
function l0(L, i) { return L.title.toLowerCase() + ' row ' + (i + 1); }
function buildForms() {
  $('#forms').innerHTML = groupHTML('Church information', 'church') + groupHTML('Event details', 'event') +
    listHTML('program') + listHTML('ministers') + listHTML('notes');
  document.querySelectorAll('[data-design]').forEach(el => el.value = S.design[el.dataset.design]);
  document.querySelectorAll('[data-show]').forEach(el => el.checked = !!S.show[el.dataset.show]);
  $('#sampleNote').hidden = !S.sample;
}

/* ---------- Bulletin preview ---------- */
const fmtTime = t => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
const fmtDate = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'}) : '';

function render() {
  const {church:c, event:e, show:s, design:d} = S, sh = $('#sheet');
  sh.className = `sheet tpl-${d.tpl} fmt-${d.fmt}`;
  Object.entries(THEMES[d.theme]).forEach(([k, v]) => sh.style.setProperty(k, v));
  const when = [fmtDate(e.date), fmtTime(e.start) + (e.end ? ' to ' + fmtTime(e.end) : ''), e.venue].filter(Boolean).join(' · ');
  let h = `<header class="hd">${c.logo ? `<img src="${c.logo}" alt="${esc(c.name)} logo">` : ''}
    <div class="church">${esc(c.name)}</div>${c.denom ? `<div class="sub">${esc(c.denom)}</div>` : ''}
    <p class="cat">${esc(e.category)}</p><h1 class="title">${esc(e.title)}</h1>
    ${e.theme ? `<h2 class="theme">Theme: ${esc(e.theme)}</h2>` : ''}${e.subtitle ? `<p class="sub">${esc(e.subtitle)}</p>` : ''}
    <p class="when">${esc(when)}</p>${c.motto ? `<p class="sub"><em>${esc(c.motto)}</em></p>` : ''}</header>`;
  if (e.desc) h += `<p>${esc(e.desc)}</p>`;
  if (s.verse && (e.scripture || e.verse))
    h += `<blockquote class="verse">${e.verse ? `<p>\u201C${esc(e.verse)}\u201D</p>` : ''}<cite>${esc(e.scripture)}</cite></blockquote>`;
  const prog = S.program.filter(r => r.time || r.act || r.who);
  if (s.program && prog.length)
    h += `<h2 class="sec">Programme</h2><table><tbody>${prog.map(r => `<tr><td>${esc(r.time)}</td><td>${esc(r.act)}</td><td>${esc(r.who)}</td></tr>`).join('')}</tbody></table>`;
  const mins = S.ministers.filter(r => r.name || r.role);
  if (s.ministers && mins.length)
    h += `<h2 class="sec">Ministers and Guests</h2>${mins.map(r => `<div class="mi"><b>${esc(r.name)}</b><span>${esc(r.role)}</span></div>`).join('')}`;
  const nts = S.notes.filter(r => r.title || r.text);
  if (s.notes && nts.length)
    h += `<h2 class="sec">Announcements</h2>${nts.map(r => `<div class="nt"><h3>${esc(r.title)}</h3><p>${esc(r.text)}</p></div>`).join('')}`;
  const contact = [c.pastor && 'Pastor: ' + c.pastor, c.address, c.phone, c.email, c.web].filter(Boolean).join(' · ');
  if (s.contact && contact) h += `<footer class="ft">${esc(contact)}</footer>`;
  sh.innerHTML = h;
}

/* ---------- Events ---------- */
document.addEventListener('input', e => {
  const t = e.target, d = t.dataset;
  if (d.path) { const [a, b] = d.path.split('.'); S[a][b] = t.value; }
  else if (d.list) S[d.list][+d.i][d.k] = t.value;
  else if (d.design) S.design[d.design] = t.value;
  else if (d.show) S.show[d.show] = t.checked;
  else return;
  S.sample = false; $('#sampleNote').hidden = true;
  save(); render();
});

document.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.add) S[d.add].push(Object.fromEntries(LISTS[d.add].keys.map(([k]) => [k, ''])));
  else if (d.del) { const [n, i] = d.del.split(':'); S[n].splice(+i, 1); }
  else if (d.mv) {
    const [n, i, s] = d.mv.split(':'), a = +i, z = a + +s;
    if (z < 0 || z >= S[n].length) return;
    [S[n][a], S[n][z]] = [S[n][z], S[n][a]];
  }
  else if (d.act) { ACT[d.act](); return; }
  else return;
  S.sample = false; save(); buildForms(); render();
});

$('#logo').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 1.5e6) return say('Please choose an image under 1.5 MB.');
  const r = new FileReader();
  r.onload = () => { S.church.logo = r.result; S.sample = false; save(); render(); };
  r.onerror = () => say('Could not read that image.');
  r.readAsDataURL(f);
});

function tab(v) {
  $('.app').dataset.view = v;
  $('#tabEdit').setAttribute('aria-pressed', v === 'edit');
  $('#tabView').setAttribute('aria-pressed', v === 'view');
}
$('#tabEdit').onclick = () => tab('edit');
$('#tabView').onclick = () => tab('view');

/* ---------- Output ---------- */
function valid() {
  if (!S.church.name.trim()) { say('Please enter the church name.'); tab('edit'); $('#f-church-name').focus(); return false; }
  if (!S.event.title.trim()) { say('Please enter the event title.'); tab('edit'); $('#f-event-title').focus(); return false; }
  return true;
}
function pageSize() {
  let st = $('#pageStyle');
  if (!st) { st = document.createElement('style'); st.id = 'pageStyle'; document.head.appendChild(st); }
  st.textContent = `@page{size:${PAGES[S.design.fmt]};margin:0}`;
}
function cssText() {
  try { return [...document.styleSheets[0].cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; }
}
const ACT = {
  print() { if (valid()) { pageSize(); window.print(); } },
  html() {
    if (!valid()) return;
    const c = cssText(), head = c ? `<style>${c}</style>` : '<link rel="stylesheet" href="styles.css">';
    const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.event.title)}</title>${head}</head><body style="margin:0;background:#e9e6df">${$('#sheet').outerHTML}</body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([doc], {type:'text/html'}));
    a.download = 'bulletin.html'; a.click(); URL.revokeObjectURL(a.href);
  },
  copy() {
    if (!navigator.clipboard) return say('Copy is not supported in this browser.');
    navigator.clipboard.writeText($('#sheet').innerText).then(() => say('Bulletin text copied.'), () => say('Could not copy.'));
  },
  share() {
    if (!valid()) return;
    if (!navigator.share) return say('Sharing is not available here. Use Download HTML or Print / PDF.');
    navigator.share({title: S.event.title, text: $('#sheet').innerText}).catch(() => {});
  },
  reset() {
    if (!confirm('Replace your bulletin with the sample? Your current draft will be lost.')) return;
    S = clone(SAMPLE); save(); buildForms(); render();
  }
};

buildForms();
render();