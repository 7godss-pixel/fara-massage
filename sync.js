/* همگام‌سازی: محلی + دستی + ابری (Firebase) */
"use strict";
window.FARA_SYNC={pushTimer:null,
pushSoon(){clearTimeout(this.pushTimer);this.pushTimer=setTimeout(()=>this.pushCloud(),2500)},
pushMqtt(){try{if(window._mqttPush)window._mqttPush()}catch(e){}},
async pushCloud(){try{this.pushMqtt();if(!window._fdb||!DB.settings.salonCode)return;const code=DB.settings.salonCode.trim();if(!code)return;
  const snap={appointments:DB.appointments,contacts:DB.contacts,packages:DB.packages,services:DB.services,therapists:DB.therapists,groups:DB.groups,payments:DB.payments,updatedAt:Date.now()};
  await window._fdb.collection("rooms").doc(code).set(snap,{merge:true});window._lastPush=Date.now();badge("shared")}catch(e){console.warn(e)}}};

const FIREBASE_BUILTIN = null; // اگر سازنده داخل برنامه گذاشته باشد، گوشی‌ها خودکار وصل می‌شوند و نیازی به چسباندن تنظیمات نیست

function updateSyncBadge(){try{mqttStatus()}catch(e){}}

function badge(){updateSyncBadge()}

/* --- بکاپ --- */
function exportBackup(){const blob=new Blob([JSON.stringify(DB)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="fara-backup.json";a.click();
  const code=btoa(unescape(encodeURIComponent(JSON.stringify(DB)))); 
  openSheet(`<h3>پشتیبان‌گیری</h3><div class="muted">فایل دانلود شد. این «کد انتقال» را هم می‌توانید در گوشی دیگر وارد کنید:</div>
  <div class="frm"><label>کد انتقال (کپی کنید)</label><textarea id="bk_code" rows="4" readonly>${code.slice(0,4000)}</textarea>
  <div class="btnrow"><button class="btn" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById('bk_code').value);alert('کپی شد')">کپی</button><button class="btn" onclick="closeSheet()">بستن</button></div>
  <label>بازیابی از فایل یا کد</label><input type="file" id="rs_file" accept=".json"><textarea id="rs_code" rows="3" placeholder="کد انتقال را اینجا بچسبانید"></textarea>
  <div class="btnrow"><button class="btn primary" onclick="restoreBackup()">بازیابی (جایگزینی)</button><button class="btn" onclick="mergeBackup()">ادغام با این گوشی</button></div>
  <div class="muted">«ادغام» برای یکی کردن مخاطبین و نوبت‌های دو گوشی است (تکراری اضافه نمی‌شود). مخاطبین همیشه فقط داخل برنامه می‌مانند و وارد دفترچه تلفن گوشی نمی‌شوند.</div></div>`)}
function readBackupInput(cb){const f=document.getElementById("rs_file");const code=(document.getElementById("rs_code").value||"").trim();
  if(code){try{cb(JSON.parse(decodeURIComponent(escape(atob(code)))))}catch(e){alert("کد معتبر نیست")}return}
  if(f&&f.files[0]){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);cb(d)}catch(e){alert("فایل معتبر نیست")}};r.readAsText(f.files[0])}else alert("فایل یا کد را وارد کنید")}
function restoreBackup(){readBackupInput(d=>{try{if(!d||!d.appointments)throw 0;DB=Object.assign(DB,d);save();closeSheet();render();location.reload()}catch(e){alert("فایل/کد معتبر نیست")}})}
function mergeBackup(){readBackupInput(d=>{try{if(!d||!d.appointments)throw 0;if(!mergeBackupObject(d))throw 0;save();closeSheet();render();alert("ادغام شد ✓ مخاطبین و نوبت‌های هر دو گوشی یکی شد (تکراری‌ها حذف شدند)")}catch(e){alert("فایل/کد معتبر نیست")}})}

/* --- تنظیمات همگام‌سازی ابری --- */
function openSync(){openSheet(`<h3>همگام‌سازی دو گوشی (خودکار)</h3>
  <div class="cfg">کافی است در <b>هر دو گوشی</b> یک «کد سالن» یکسان وارد کنید (مثلاً <b dir="ltr">fara-7392</b>). همین! از آن به بعد هر نوبتی در یک گوشی ثبت شود، چند ثانیه بعد در گوشی دیگر می‌آید. نیازی به حساب، پروژه و چسباندن تنظیمات نیست.<br>نکته: کد سالن مثل رمز است؛ آن را به کسی ندهید و یک کد حدس‌زدنی مثل 123 نگذارید.</div>
  <div class="frm"><label>کد سالن مشترک</label><input id="s_code" value="${(DB.settings.salonCode||"").replace(/"/g,"")}" dir="ltr" style="text-align:center" placeholder="fara-7392">
  <div class="btnrow"><button class="btn primary" onclick="saveSalonAndReconnect()">ذخیره و اتصال خودکار</button></div></div>
  <div class="cfg">برای <b>همگام‌سازی کاملاً خودکار و زنده</b> (ثبت در یک گوشی = ظاهر شدن در گوشی دیگر) باید یک پروژه رایگان Firebase بسازید (۵ دقیقه‌ای). راهنمای قدم‌به‌قدم در فایل «راهنما» هست. بعد کانفیگ را اینجا بچسبانید:</div>
  <div class="frm"><label>Firebase config (JSON)</label><textarea id="s_cfg" rows="4" dir="ltr" placeholder='{"apiKey":"...","authDomain":"...","projectId":"..."}'></textarea>
  <div class="btnrow"><button class="btn" onclick="saveFirebase()">اتصال ابری</button><button class="btn" onclick="closeSheet()">بستن</button></div></div>
  <div class="muted" id="syncState"></div>`)}
function saveSalon(){DB.settings.salonCode=document.getElementById("s_code").value.trim();save();closeSheet();render();alert("کد سالن ذخیره شد. همین کد را در گوشی دوم هم وارد کنید.")}
function saveFirebase(){try{const cfg=JSON.parse(document.getElementById("s_cfg").value);localStorage.setItem("fara_fb",JSON.stringify(cfg));initFirebase(cfg);alert("اتصال ابری فعال شد ✓")}catch(e){alert("JSON معتبر نیست")}}
function initFirebase(cfg){if(!cfg||!cfg.apiKey)return;
  const load=(src)=>new Promise((res,rej)=>{const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)});
  (async()=>{try{
    if(!window.firebase){await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js");await load("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js");
      firebase.initializeApp(cfg)}
    await firebase.auth().signInAnonymously();
    window._fdb=firebase.firestore();
    const code=()=> (DB.settings.salonCode||"").trim();if(!code){updateSyncBadge();return}
    window._fdb.collection("rooms").doc(code()).onSnapshot(doc=>{if(!doc.exists)return;const d=doc.data();if(!d||!d.updatedAt)return;
      if(window._lastPush&&d.updatedAt<window._lastPush)return;
      try{mergeCloud(d);localStorage.setItem(DB_KEY,JSON.stringify(DB))}catch(e){}render()});
    updateSyncBadge();
    try{if(window._autoRef)clearInterval(window._autoRef);window._autoRef=setInterval(()=>{if(document.visibilityState==="visible")manualRefresh(true)},45000)}catch(e){}
  }catch(e){console.warn("firebase fail",e);const el=document.getElementById("syncBadge");if(el){el.className="sync-bad";el.textContent="اتصال ابری ناموفق — ذخیره محلی فعال"}}})();
}
(function(){try{const cfg=FIREBASE_BUILTIN||JSON.parse(localStorage.getItem("fara_fb")||"null");if(cfg&&cfg.apiKey)initFirebase(cfg)}catch(e){}})();

/* --- اسکن دفتر با دوربین (تشخیص دقیق فارسی + دست‌خط) --- */
function faDigits(s){return (s||"").replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]).replace(/[٠-٩]/g,d=>"۰۱۲۳۴۵۶۷۸۹"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])}
function enDigits(s){return (s||"").replace(/[۰-۹]/g,d=>"۰۱۲۳۴۵۶۷۸۹".indexOf(d)).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d))}
function normOCR(s){return (s||"").replace(/[يى]/g,"ی").replace(/ك/g,"ک").replace(/\s+/g," ").trim()}
async function prepImage(file){
  const bmp=await createImageBitmap(file);
  const longSide=Math.max(bmp.width,bmp.height);
  const scale=longSide<2000?Math.min(2.2,2200/longSide):1;
  const w=Math.round(bmp.width*scale),h=Math.round(bmp.height*scale);
  const c=document.createElement("canvas");c.width=w;c.height=h;
  const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(bmp,0,0,w,h);
  const d=x.getImageData(0,0,w,h),p=d.data;
  for(let i=0;i<p.length;i+=4){const g=0.299*p[i]+0.587*p[i+1]+0.114*p[i+2];let v=(g-130)*1.7+155;v=v<0?0:v>255?255:v;p[i]=p[i+1]=p[i+2]=v}
  x.putImageData(d,0,0);
  // شارپ ملایم برای خط خودکار
  try{const d2=x.getImageData(0,0,w,h),s2=d2.data.slice(),o=d2.data;
  for(let yy=1;yy<h-1;yy++)for(let xx=1;xx<w-1;xx++){const k=(yy*w+xx)*4;
    for(let ch=0;ch<3;ch++){let v=s2[k+ch]*1.6-(s2[k-4+ch]+s2[k+4+ch]+s2[k-w*4+ch]+s2[k+w*4+ch])*0.15;v=v<0?0:v>255?255:v;o[k+ch]=v}}
  x.putImageData(d2,0,0)}catch(e){}
  window._scanCanvas=c;
  return c.toDataURL("image/jpeg",0.92)}
function parseScanLine(line){
  line=normOCR(line);const en=enDigits(line);
  let sec="";if(/خانم|بانو|خانوم/.test(line))sec="women";else if(/(^|\s)آقا|آقای/.test(line))sec="men";
  let tm=(en.match(/([01]?\d|2[0-3])\s*[:٫.،\-/]\s*([0-5]\d)/)||[]);let time=tm[1]?tm[1].padStart(2,"0")+":"+tm[2]:"";
  if(!time){const h=en.match(/ساعت\s*([01]?\d|2[0-3])/);if(h)time=h[1].padStart(2,"0")+":00"}
  let ph=(en.match(/09\d{9}/)||[])[0]||"";
  let nm=line.replace(/09[\d۰-۹٠-٩]{9}/g," ").replace(/([01]?\d|2[0-3])\s*[:٫.،\-/]\s*([0-5]\d)/g," ").replace(/ساعت\s*[\d۰-۹٠-٩]+/g," ").replace(/خانم|بانو|خانوم|آقای|آقا/g," ").replace(/[۰-۹٠-٩0-9_\-()[\]:.,|/]+/g," ").replace(/\s+/g," ").trim();
  if(nm.length>30)nm=nm.slice(0,30);
  return{name:nm,time:time,phone:ph,section:sec,raw:line}}
function stripImg(bbox){
  try{const c=window._scanCanvas;if(!c||!bbox)return "";
    const pad=12;const x0=Math.max(0,bbox.x0-pad),y0=Math.max(0,bbox.y0-pad);
    const x1=Math.min(c.width,bbox.x1+pad),y1=Math.min(c.height,bbox.y1+pad);
    const t=document.createElement("canvas");t.width=x1-x0;t.height=y1-y0;
    t.getContext("2d").drawImage(c,x0,y0,x1-x0,y1-y0,0,0,t.width,t.height);
    return t.toDataURL("image/jpeg",0.85)}catch(e){return ""}}
function openScan(){
  const days=[0,1,2,3,4,5,6].map(i=>{const ds=addDaysJal(saturdayOf(jalTodayStr()),i);return `<option value="${ds}">${faDate(ds)}</option>`}).join("");
  openSheet(`<h3>📷 اسکن دفتر</h3><div class="muted">از صفحه دفتر عکس بگیرید؛ هر سطر با عکس بزرگ‌شده‌اش نشان داده می‌شود تا دست‌خط را خودتان سریع چک و اصلاح کنید. (اولین بار اینترنت لازم است)</div>
  <div class="frm"><label>روز صفحه دفتر</label><select id="sc_day">${days}</select>
  <div class="muted" style="margin-top:6px">نکته برای دست‌خط: نور کافی، عکس از نزدیک و صاف. برای خط ریز، نصف صفحه را یکجا بگیرید.</div>
  <label>عکس صفحه</label><input type="file" id="sc_file" accept="image/*" capture="environment">
  <img id="sc_prev" class="preview hidden"><div id="sc_prog" class="muted"></div><div id="sc_out"></div>
  <div class="btnrow"><button class="btn primary" onclick="doOCR()">خواندن صفحه</button><button class="btn" onclick="closeSheet()">بستن</button></div></div>`)}
async function doOCR(){
  const f=document.getElementById("sc_file").files[0];if(!f)return alert("اول عکس بگیرید");
  const out=document.getElementById("sc_out"),prog=document.getElementById("sc_prog");
  const ds=document.getElementById("sc_day").value;
  out.innerHTML="";prog.textContent="آماده‌سازی عکس…";
  document.getElementById("sc_prev").src=URL.createObjectURL(f);document.getElementById("sc_prev").classList.remove("hidden");
  try{
    if(!window.Tesseract){prog.textContent="دانلود موتور فارسی‌خوان… (بار اول)";await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
    prog.textContent="آماده‌سازی عکس برای دست‌خط…";
    const imgUrl=await prepImage(f);
    const worker=await Tesseract.createWorker("fas",Tesseract.OEM.LSTM,{logger:m=>{if(m.status==="recognizing text")prog.textContent="در حال خواندن فارسی… "+faNum(Math.round((m.progress||0)*100))+"٪"}});
    try{await worker.setParameters({tessedit_pageseg_mode:"6",preserve_interword_spaces:"1"})}catch(e){}
    const r=await worker.recognize(imgUrl);await worker.terminate();
    const tlines=(r.data&&r.data.lines)||[];
    let rows=tlines.map((ln,i)=>{const p=parseScanLine(ln.text||"");p.idx=i;p.img=stripImg(ln.bbox);return p}).filter(p=>p.name||p.time||p.phone);
    if(!rows.length){
      const text=(r.data.text||"");const lines=text.split("\n").map(s=>s.trim()).filter(s=>s.length>1).slice(0,25);
      if(!lines.length){prog.textContent="";out.innerHTML="<div class='cfg'>چیزی خوانده نشد — نور بهتر، عکس نزدیک‌تر و صاف بگیرید و دوباره امتحان کنید.</div>";return}
      rows=lines.map((ln,i)=>{const p=parseScanLine(ln);p.idx=i;p.img="";return p}).filter(p=>p.name||p.time||p.phone)}
    if(!rows.length){prog.textContent="";out.innerHTML="<div class='cfg'>متن خوانده شد ولی سطر قابل‌تبدیل پیدا نشد. دستی وارد کنید.</div>";return}
    prog.textContent="";window._scanRows=rows;window._scanDate=ds;
    let h=`<div class="muted">${faNum(rows.length)} سطر پیدا شد — عکس هر سطر را ببینید، اصلاح کنید و تیک بزنید، بعد «افزودن»:</div>`;
    rows.forEach((p,i)=>{
      const dup=p.name&&p.time&&DB.appointments.some(a=>a.date===ds&&a.time===p.time&&norm(a.name)===norm(p.name));
      const need=!p.name||!p.time;
      h+=`<div class="scanrow">${p.img?`<img src="${p.img}" class="preview" style="max-height:64px">`:""}
      <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="sc_c${i}" ${dup?"":"checked"} style="width:22px;height:22px"><b>${escapeHtml(p.name||"(بدون نام)")}</b>${dup?" <span class='badge'>تکراری</span>":""}${need?" <span class='badge'>نیاز به بررسی</span>":""}</label>
      <div class="frm"><div class="row2"><div><input id="sc_n${i}" value="${escapeHtml(p.name)}" placeholder="نام"></div><div><input id="sc_t${i}" value="${escapeHtml(p.time||"12:00")}" dir="ltr" style="text-align:center" placeholder="14:00"></div></div>
      <div class="row2"><div><input id="sc_p${i}" value="${escapeHtml(p.phone)}" dir="ltr" placeholder="شماره (اختیاری)"></div><div><select id="sc_s${i}"><option value="">بخش؟</option><option value="women" ${p.section==="women"?"selected":""}>بانوان</option><option value="men" ${p.section==="men"?"selected":""}>آقایان</option></select></div></div></div></div>`});
    h+=`<div class="btnrow"><button class="btn small" onclick="scanAddRow()">+ سطر دستی</button><button class="btn primary" onclick="scanAddSelected()">افزودن انتخاب‌شده‌ها (${faDate(ds)})</button></div><div id="sc_manual"></div>`;
    out.innerHTML=h;
  }catch(e){prog.textContent="";out.innerHTML="<div class='cfg'>خواندن خودکار ممکن نشد. از روی عکس، دستی «نوبت جدید» ثبت کنید.</div>"}}
function scanAddRow(){
  const i=(window._scanRows||[]).length;
  (window._scanRows=window._scanRows||[]).push({idx:i,name:"",time:"12:00",phone:"",section:"",img:"",manual:true});
  const d=document.createElement("div");d.className="scanrow";
  d.innerHTML=`<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="sc_c${i}" checked style="width:22px;height:22px"><b>سطر دستی</b></label>
  <div class="frm"><div class="row2"><div><input id="sc_n${i}" placeholder="نام"></div><div><input id="sc_t${i}" value="12:00" dir="ltr" style="text-align:center"></div></div>
  <div class="row2"><div><input id="sc_p${i}" dir="ltr" placeholder="شماره (اختیاری)"></div><div><select id="sc_s${i}"><option value="">بخش؟</option><option value="women">بانوان</option><option value="men">آقایان</option></select></div></div></div>`;
  document.getElementById("sc_out").appendChild(d)}
function scanAddSelected(){
  const ds=window._scanDate||jalTodayStr();let n=0;
  (window._scanRows||[]).forEach((p,i)=>{const cb=document.getElementById("sc_c"+i);if(!cb||!cb.checked)return;
    const nm=(document.getElementById("sc_n"+i).value||"").trim();if(!nm)return;
    let tm=(document.getElementById("sc_t"+i).value||"12:00").trim();tm=enDigits(tm).replace(/[^0-9:]/g,"");if(!/\d{1,2}:\d{2}/.test(tm))tm="12:00";
    const ph=(document.getElementById("sc_p"+i).value||"").trim().replace(/[^0-9+]/g,"");
    const sc=(document.getElementById("sc_s"+i)||{value:""}).value||"";
    DB.appointments.push({id:uid(),date:ds,time:tm,name:nm,phone:ph,section:sc,service:DB.services[0]||"",therapist:DB.therapists[0]||"",price:0,deposit:0,group:DB.groups[0]||"",note:"از اسکن دفتر",status:"active",createdAt:Date.now(),updatedAt:Date.now()});
    upsertContact(nm,ph,DB.groups[0]||"");n++});
  if(!n)return alert("هیچ سطری انتخاب نشده");
  save();closeSheet();UI.weekOffset=0;render();alert(faNum(n)+" نوبت اضافه شد — حتماً ساعت‌ها و نام‌ها را با دفتر چک کنید")}
/* --- انتخاب از مخاطبین خود گوشی (فقط خواندن؛ چیزی وارد گوشی نمی‌شود) --- */
function phoneContactsOK(){try{return !!("contacts" in navigator&&navigator.contacts&&navigator.contacts.select)}catch(e){return false}}
async function pickPhoneContact(){
  try{
    if(!phoneContactsOK()){alert("انتخاب مستقیم فقط روی گوشی اندروید با مرورگر Chrome کار می‌کند.\nروی آیفون از «مخاطبین ← ورود فایل VCF» استفاده کنید.\nمخاطبین همیشه فقط داخل برنامه می‌مانند و وارد دفترچه گوشی نمی‌شوند.");return}
    const res=await navigator.contacts.select(["name","tel"],{multiple:false});
    if(res&&res[0]){const c=res[0];const nm=(c.name&&c.name[0])||"";const tl=(c.tel&&c.tel[0])||"";
      const nEl=document.getElementById("f_name"),pEl=document.getElementById("f_phone");
      if(nEl&&nm){nEl.value=nm;try{onNameInput(nm)}catch(e){}}
      if(pEl&&tl)pEl.value=String(tl).replace(/[^0-9+]/g,"");
      const cEl=document.getElementById("c_name"),cpEl=document.getElementById("c_phone");
      if(cEl&&nm)cEl.value=nm;if(cpEl&&tl)cpEl.value=String(tl).replace(/[^0-9+]/g,"");
      if(nm){try{upsertContact(nm,String(tl||"").replace(/[^0-9+]/g,""),"");save();render()}catch(e){}}
      if(!nm&&!tl)alert("این مخاطب نام یا شماره نداشت")}
  }catch(e){if(e&&e.name==="NotAllowedError")return;alert("انتخاب مخاطب لغو شد")}}
/* --- بروزرسانی دستی + ادغام مخاطبین دو گوشی --- */
function cloudReady(){return !!(window._fdb&&DB.settings.salonCode)}
async function manualRefresh(silent){
  render();
  try{mqttPing();publishState(false)}catch(e){}
  if(!cloudReady()&&!(window._mqttClient&&window._mqttClient.connected)){
    if(!silent)toast("نمایش به‌روز شد ✓ (اتصال ابری فعال نیست — برای دیدن تغییرات گوشی دیگر، «همگام‌سازی» را فعال کنید)");
    const rt=document.getElementById("refreshTime");if(rt)rt.textContent="آخرین بروزرسانی: "+faNum(new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}));
    return}
  try{
    await window.FARA_SYNC.pushCloud();
    const code=DB.settings.salonCode.trim();
    const doc=await window._fdb.collection("rooms").doc(code).get();
    if(doc.exists){mergeCloud(doc.data());save();render()}
    window._lastRefresh=Date.now();
    const rt=document.getElementById("refreshTime");if(rt)rt.textContent="آخرین بروزرسانی: "+faNum(new Date().toLocaleTimeString("fa-IR",{hour:"2-digit",minute:"2-digit"}))+" ✓";
    if(!silent)toast("بروزرسانی شد ✓ تغییرات هر دو گوشی اعمال شد");
  }catch(e){if(!silent)alert("بروزرسانی ناموفق بود — اینترنت را چک کنید")}}
function mergeCloud(d){
  if(!d)return;
  const byId=(arr)=>{const m={};(arr||[]).forEach(x=>{if(x&&x.id)m[x.id]=x});return m};
  const newer=(a,b)=>{const ta=(a&&(a.updatedAt||a.createdAt))||0,tb=(b&&(b.updatedAt||b.createdAt))||0;return tb>ta?b:a};
  ["appointments","contacts","packages","payments"].forEach(k=>{
    if(!Array.isArray(d[k]))return;
    const local=byId(DB[k]),out=[];const seen={};
    DB[k].forEach(x=>{const y=local[x.id]&&byId(d[k])[x.id]?newer(x,byId(d[k])[x.id]):x;if(!seen[x.id]){seen[x.id]=1;out.push(y)}});
    d[k].forEach(x=>{if(x&&x.id&&!seen[x.id]){seen[x.id]=1;out.push(x)}});
    DB[k]=out});
  ["services","therapists","groups"].forEach(k=>{if(Array.isArray(d[k])){DB[k]=DB[k]||[];d[k].forEach(v=>{if(v&&DB[k].indexOf(v)<0)DB[k].push(v)})}})}
function mergeBackupObject(d){
  if(!d||!d.appointments)return false;
  const byId=(arr)=>{const m={};(arr||[]).forEach(x=>{if(x&&x.id)m[x.id]=x});return m};
  const newer=(a,b)=>{const ta=(a&&(a.updatedAt||a.createdAt))||0,tb=(b&&(b.updatedAt||b.createdAt))||0;return tb>ta?b:a};
  ["appointments","contacts","packages","payments"].forEach(k=>{
    if(!Array.isArray(d[k]))return;
    const lm=byId(DB[k]),dm=byId(d[k]);
    const ids={};DB[k].concat(d[k]).forEach(x=>{if(x&&x.id&&!ids[x.id]){ids[x.id]=1}});
    DB[k]=Object.keys(ids).map(id=>lm[id]&&dm[id]?newer(lm[id],dm[id]):(dm[id]||lm[id]))});
  ["services","therapists","groups"].forEach(k=>{if(Array.isArray(d[k])){DB[k]=DB[k]||[];d[k].forEach(v=>{if(v&&DB[k].indexOf(v)<0)DB[k].push(v)})}});
  // ادغام مخاطبین هم‌نام: شماره جدیدتر را نگه دار
  const seen={};DB.contacts=DB.contacts.filter(c=>{const k=norm(c.name||"");if(!k)return false;if(seen[k])return false;seen[k]=1;return true});
  return true}
/* --- همگام‌سازی خودکار بدون حساب (MQTT) --- */
const MQTT_CONF={url:"wss://broker.hivemq.com:8884/mqtt",prefix:"fara-massage-v1"};
window._mqttId="m"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
window._mqttClient=null;window._mqttTopic=null;window._mqttTimer=null;window._lastPingRsp=0;
function mqttTopic(){const c=(DB.settings.salonCode||"").trim();return c?MQTT_CONF.prefix+"/"+c+"/db":null}
function mqttStatus(t){const el=document.getElementById("syncBadge");if(!el)return;
  if(window._mqttClient&&window._mqttClient.connected){el.className="sync-ok";el.textContent="همگام‌سازی خودکار فعال ✓";}
  else if(window._fdb&&DB.settings.salonCode){el.className="sync-ok";el.textContent="ذخیره مشترک فعال ✓";}
  else if(t){el.className="sync-mid";el.textContent=t}
  else{el.className="sync-ok";el.textContent="ذخیره دائمی فعال ✓ (روی همین گوشی)"}}
function mqttEnsureLib(){return new Promise((res,rej)=>{
  if(window.mqtt&&window.mqtt.connect)return res();
  const s=document.createElement("script");s.src="https://unpkg.com/mqtt@5.0.0/dist/mqtt.min.js";
  s.onload=()=>res();s.onerror=()=>rej(new Error("lib"));document.head.appendChild(s);
  setTimeout(()=>rej(new Error("timeout")),20000)})}
async function initMQTT(){
  const topic=mqttTopic();if(!topic){mqttStatus();return}
  try{await mqttEnsureLib()}catch(e){mqttStatus("اتصال خودکار ناموفق — دکمه بروزرسانی را بزنید");return}
  try{
    if(window._mqttClient){try{window._mqttClient.end(true)}catch(e){}}
    const c=window.mqtt.connect(MQTT_CONF.url,{clientId:window._mqttId,clean:true,reconnectPeriod:8000,connectTimeout:15000});
    window._mqttClient=c;window._mqttTopic=topic;mqttStatus("در حال اتصال…");
    c.on("connect",()=>{try{c.subscribe(topic,{qos:1})}catch(e){}mqttStatus();publishState(false)});
    c.on("reconnect",()=>mqttStatus("در حال اتصال مجدد…"));
    c.on("error",()=>mqttStatus("اتصال خودکار ناموفق — دکمه بروزرسانی را بزنید"));
    c.on("close",()=>mqttStatus());
    c.on("message",(t,buf)=>{
      if(t!==window._mqttTopic)return;
      let m=null;try{m=JSON.parse(buf.toString())}catch(e){return}
      if(!m||m.from===window._mqttId)return;
      if(m.type==="ping"){if(Date.now()-window._lastPingRsp>10000){window._lastPingRsp=Date.now();publishState(false)}return}
      if(m.type==="state"&&m.data){try{mergeCloud(m.data);localStorage.setItem(DB_KEY,JSON.stringify(DB))}catch(e){}render()}
    });
  }catch(e){mqttStatus("اتصال خودکار ناموفق — دکمه بروزرسانی را بزنید")}}
function publishState(announce){
  try{
    const topic=mqttTopic();if(!topic||!window._mqttClient||!window._mqttClient.connected)return;
    const msg=JSON.stringify({type:"state",from:window._mqttId,at:Date.now(),data:{appointments:DB.appointments,contacts:DB.contacts,packages:DB.packages,services:DB.services,therapists:DB.therapists,groups:DB.groups,payments:DB.payments}});
    window._mqttClient.publish(topic,msg,{qos:1,retain:true});
    if(announce)toast("ارسال شد ✓");
  }catch(e){}}
window._mqttPush=function(){clearTimeout(window._mqttTimer);window._mqttTimer=setTimeout(()=>publishState(false),2000)};
function saveSalonAndReconnect(){DB.settings.salonCode=document.getElementById("s_code").value.trim();save();try{localStorage.setItem(DB_KEY,JSON.stringify(DB))}catch(e){}closeSheet();render();initMQTT();alert("کد سالن ذخیره شد. همین کد را در گوشی دوم هم وارد کنید — بعد از چند ثانیه خودکار وصل می‌شوند.")}
function mqttPing(){try{const topic=mqttTopic();if(topic&&window._mqttClient&&window._mqttClient.connected){window._mqttClient.publish(topic,JSON.stringify({type:"ping",from:window._mqttId}),{qos:0});toast("درخواست بروزرسانی فرستاده شد…")}}catch(e){}}
(function(){setTimeout(()=>{try{initMQTT()}catch(e){}},3000)})();
