/* فرا ماساژ | نوبتها — منطق اصلی */
"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const DB_KEY="fara_db_v2";
let DB=null, UI={tab:"week",weekOffset:0,search:"",groupFilter:"all",detailId:null,monthOpen:null};

/* ---------- تاریخ جلالی (نسخه استاندارد jalaali-js) ---------- */
function div(a,b){return~~(a/b)} function mod(a,b){return a-~~(a/b)*b}
function jalCal(jy){var breaks=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178],bl=breaks.length,gy=jy+621,leapJ=-14,jp=breaks[0],jm,jump,leap,leapG,march,n,i;if(jy<jp||jy>=breaks[bl-1])throw new Error('Invalid year');for(i=1;i<bl;i+=1){jm=breaks[i];jump=jm-jp;if(jy<jm)break;leapJ=leapJ+div(jump,33)*8+div(mod(jump,33),4);jp=jm}n=jy-jp;leapJ=leapJ+div(n,33)*8+div(mod(n,33)+3,4);if(mod(jump,33)===4&&jump-n===4)leapJ+=1;leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;march=20+leapJ-leapG;if(jump-n<6)n=n-jump+div(jump+4,33)*33;leap=mod(mod(n+1,33)-1,4);if(leap===-1)leap=4;return{leap:leap,gy:gy,march:march}}
function g2d(gy,gm,gd){var d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;d=d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752;return d}
function d2g(jdn){var j=4*jdn+139361631;j=j+div(div(4*jdn+183187720,146097)*3,4)*4-3908;var i=div(mod(j,1461),4)*5+308;var gd=div(mod(i,153),5)+1;var gm=mod(div(i,153),12)+1;var gy=div(j,1461)-100100+div(8-gm,6);return[gy,gm,gd]}
function d2j(jdn){var g=d2g(jdn),gy=g[0],jy=gy-621,r=jalCal(jy),jdn1f=g2d(gy,3,r.march),jd,jm,k;var k_=jdn-jdn1f;if(k_>=0){if(k_<=185){jm=1+div(k_,31);jd=mod(k_,31)+1;return[jy,jm,jd]}else k_-=186}else{jy-=1;k_+=179;if(r.leap===1)k_+=1}jm=7+div(k_,30);jd=mod(k_,30)+1;return[jy,jm,jd]}
function j2d(jy,jm,jd){var r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1}
function toJalaali(gy,gm,gd){return d2j(g2d(gy,gm,gd))}
function toGregorian(jy,jm,jd){return d2g(j2d(jy,jm,jd))}
function jalToday(){const d=new Date();const[jy,jm,jd]=toJalaali(d.getFullYear(),d.getMonth()+1,d.getDate());return{y:jy,m:jm,d:jd}}
function jalStr(y,m,d){return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")}
function jalTodayStr(){const t=jalToday();return jalStr(t.y,t.m,t.d)}
function jalParse(s){const[a,b,c]=s.split("-").map(Number);return{y:a,m:b,d:c}}
function jalToDate(s){const{y,m,d}=jalParse(s);const[gY,gM,gD]=toGregorian(y,m,d);return new Date(gY,gM-1,gD)}
function jalWeekday(s){return jalToDate(s).getDay()} // 0=یکشنبه..6=شنبه
const WN=["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"];
const MN=["","فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function faDate(s){try{const{y,m,d}=jalParse(s);return WN[jalWeekday(s)]+" "+d+" "+MN[m]+" "+y}catch(e){return s}}
function faMonth(y,m){return MN[m]+" "+y}
function addDaysJal(s,n){const d=jalToDate(s);d.setDate(d.getDate()+n);const[jy,jm,jd]=toJalaali(d.getFullYear(),d.getMonth()+1,d.getDate());return jalStr(jy,jm,jd)}
function saturdayOf(s){const g=jalToDate(s).getDay();const off=(g+1)%7;return addDaysJal(s,-off)}
function faNum(n){return String(n).replace(/[0-9]/g,c=>"۰۱۲۳۴۵۶۷۸۹"[c])}
function tomans(n){n=Number(n)||0;return faNum(n.toLocaleString("en-US"))+" تومان"}
function uid(){return "id"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}

/* ---------- دیتابیس محلی (ماندگار) ---------- */
function blankDB(){return{appointments:[],contacts:[],packages:[],services:["ماساژ ریلکسی","ماساژ درمانی","ماساژ سنگ داغ"],therapists:["تراپیست ۱"],groups:["عمومی"],payments:[],settings:{salonCode:""}}}
function load(){try{const raw=localStorage.getItem(DB_KEY);if(raw){DB=Object.assign(blankDB(),JSON.parse(raw));return}}catch(e){}DB=blankDB();save()}
function save(){try{localStorage.setItem(DB_KEY,JSON.stringify(DB))}catch(e){}if(window.FARA_SYNC)window.FARA_SYNC.pushSoon()}
function norm(s){return (s||"").replace(/[يي]/g,"ی").replace(/[كک]/g,"ک").replace(/[\u200c\s]+/g," ").trim()}

/* ---------- جست‌وجو / پیشنهاد اسم ---------- */
function allNames(){const m=new Map();
  DB.contacts.forEach(c=>{const k=norm(c.name);if(k&&!m.has(k))m.set(k,{name:c.name,phone:c.phone||"",group:c.group||""})});
  DB.appointments.forEach(a=>{const k=norm(a.name);if(k&&!m.has(k))m.set(k,{name:a.name,phone:a.phone||"",group:a.group||"",service:a.service||"",therapist:a.therapist||"",section:a.section||""})});
  return[...m.values()]}
function suggest(q){q=norm(q);if(q.length<1)return[];const all=allNames();
  const starts=all.filter(x=>norm(x.name).startsWith(q)||(x.phone&&x.phone.includes(q)));
  const contains=all.filter(x=>!starts.includes(x)&&norm(x.name).includes(q));
  return starts.concat(contains).slice(0,6)}

/* ---------- نوبت‌ها ---------- */
function apptDay(date){return DB.appointments.filter(a=>a.date===date&&a.status!=="deleted")}
function fmtTime(t){return faNum(t)}
function statusIcon(a){if(a.status==="done")return " ✓";if(a.status==="cancelled")return " (لغو شد)";return ""}
function conflict(a,ignoreId){return DB.appointments.some(b=>b.id!==ignoreId&&b.status==="active"&&b.date===a.date&&b.time===a.time&&(b.therapist||"")===(a.therapist||"")&&(b.section||"")===(a.section||""))}

/* ---------- رندر ---------- */
function setTab(t){UI.tab=t;$$("nav.tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===t));render()}
function toggleDrawer(open){document.getElementById("drawer").classList.toggle("open",!!open);document.getElementById("drawerBack").classList.toggle("open",!!open)}
function render(){const m=$("#main");if(UI.tab==="week")m.innerHTML=vWeek(0);
  else if(UI.tab==="future")m.innerHTML=vWeek(1);
  else if(UI.tab==="today")m.innerHTML=vList(jalTodayStr(),"نوبت‌های امروز");
  else if(UI.tab==="tomorrow")m.innerHTML=vList(addDaysJal(jalTodayStr(),1),"نوبت‌های فردا");
  else if(UI.tab==="all")m.innerHTML=vAll();
  else if(UI.tab==="packs")m.innerHTML=vPacks();
  else if(UI.tab==="acc")m.innerHTML=vAcc();
  else if(UI.tab==="contacts")m.innerHTML=vContacts();
  updateSyncBadge()}
function passFilter(a){if(UI.groupFilter!=="all"&&(a.group||"")!==UI.groupFilter)return false;
  if(UI.search){const q=norm(UI.search);if(!(norm(a.name).includes(q)||(a.phone||"").includes(UI.search.trim())))return false}return true}

function vWeek(which){const base=addDaysJal(saturdayOf(jalTodayStr()),(UI.weekOffset+which)*7);
  const days=[...Array(7)].map((_,i)=>addDaysJal(base,i));
  let h=`<div class="weeknav"><button onclick="UI.weekOffset--;render()">قبل ›</button><div class="t">${which===0?"هفته جاری":"هفته آینده"}<div class="muted">${faDate(days[0])} تا ${faDate(days[6])}</div></div><button onclick="UI.weekOffset++;render()">‹ بعد</button></div>`;
  days.forEach(ds=>{const isT=ds===jalTodayStr();const list=apptDay(ds).filter(passFilter);
    h+=`<div class="dayhead ${isT?"today":""}"><span>${isT?"⭐ ":""}${faDate(ds)} · ${faNum(list.filter(a=>a.status==="active").length)} نوبت</span><button class="add" onclick="openForm({date:'${ds}'})">+</button></div>`;
    h+=`<table class="grid"><tr><th>ساعت</th><th>بانوان</th><th>آقایان</th></tr>`;
    for(let hh=12;hh<=21;hh++){const t=String(hh).padStart(2,"0")+":00";
      const cell=(sec)=>{const items=list.filter(a=>a.time===t&&((a.section||"")==sec||(!a.section&&sec==="women"&&false)));
        const noSec=sec==="women"?list.filter(a=>a.time===t&&!a.section):[];
        let s=items.map(a=>`<span class="namechip ${a.status==="done"?"done":a.status==="cancelled"?"cancel":""}" onclick="openDetail('${a.id}')">${escapeHtml(a.name)}${a.status==="done"?" ✓":""}${a.time!==t?" "+faNum(a.time):""}</span>`).join("");
        if(sec==="women"&&noSec.length)s+=noSec.map(a=>`<span class="namechip" onclick="openDetail('${a.id}')">❔${escapeHtml(a.name)}</span>`).join("");
        s+=`<div><button class="cellbtn" onclick="openForm({date:'${ds}',time:'${t}',section:'${sec}'})">+</button></div>`;return s};
      h+=`<tr><td class="hour">${faNum(t)}</td><td>${cell("women")}</td><td>${cell("men")}</td></tr>`}
    const out=list.filter(a=>{const h=+a.time.slice(0,2);return h<12||h>21});
    if(out.length)h+=`<tr><td class="hour">خارج بازه</td><td colspan="2">${out.map(a=>`<span class="namechip" onclick="openDetail('${a.id}')">${faNum(a.time)} ${escapeHtml(a.name)}</span>`).join("")}</td></tr>`;
    h+=`</table>`});
  return h}
function vList(ds,title){const list=apptDay(ds).filter(passFilter).sort((a,b)=>a.time.localeCompare(b.time));
  let h=`<h3 style="margin:8px 2px">${title} — ${faDate(ds)}</h3>`;
  if(!list.length)h+=`<div class="list-card muted">نوبتی ثبت نشده. <button class="btn small primary" onclick="openForm({date:'${ds}'})">+ ثبت نوبت</button></div>`;
  list.forEach(a=>{h+=apptCard(a)});return h}
function vAll(){const q=UI.search?` — جست‌وجو: ${escapeHtml(UI.search)}`:"";
  const list=[...DB.appointments].filter(a=>a.status!=="deleted").filter(passFilter).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,200);
  let h=`<h3 style="margin:8px 2px">همه نوبت‌ها${q} (${faNum(list.length)})</h3>`;
  if(!list.length)h+=`<div class="list-card muted">موردی نیست.</div>`;
  list.forEach(a=>{h+=apptCard(a)});return h}
function apptCard(a){const st=a.status==="done"?"✅ انجام شد":a.status==="cancelled"?"⛔ لغو شد":"🕐 فعال";
  const sec=a.section==="women"?"بانوان":a.section==="men"?"آقایان":"—";
  return `<div class="list-card"><div class="nm" onclick="openDetail('${a.id}')" style="cursor:pointer">${escapeHtml(a.name)} <span class="muted">${st}</span></div>
  <div class="muted">${faDate(a.date)} · ساعت ${faNum(a.time)} · ${sec} · ${escapeHtml(a.service||"")} · ${escapeHtml(a.therapist||"")}</div>
  <div>مبلغ ${tomans(a.price)} · بیعانه ${tomans(a.deposit)} · مانده ${tomans((+a.price||0)-(+a.deposit||0))}</div>
  <div class="btnrow"><button class="btn small" onclick="openDetail('${a.id}')">جزئیات</button>
  <button class="btn small" onclick="quickDone('${a.id}')">انجام شد</button>
  <button class="btn small" onclick="remind('${a.id}')">یادآوری</button></div></div>`}

/* ---------- بسته‌ها ---------- */
function vPacks(){let h=`<div class="btnrow"><button class="btn primary" onclick="openPackForm()">+ فروش بسته جلسات</button></div>`;
  if(!DB.packages.length)h+=`<div class="list-card muted">بسته‌ای ثبت نشده.</div>`;
  [...DB.packages].reverse().forEach(p=>{const rem=pkgRemain(p);const pct=p.total?Math.round(100*rem/p.total):0;
  h+=`<div class="list-card"><div class="nm">${escapeHtml(p.buyer)} — مانده <b>${faNum(rem)}</b> از ${faNum(p.total)} جلسه</div>
   <div class="pbar"><div style="width:${pct}%"></div></div>
   <div class="muted">${faDate(p.date)} · مصرف‌شده ${faNum(p.used||0)} · پرداختی ${tomans(p.paid)}</div>
   <div class="btnrow"><button class="btn small" onclick="packUse('${p.id}')">کسر یک جلسه</button><button class="btn small danger" onclick="packDel('${p.id}')">حذف</button></div></div>`});
  return h}

/* ---------- حسابداری ---------- */
function monthKeyOf(ds){return ds.slice(0,7)}
function vAcc(){const pays=DB.payments;
  const nowM=monthKeyOf(jalTodayStr());
  const sumM=k=>pays.filter(p=>monthKeyOf(p.date)===k).reduce((s,p)=>s+(+p.amount||0),0);
  const total=pays.reduce((s,p)=>s+(+p.amount||0),0);
  const recvTotal=DB.appointments.filter(a=>a.status==="active"||a.status==="done").reduce((s,a)=>s+((+a.price||0)-(+a.deposit||0)),0);
  let h=`<div class="kpis"><div class="kpi">دریافتی این ماه<b>${tomans(sumM(nowM))}</b></div><div class="kpi">کل دریافتی<b>${tomans(total)}</b></div><div class="kpi">مانده قابل دریافت<b>${tomans(recvTotal)}</b></div></div>`;
  const months={};pays.forEach(p=>{const k=monthKeyOf(p.date);months[k]=months[k]||{ap:0,pk:0,n:0};if(p.kind==="package")months[k].pk+=+p.amount||0;else months[k].ap+=+p.amount||0;months[k].n++});
  const keys=Object.keys(months).sort().reverse();
  h+=`<table class="simple"><tr><th>ماه</th><th>نوبت‌ها</th><th>بسته‌ها</th><th>جمع</th></tr>`;
  if(!keys.length)h+=`<tr><td colspan="4" class="muted">پرداختی ثبت نشده</td></tr>`;
  keys.forEach(k=>{const[y,m]=k.split("-").map(Number);const r=months[k];
    h+=`<tr onclick="UI.monthOpen=UI.monthOpen==='${k}'?null:'${k}';render()" style="cursor:pointer"><td>${faMonth(y,m)}</td><td>${tomans(r.ap)}</td><td>${tomans(r.pk)}</td><td><b>${tomans(r.ap+r.pk)}</b></td></tr>`;
    if(UI.monthOpen===k){const rows=pays.filter(p=>monthKeyOf(p.date)===k);
      h+=`<tr><td colspan="4" style="text-align:right;background:#141810">${rows.map(p=>`<div>▪️ ${faDate(p.date)} — ${escapeHtml(p.name)} — ${p.kind==="package"?"بسته":"نوبت"} — <b>${tomans(p.amount)}</b></div>`).join("")}</td></tr>`}});
  h+=`</table><div class="muted" style="margin-top:8px">درآمد از «بیعانه/پرداختی نوبت‌ها» و «پرداخت بسته‌ها» حساب می‌شود. بیعانه نوبت لغوشده هم جزو دریافتی می‌ماند.</div>`;
  return h}

/* ---------- مخاطبین ---------- */
function vContacts(){let h=`<div class="btnrow"><label class="btn small">📥 ورود فایل VCF<input type="file" id="vcf" accept=".vcf,text/vcard,text/x-vcard" class="hidden" onchange="importVCF(this)"></label><button class="btn small" onclick="pickPhoneContact()">📇 از مخاطبین گوشی</button><button class="btn small" onclick="openContactForm()">+ مخاطب جدید</button><button class="btn small" onclick="exportBackup()">پشتیبان‌گیری</button></div>`;
  h+=`<div class="muted">${faNum(DB.contacts.length)} مخاطب · فقط داخل برنامه ذخیره می‌شوند و وارد دفترچه تلفن گوشی نمی‌شوند</div>`;
  DB.contacts.slice().sort((a,b)=>a.name.localeCompare(b.name,"fa")).slice(0,300).forEach(c=>{h+=`<div class="list-card"><div class="nm">${escapeHtml(c.name)}</div><div class="muted" dir="ltr" style="text-align:right">${escapeHtml(c.phone||"")}</div><div class="btnrow"><button class="btn small" onclick="bookForContact('${c.id}')">ثبت نوبت</button><button class="btn small danger" onclick="contactDel('${c.id}')">حذف</button></div></div>`});
  return h}

/* ---------- فرم‌ها / شیت ---------- */
function openSheet(html){$("#sheetBody").innerHTML=html;$("#sheetBack").classList.add("open");$("#sheet").classList.add("open")}
function closeSheet(){$("#sheetBack").classList.remove("open");$("#sheet").classList.remove("open")}
function escapeHtml(s){return (s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function openForm(p={}){const d=p.date||jalTodayStr();
  openSheet(`<h3>${p.id?"ویرایش نوبت":"نوبت جدید"}</h3><div class="frm">
  <div class="row2"><div><label>تاریخ (جلالی: ۱۴۰۵-۰۹-۰۱)</label><input id="f_date" value="${p.date||d}" dir="ltr" style="text-align:center"></div>
  <div><label>ساعت (۱۲ تا ۲۱)</label><input id="f_time" value="${p.time||"12:00"}" dir="ltr" style="text-align:center"></div></div>
  <label>نام مشتری</label><input id="f_name" value="${escapeHtml(p.name||"")}" oninput="onNameInput(this.value)" autocomplete="off"><div id="sug" class="suggest hidden"></div>
  <div class="row2"><div><label>شماره تماس</label><input id="f_phone" value="${escapeHtml(p.phone||"")}" dir="ltr"><button class="btn small" style="margin-top:6px" onclick="pickPhoneContact()">📇 انتخاب از مخاطبین گوشی</button></div>
  <div><label>بخش</label><select id="f_section"><option value="">—</option><option value="women" ${p.section==="women"?"selected":""}>بانوان</option><option value="men" ${p.section==="men"?"selected":""}>آقایان</option></select></div></div>
  <div class="row2"><div><label>خدمت</label><select id="f_service">${DB.services.map(s=>`<option ${s===(p.service||"")?"selected":""}>${escapeHtml(s)}</option>`).join("")}</select></div>
  <div><label>تراپیست</label><select id="f_th">${DB.therapists.map(s=>`<option ${s===(p.therapist||"")?"selected":""}>${escapeHtml(s)}</option>`).join("")}</select></div></div>
  <div class="row2"><div><label>مبلغ (تومان)</label><input id="f_price" inputmode="numeric" value="${p.price||""}"></div>
  <div><label>بیعانه (تومان)</label><input id="f_deposit" inputmode="numeric" value="${p.deposit||""}"></div></div>
  <div class="row2"><div><label>گروه</label><select id="f_group">${DB.groups.map(s=>`<option ${s===(p.group||"")?"selected":""}>${escapeHtml(s)}</option>`).join("")}</select></div>
  <div><label>یادداشت</label><input id="f_note" value="${escapeHtml(p.note||"")}"></div></div>
  <div class="btnrow"><button class="btn primary" onclick="saveForm('${p.id||""}')">ذخیره</button><button class="btn" onclick="closeSheet()">انصراف</button></div></div>`);
  setTimeout(()=>{const el=$("#f_name");if(el&&!p.name)el.focus()},300)}
function onNameInput(v){const box=$("#sug");const r=suggest(v);if(!r.length){box.classList.add("hidden");box.innerHTML="";return}
  box.classList.remove("hidden");box.innerHTML=r.map((x,i)=>`<div onclick="pickSug(${i})">${escapeHtml(x.name)} <span class="muted">${escapeHtml(x.phone||"")}</span></div>`).join("");
  box._data=r}
function pickSug(i){const x=$("#sug")._data[i];if(!x)return;$("#f_name").value=x.name;if(x.phone)$("#f_phone").value=x.phone;
  if(x.service){const s=$("#f_service");if([...s.options].some(o=>o.value===x.service))s.value=x.service}
  if(x.therapist){const s=$("#f_th");if([...s.options].some(o=>o.value===x.therapist))s.value=x.therapist}
  $("#sug").classList.add("hidden")}
function readForm(){return{date:$("#f_date").value.trim(),time:$("#f_time").value.trim(),name:$("#f_name").value.trim(),phone:$("#f_phone").value.trim(),section:$("#f_section").value,service:$("#f_service").value,therapist:$("#f_th").value,price:+($("#f_price").value.replace(/[^0-9]/g,""))||0,deposit:+($("#f_deposit").value.replace(/[^0-9]/g,""))||0,group:$("#f_group").value,note:$("#f_note").value.trim()}}
function saveForm(id){const f=readForm();if(!f.name){alert("نام مشتری را بنویسید");return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(f.date)){alert("تاریخ را مثل ۱۴۰۵-۰۹-۰۱ یا 1405-09-01 بنویسید");return}
  f.date=f.date.replace(/[۰-۹]/g,c=>"۰۱۲۳۴۵۶۷۸۹".indexOf(c));
  if(id){const a=DB.appointments.find(x=>x.id===id);const oldDep=+a.deposit||0;
    Object.assign(a,f,{updatedAt:Date.now()});upsertContact(f.name,f.phone,f.group);
    if(f.deposit!==oldDep)addPay({date:jalTodayStr(),name:f.name,kind:"appointment",amount:f.deposit-oldDep,note:"اصلاح بیعانه"});
    if(conflict(a,id))alert("⚠️ این ساعت با نوبت دیگر همین تراپیست تداخل دارد.");
  }else{const a=Object.assign({id:uid(),status:"active",createdAt:Date.now(),updatedAt:Date.now()},f);
    if(conflict(a))if(!confirm("⚠️ تداخل ساعت با همین تراپیست. باز هم ثبت شود؟"))return;
    DB.appointments.push(a);upsertContact(f.name,f.phone,f.group);
    if(f.deposit>0)addPay({date:jalTodayStr(),name:f.name,kind:"appointment",amount:f.deposit,note:"بیعانه"});
  }
  save();closeSheet();render()}
function addPay(p){DB.payments.push(Object.assign({id:uid()},p))}
function upsertContact(name,phone,group){const k=norm(name);if(!k)return;const ex=DB.contacts.find(c=>norm(c.name)===k);
  if(!ex){DB.contacts.push({id:uid(),name:name,phone:phone||"",group:group||""});return true}
  let ch=false;if(phone&&ex.phone!==phone){ex.phone=phone;ch=true}if(group&&!ex.group){ex.group=group;ch=true}return ch}

/* جزئیات */
function openDetail(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;UI.detailId=id;
  const sec=a.section==="women"?"بانوان":a.section==="men"?"آقایان":"—";
  const st=a.status==="done"?"✅ انجام شد":a.status==="cancelled"?"⛔ لغو شد":"🕐 فعال";
  openSheet(`<h3>${escapeHtml(a.name)} <span class="muted">${st}</span></h3>
  <div>${faDate(a.date)} · ساعت ${faNum(a.time)} · ${sec}</div>
  <div class="muted">${escapeHtml(a.service||"")} · ${escapeHtml(a.therapist||"")} · گروه ${escapeHtml(a.group||"")}</div>
  <div class="muted" dir="ltr" style="text-align:right">${escapeHtml(a.phone||"")}</div>
  <div>مبلغ ${tomans(a.price)} · بیعانه ${tomans(a.deposit)} · مانده ${tomans((+a.price||0)-(+a.deposit||0))}</div>
  ${pkgLine(a)}
  ${a.note?`<div class="cfg">📝 ${escapeHtml(a.note)}</div>`:""}${a.movedFrom?`<div class="muted">جابجا شد · قبلاً: ${faDate(a.movedFrom.date)} ساعت ${faNum(a.movedFrom.time)}</div>`:""}
  <div class="btnrow"><button class="btn small" onclick="remind('${a.id}')">یادآوری</button><button class="btn small" onclick="quickDone('${a.id}')">انجام شد</button><button class="btn small" onclick="moveForm('${a.id}')">جابجایی</button></div>
  <div class="btnrow"><button class="btn small" onclick="editDetail()">ویرایش</button><button class="btn small" onclick="settle('${a.id}')">تسویه کامل</button><button class="btn small" onclick="cancelAppt('${a.id}')">لغو</button><button class="btn small danger" onclick="delAppt('${a.id}',this)">حذف</button></div>
  <div class="btnrow"><button class="btn" onclick="closeSheet()">بستن ✕</button></div>`)}
function editDetail(){const a=DB.appointments.find(x=>x.id===UI.detailId);if(!a)return;openForm(Object.assign({id:a.id},a))}
function pkgRemain(p){return (p.total||0)-(p.used||0)}
function pkgMatches(name){const k=norm(name);return DB.packages.filter(p=>norm(p.buyer)===k&&pkgRemain(p)>0)}
function quickDone(id){const a=DB.appointments.find(x=>x.id===id);if(!a||a.status==="done")return;
  if(a.pkgId){a.status="done";a.updatedAt=Date.now();save();closeSheet();render();return}
  const ms=pkgMatches(a.name);
  if(ms.length===1){consumePkg(a,ms[0]);return}
  if(ms.length>1){openSheet(`<h3>کسر از کدام بسته؟ (${escapeHtml(a.name)})</h3>`+ms.map(p=>`<div class="list-card"><b>${escapeHtml(p.buyer)}</b> — مانده ${faNum(pkgRemain(p))} جلسه از ${faNum(p.total)}<div class="btnrow"><button class="btn small primary" onclick="consumePkgBy('${a.id}','${p.id}')">کسر از این بسته</button></div></div>`).join("")+`<div class="btnrow"><button class="btn small" onclick="doneNoPkg('${a.id}')">بدون بسته، فقط انجام شد</button><button class="btn" onclick="openDetail('${a.id}')">بازگشت</button></div>`);return}
  doneNoPkg(id)}
function consumePkgBy(aid,pid){const a=DB.appointments.find(x=>x.id===aid),p=DB.packages.find(x=>x.id===pid);if(!a||!p)return;consumePkg(a,p)}
function consumePkg(a,p){if(pkgRemain(p)<=0){doneNoPkg(a.id);return}p.used=(p.used||0)+1;a.pkgId=p.id;a.status="done";a.updatedAt=Date.now();save();closeSheet();render();toast(`انجام شد ✓ · ${faNum(pkgRemain(p))} جلسه از بسته باقی ماند`)}
function doneNoPkg(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;a.status="done";a.updatedAt=Date.now();save();closeSheet();render();
  const tot=pkgMatches(a.name).reduce((s,p)=>s+pkgRemain(p),0);
  toast(tot?`انجام شد ✓ · ${faNum(tot)} جلسه در بسته‌اش مانده`:`انجام شد ✓ (بسته‌ای برای این مشتری نیست)`)}
function refundPkg(a){if(a&&a.pkgId){const p=DB.packages.find(x=>x.id===a.pkgId);if(p)p.used=Math.max(0,(p.used||0)-1);a.pkgId=null}}
function cancelAppt(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;if(a.status==="done")refundPkg(a);a.status="cancelled";a.updatedAt=Date.now();save();closeSheet();render();toast("لغو شد",a)}
function settle(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;const rest=(+a.price||0)-(+a.deposit||0);if(rest<=0){alert("مانده‌ای نیست");return}
  a.deposit=+a.price||0;a.updatedAt=Date.now();addPay({date:jalTodayStr(),name:a.name,kind:"appointment",amount:rest,note:"تسویه کامل"});save();closeSheet();render()}
let lastUndo=null,undoTimer=null;
function delAppt(id,btn){if(btn&&btn.dataset.arm!=="1"){btn.dataset.arm="1";btn.textContent="حذف قطعی؟";return}
  const i=DB.appointments.findIndex(x=>x.id===id);if(i<0)return;refundPkg(DB.appointments[i]);lastUndo=DB.appointments[i];DB.appointments.splice(i,1);save();closeSheet();render();toast("حذف شد",lastUndo)}
function toast(msg,item){const t=$("#undo");t.querySelector("span").textContent=msg;if(item!==undefined)lastUndo=item;t.classList.add("show");clearTimeout(undoTimer);undoTimer=setTimeout(()=>t.classList.remove("show"),8000)}
function undoBack(){if(lastUndo&&!DB.appointments.some(a=>a.id===lastUndo.id)){DB.appointments.push(lastUndo);save();render()}$("#undo").classList.remove("show")}
function pkgLine(a){if(a.pkgId){const p=DB.packages.find(x=>x.id===a.pkgId);return `<div>🎫 از بسته کسر شد ✓${p?` · مانده بسته: ${faNum(pkgRemain(p))} جلسه`:""}</div>`}
  const ms=pkgMatches(a.name);if(!ms.length)return `<div class="muted">🎫 بسته‌ای برای این مشتری ثبت نشده</div>`;
  const tot=ms.reduce((s,p)=>s+pkgRemain(p),0);return `<div>🎫 بسته: <b>${faNum(tot)} جلسه مانده</b></div>`}
function moveForm(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  openSheet(`<h3>جابجایی ${escapeHtml(a.name)}</h3><div class="frm"><label>تاریخ جدید</label><input id="m_date" value="${a.date}" dir="ltr" style="text-align:center"><label>ساعت جدید</label><input id="m_time" value="${a.time}" dir="ltr" style="text-align:center">
  <div class="btnrow"><button class="btn primary" onclick="doMove('${id}')">ذخیره جابجایی</button><button class="btn" onclick="openDetail('${id}')">بازگشت</button></div></div>`)}
function doMove(id){const a=DB.appointments.find(x=>x.id===id);const nd=$("#m_date").value.trim(),nt=$("#m_time").value.trim();
  a.movedFrom={date:a.date,time:a.time};a.date=nd;a.time=nt;a.reminded=false;a.status="active";a.updatedAt=Date.now();save();closeSheet();render();
  if(confirm("نوبت منتقل شد. پیام واتساپ/پیامک آماده ارسال شود؟"))remind(id)}
function copyRemind(){try{navigator.clipboard.writeText(window._remindTxt||"")}catch(e){}alert("کپی شد")}
function remind(id){const a=DB.appointments.find(x=>x.id===id);if(!a)return;
  const txt=`سلام ${a.name} عزیز 🌸 نوبت ${a.service||"ماساژ"} شما: ${faDate(a.date)} ساعت ${a.time} — فرا ماساژ. لطفاً به‌موقع تشریف بیاورید.`;
  a.reminded=true;save();
  window._remindTxt=txt;
  const wa="https://wa.me/"+(a.phone||"").replace(/[^0-9]/g,"")+"?text="+encodeURIComponent(txt);
  openSheet(`<h3>یادآوری به ${escapeHtml(a.name)}</h3><div class="cfg">${escapeHtml(txt)}</div>
  <div class="btnrow">${a.phone?`<a class="btn primary" style="text-decoration:none;text-align:center" href="${wa}" target="_blank">ارسال واتساپ</a><a class="btn" style="text-decoration:none;text-align:center" href="sms:${a.phone}?body=${encodeURIComponent(txt)}">پیامک</a>`:`<div class="muted">شماره‌ای ثبت نشده؛ متن را کپی کنید.</div>`}<button class="btn" onclick="copyRemind()">کپی متن</button></div>
  <div class="btnrow"><button class="btn" onclick="openDetail('${id}')">بازگشت</button></div>`)}

/* بسته‌ها */
function openPackForm(){openSheet(`<h3>فروش بسته جلسات</h3><div class="frm"><label>نام خریدار</label><input id="p_name" oninput="onNameInput2(this.value)" autocomplete="off"><div id="sug2" class="suggest hidden"></div>
  <div class="row2"><div><label>شماره</label><input id="p_phone" dir="ltr"></div><div><label>تعداد جلسات</label><input id="p_total" inputmode="numeric" value="10"></div></div>
  <label>مبلغ پرداختی (تومان)</label><input id="p_paid" inputmode="numeric"><div class="btnrow"><button class="btn primary" onclick="savePack()">ذخیره</button><button class="btn" onclick="closeSheet()">انصراف</button></div></div>`)}
function onNameInput2(v){const box=$("#sug2");const r=suggest(v);if(!r.length){box.classList.add("hidden");return}box._data=r;box.classList.remove("hidden");box.innerHTML=r.map((x,i)=>`<div onclick="(function(){const x=$('#sug2')._data[${i}];$('#p_name').value=x.name;$('#p_phone').value=x.phone||'';$('#sug2').classList.add('hidden')})()">${escapeHtml(x.name)}</div>`).join("")}
function savePack(){const name=$("#p_name").value.trim();if(!name){alert("نام را بنویسید");return}
  const p={id:uid(),buyer:name,phone:$("#p_phone").value.trim(),total:+$("#p_total").value||0,used:0,paid:+$("#p_paid").value.replace(/[^0-9]/g,"")||0,date:jalTodayStr()};
  DB.packages.push(p);upsertContact(name,p.phone,"");if(p.paid>0)addPay({date:p.date,name,kind:"package",amount:p.paid,note:"خرید بسته"});save();closeSheet();render()}
function packUse(id){const p=DB.packages.find(x=>x.id===id);if((p.used||0)>=p.total){alert("جلسه‌ای نمانده");return}p.used=(p.used||0)+1;save();render()}
function packDel(id){if(!confirm("بسته حذف شود؟"))return;DB.packages=DB.packages.filter(x=>x.id!==id);save();render()}

/* مخاطب / خدمات */
function bookForContact(id){const c=DB.contacts.find(x=>x.id===id);if(!c)return;openForm({name:c.name,phone:c.phone||""})}
function openContactForm(){openSheet(`<h3>مخاطب جدید</h3><div class="frm"><div class="btnrow"><button class="btn small" onclick="pickPhoneContact()">📇 انتخاب از مخاطبین گوشی</button></div><label>نام</label><input id="c_name"><label>شماره</label><input id="c_phone" dir="ltr"><div class="btnrow"><button class="btn primary" onclick="(function(){const n=$('#c_name').value.trim();if(!n)return alert('نام لازم است');upsertContact(n,$('#c_phone').value.trim(),'');save();closeSheet();render()})()">ذخیره</button><button class="btn" onclick="closeSheet()">انصراف</button></div></div>`)}
function contactDel(id){if(!confirm("حذف شود؟"))return;DB.contacts=DB.contacts.filter(c=>c.id!==id);save();render()}
function importVCF(input){const f=input.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{const txt=String(r.result||"");const cards=txt.split(/BEGIN:VCARD/i).slice(1);let n=0;
    cards.forEach(c=>{let name="";const fn=c.match(/FN[^:]*:(.+)/);if(fn)name=fn[1].trim();
      if(!name){const nn=c.match(/N[^:]*:(.+)/);if(nn){const parts=nn[1].split(";");name=(parts[1]+" "+parts[0]).trim()}}
      try{name=name.replace(/=([0-9A-F]{2})/gi,(m,h)=>String.fromCharCode(parseInt(h,16)))}catch(e){}
      const tel=(c.match(/TEL[^:]*:(.+)/)||[])[1]||"";
      if(name){const k=norm(name);if(!DB.contacts.some(x=>norm(x.name)===k)){DB.contacts.push({id:uid(),name:name.replace(/;/g," ").trim(),phone:tel.replace(/[^\d+]/g,""),group:""});n++}}});
    save();render();alert(n?faNum(n)+" مخاطب اضافه شد":"مخاطبی در فایل پیدا نشد")};r.readAsText(f)}
function openLists(kind){const arr=kind==="services"?DB.services:kind==="therapists"?DB.therapists:DB.groups;
  const title=kind==="services"?"خدمات":kind==="therapists"?"تراپیست‌ها":"گروه‌ها";
  openSheet(`<h3>${title}</h3>${arr.map((s,i)=>`<div class="list-card"><b>${escapeHtml(s)}</b><div class="btnrow"><button class="btn small danger" onclick="listDel('${kind}',${i})">حذف</button></div></div>`).join("")}
  <div class="frm"><label>مورد جدید</label><input id="nl_v"><div class="btnrow"><button class="btn primary" onclick="listAdd('${kind}')">افزودن</button><button class="btn" onclick="closeSheet()">بستن</button></div></div>`)}
function listAdd(kind){const v=$("#nl_v").value.trim();if(!v)return;DB[{services:"services",therapists:"therapists",groups:"groups"}[kind]].push(v);save();openLists(kind);render()}
function listDel(kind,i){DB[{services:"services",therapists:"therapists",groups:"groups"}[kind]].splice(i,1);save();openLists(kind);render()}

/* جست‌وجو و فیلتر */
function onSearch(v){UI.search=v;if(UI.tab!=="all"&&v)setTab("all");else render()}

/* شروع */
window.addEventListener("DOMContentLoaded",()=>{load();render();
  const g=$("#groupFilter");g.innerHTML=`<option value="all">همه گروه‌ها</option>`+DB.groups.map(x=>`<option>${escapeHtml(x)}</option>`).join("");
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}});
