const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const views = ['home','scanner','formatter','password','hash','notes'];
let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function log(message){const out=$('#logOutput');const p=document.createElement('p');const time=new Date().toLocaleTimeString('en-GB');const stamp=document.createElement('span');stamp.textContent=`[${time}] `;p.append(stamp,document.createTextNode(message));out.prepend(p)}
function navigate(view){if(!views.includes(view))return;$$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${view}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
function tick(){ $('#clock').textContent=new Date().toLocaleTimeString('en-GB',{hour12:false}); }tick();setInterval(tick,1000);
$('#clearLog').addEventListener('click',()=>{$('#logOutput').replaceChildren();log('تم مسح السجل المحلي.')});
async function copyText(text){if(!text){toast('لا يوجد نص لنسخه.');return}try{await navigator.clipboard.writeText(text);toast('تم النسخ.')}catch{const t=document.createElement('textarea');t.value=text;document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'تم النسخ.':'تعذّر النسخ؛ حدّد النص وانسخه يدويًا.')}}
function addResult(type,title,detail){const row=document.createElement('div');row.className=`result-item ${type}`;const icon=document.createElement('div');icon.className='result-icon';icon.textContent=type==='good'?'✓':type==='warn'?'!':'×';const content=document.createElement('div');const b=document.createElement('b');b.textContent=title;const p=document.createElement('p');p.textContent=detail;content.append(b,p);row.append(icon,content);$('#scanResults').append(row)}
function inspectCode(source){
 const results=[];const text=source;const lines=text.split('\n');
 if(!text.trim())return [{type:'warn',title:'لا يوجد نص',detail:'أدخل نصًا أو كودًا قبل بدء الفحص.'}];
 results.push({type:'good',title:'تم تحليل النص محليًا',detail:`${lines.length} سطرًا، ${text.length} حرفًا، ${text.split(/\s+/).filter(Boolean).length} كلمة/رمز مفصول بمسافة.`});
 const pairs=[['(',')'],['[',']'],['{','}']];
 for(const [open,close] of pairs){let count=0;for(const ch of text){if(ch===open)count++;if(ch===close)count--}if(count!==0)results.push({type:'warn',title:`احتمال عدم توازن القوس ${open}${close}`,detail:`الفرق العددي بين القوسين: ${count}. هذا فحص بسيط لا يراعي التعليقات أو النصوص الحرفية.`})}
 if(/TODO|FIXME|XXX/i.test(text))results.push({type:'warn',title:'وجدت علامة عمل معلّق',detail:'يحتوي النص على TODO أو FIXME أو XXX؛ راجع ما إذا كان هناك جزء غير مكتمل.'});
 if(/while\s+true|while\s*\(\s*true\s*\)/i.test(text))results.push({type:'warn',title:'حلقة غير منتهية محتملة',detail:'وجدت نمط حلقة مستمرة. تأكد من وجود انتظار أو شرط خروج مناسب حتى لا تتسبب في تجميد بيئة التشغيل.'});
 if(/(api[_-]?key|secret[_-]?key|password)\s*[:=]\s*['"][^'"]{4,}['"]/i.test(text))results.push({type:'bad',title:'احتمال وجود سر مكتوب مباشرة',detail:'وجدت تعيينًا يشبه مفتاح API أو كلمة مرور. لا تشارك الأسرار في كود عام؛ هذه مطابقة نصية وليست إثباتًا.'});
 if(/loadstring\s*\(|eval\s*\(/i.test(text))results.push({type:'warn',title:'تنفيذ نص ديناميكي محتمل',detail:'وجدت loadstring أو eval. راجع المصدر والثقة بالمدخلات قبل استخدامه. لا يتم تنفيذ الكود هنا.'});
 if(/https?:\/\/|request\s*\(|HttpGet/i.test(text))results.push({type:'warn',title:'مؤشر اتصال خارجي',detail:'يظهر رابط أو نمط طلب شبكة. تحقق من الوجهة والبيانات التي قد تُرسل إليها.'});
 if(/print\s*\(|console\.log\s*\(/i.test(text))results.push({type:'good',title:'رسائل تشخيص موجودة',detail:'تم العثور على print أو console.log يمكن أن تساعد في تتبع التنفيذ.'});
 if(!results.some(r=>r.type==='warn'||r.type==='bad'))results.push({type:'good',title:'لم تظهر مؤشرات الفحص المحددة',detail:'هذا لا يعني أن الكود خالٍ من الأخطاء أو آمن؛ شغّله فقط في بيئة موثوقة ومناسبة.'});
 return results;
}
$('#scanBtn').addEventListener('click',()=>{const rs=inspectCode($('#scanInput').value);$('#scanResults').replaceChildren();rs.forEach(r=>addResult(r.type,r.title,r.detail));$('#scanSummary').textContent=`${rs.length} ملاحظة`;log(`اكتمل فحص نص من ${$('#scanInput').value.length} حرفًا.`)});
$('#scanExample').addEventListener('click',()=>{$('#scanInput').value='local part = workspace:WaitForChild("Part")\n\nwhile true do\n    part.Color = Color3.fromRGB(255, 0, 0)\n    task.wait(1)\nend';toast('تم تحميل مثال Luau.')});
$('#clearScan').addEventListener('click',()=>{$('#scanInput').value='';$('#scanResults').replaceChildren();$('#scanSummary').textContent='بانتظار الفحص';toast('تم مسح حقل الفحص.')});
$$('[data-format]').forEach(b=>b.addEventListener('click',()=>{const s=$('#formatInput').value;let out=s;switch(b.dataset.format){case'trim':out=s.split('\n').map(x=>x.trim()).join('\n').trim();break;case'lines':out=s.split('\n').filter(x=>x.trim()).join('\n');break;case'upper':out=s.toLocaleUpperCase();break;case'lower':out=s.toLocaleLowerCase();break;case'sort':out=s.split('\n').sort((a,b)=>a.localeCompare(b,'ar')).join('\n');break}$('#formatOutput').value=out;toast('تم تنسيق النص.')}));
$('#copyFormat').addEventListener('click',()=>copyText($('#formatOutput').value));
$('#passLength').addEventListener('input',e=>$('#lengthValue').textContent=e.target.value);
$('#generatePass').addEventListener('click',()=>{let chars='';if($('#useUpper').checked)chars+='ABCDEFGHIJKLMNOPQRSTUVWXYZ';if($('#useLower').checked)chars+='abcdefghijklmnopqrstuvwxyz';if($('#useNumbers').checked)chars+='0123456789';if($('#useSymbols').checked)chars+='!@#$%^&*()-_=+[]{}?';if(!chars){toast('اختر نوعًا واحدًا على الأقل.');return}const n=+$('#passLength').value;let out='';if(window.crypto?.getRandomValues){const bytes=new Uint32Array(n);crypto.getRandomValues(bytes);for(let i=0;i<n;i++)out+=chars[bytes[i]%chars.length]}else{for(let i=0;i<n;i++)out+=chars[Math.floor(Math.random()*chars.length)]}$('#passOutput').value=out;$('#passStrength').textContent=`تم إنشاء ${n} رمزًا. خزّنها في مدير كلمات مرور موثوق.`;log('تم توليد كلمة مرور محليًا.')});
$('#copyPass').addEventListener('click',()=>copyText($('#passOutput').value));
$('#hashBtn').addEventListener('click',async()=>{const s=$('#hashInput').value;if(!s){toast('أدخل نصًا أولًا.');return}if(!crypto?.subtle){$('#hashStatus').textContent='واجهة SHA-256 غير متاحة في هذا السياق. جرّب فتح الموقع عبر localhost أو HTTPS.';return}try{const bytes=new TextEncoder().encode(s);const digest=await crypto.subtle.digest('SHA-256',bytes);$('#hashOutput').value=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');$('#hashStatus').textContent='اكتملت البصمة داخل المتصفح.';log('تم حساب بصمة SHA-256.')}catch(e){$('#hashStatus').textContent='تعذّر حساب البصمة في هذا المتصفح.'}});
$('#copyHash').addEventListener('click',()=>copyText($('#hashOutput').value));
const NOTES_KEY='shadow-system-local-notes-v1';
try{$('#notesInput').value=localStorage.getItem(NOTES_KEY)||''}catch{}
$('#saveNotes').addEventListener('click',()=>{try{localStorage.setItem(NOTES_KEY,$('#notesInput').value);$('#notesStatus').textContent='تم الحفظ محليًا في هذا المتصفح.';toast('حُفظت الملاحظات على الجهاز.')}catch{$('#notesStatus').textContent='تعذّر الحفظ؛ قد تكون مساحة التخزين غير متاحة.'}});
$('#deleteNotes').addEventListener('click',()=>{try{localStorage.removeItem(NOTES_KEY)}catch{}$('#notesInput').value='';$('#notesStatus').textContent='تم حذف الملاحظات المحلية.';toast('تم حذف الملاحظات.')});
