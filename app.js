const configured=window.SUPABASE_URL && !window.SUPABASE_URL.includes("PASTE_") && window.SUPABASE_KEY && !window.SUPABASE_KEY.includes("PASTE_");
const sb=configured?supabase.createClient(window.SUPABASE_URL,window.SUPABASE_KEY):null;
let currentUser=null,items=[],transactions=[],closings=[],authMode="login";

const $=id=>document.getElementById(id);
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function msg(s){$("authMsg").textContent=s}
function todayKey(){return new Date().toISOString().slice(0,10)}
function showAuth(){ $("authView").classList.remove("hidden");$("appView").classList.add("hidden") }
function showApp(){ $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("userLabel").textContent=currentUser?.email||"" }

$("loginTab").onclick=()=>{authMode="login";$("loginTab").classList.add("active");$("registerTab").classList.remove("active");$("authSubmit").textContent="Login";msg("")}
$("registerTab").onclick=()=>{authMode="register";$("registerTab").classList.add("active");$("loginTab").classList.remove("active");$("authSubmit").textContent="Daftar";msg("")}
$("authForm").onsubmit=async e=>{
 e.preventDefault(); if(!sb){msg("Konfigurasi Supabase belum diisi di config.js.");return}
 const email=$("email").value.trim(),password=$("password").value;
 msg("Memproses...");
 const r=authMode==="login"?await sb.auth.signInWithPassword({email,password}):await sb.auth.signUp({email,password});
 if(r.error){msg(r.error.message);return}
 if(authMode==="register"&&!r.data.session){msg("Pendaftaran berhasil. Cek email untuk konfirmasi, lalu login.");return}
 currentUser=r.data.user; await loadAll(); showApp()
}
$("logout").onclick=async()=>{await sb.auth.signOut();currentUser=null;showAuth()}
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.page).classList.add("active")});

async function loadAll(){
 if(!sb||!currentUser)return;
 let r=await sb.from("items").select("*").order("name"); if(r.error)return alert(r.error.message); items=r.data||[];
 r=await sb.from("transactions").select("*").order("created_at",{ascending:false}); if(r.error)return alert(r.error.message); transactions=r.data||[];
 r=await sb.from("closings").select("*").order("created_at",{ascending:false}); if(r.error)return alert(r.error.message); closings=r.data||[];
 render()
}
function render(){
 $("totalItems").textContent=items.length;
 $("totalStock").textContent=items.reduce((a,x)=>a+Number(x.stock),0);
 $("todayTransactions").textContent=transactions.filter(x=>x.date_key===todayKey()).length;
 const rows=items.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.code)}</td><td><b>${i.stock}</b></td><td><button class="small edit" onclick="openItem('${i.id}')">Edit</button> <button class="small del" onclick="delItem('${i.id}')">Hapus</button></td></tr>`).join("")||'<tr><td colspan="4" class="empty">Belum ada barang.</td></tr>';
 $("stockTable").innerHTML=rows;$("itemsTable").innerHTML=rows;
 $("txTable").innerHTML=transactions.map(t=>`<tr><td>${new Date(t.created_at).toLocaleString("id-ID")}</td><td>${esc(t.item_name)}</td><td>${t.type==="in"?"Masuk":"Keluar"}</td><td>${t.qty}</td><td>${esc(t.note||"-")}</td></tr>`).join("")||'<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>';
 $("closingTable").innerHTML=closings.map(c=>`<tr><td>${esc(c.closing_date)}</td><td>${c.item_count}</td><td>${c.total_stock}</td></tr>`).join("")||'<tr><td colspan="3" class="empty">Belum ada closing.</td></tr>';
}
function openModal(html){$("modalContent").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden")}
$("modal").onclick=e=>{if(e.target.id==="modal")closeModal()}

window.openItem=id=>{
 const i=items.find(x=>x.id===id);
 openModal(`<h2>${i?"Edit":"Tambah"} Barang</h2><form onsubmit="saveItem(event,'${id||""}')"><input id="n" required placeholder="Nama barang" value="${esc(i?.name||"")}"><input id="c" required placeholder="Kode barang" value="${esc(i?.code||"")}"><input id="s" required type="number" min="0" placeholder="Stok" value="${i?.stock??0}"><button class="primary">Simpan</button></form>`)
}
window.saveItem=async(e,id)=>{e.preventDefault();const payload={name:$("n").value.trim(),code:$("c").value.trim(),stock:Number($("s").value)};let r;if(id)r=await sb.from("items").update(payload).eq("id",id);else r=await sb.from("items").insert({...payload,user_id:currentUser.id});if(r.error)alert(r.error.message);else{closeModal();await loadAll()}}
window.delItem=async id=>{if(!confirm("Hapus barang ini?"))return;const r=await sb.from("items").delete().eq("id",id);if(r.error)alert(r.error.message);else await loadAll()}
window.openTx=type=>{
 if(!items.length){alert("Tambahkan barang terlebih dahulu.");return}
 openModal(`<h2>Barang ${type==="in"?"Masuk":"Keluar"}</h2><form onsubmit="saveTx(event,'${type}')"><select id="ti">${items.map(i=>`<option value="${i.id}">${esc(i.name)} — stok ${i.stock}</option>`).join("")}</select><input id="q" required type="number" min="1" placeholder="Jumlah"><input id="note" placeholder="Keterangan (opsional)"><button class="primary">Simpan</button></form>`)
}
window.saveTx=async(e,type)=>{
 e.preventDefault();const i=items.find(x=>x.id===$("ti").value),qty=Number($("q").value);
 if(type==="out"&&qty>i.stock){alert("Stok tidak mencukupi.");return}
 const newStock=type==="in"?Number(i.stock)+qty:Number(i.stock)-qty;
 const u=await sb.from("items").update({stock:newStock}).eq("id",i.id);if(u.error){alert(u.error.message);return}
 const r=await sb.from("transactions").insert({user_id:currentUser.id,item_id:i.id,item_name:i.name,type,qty,note:$("note").value.trim(),date_key:todayKey()});
 if(r.error){alert(r.error.message);return}
 closeModal();await loadAll()
}
window.closing=async()=>{
 if(!items.length){alert("Belum ada barang.");return}
 if(!confirm("Simpan closing stok hari ini?"))return
 const total=items.reduce((a,x)=>a+Number(x.stock),0);
 const r=await sb.from("closings").insert({user_id:currentUser.id,closing_date:todayKey(),item_count:items.length,total_stock:total,snapshot:items});
 if(r.error){alert(r.error.message);return}
 alert("Closing berhasil disimpan.");await loadAll()
}

(async()=>{
 if(!configured){showAuth();msg("Sebelum digunakan, isi config.js dengan URL dan Publishable/anon key dari Supabase.");return}
 const {data}=await sb.auth.getSession();if(data.session){currentUser=data.session.user;await loadAll();showApp()}else showAuth();
 sb.auth.onAuthStateChange(async(_e,s)=>{if(s&&!currentUser){currentUser=s.user;await loadAll();showApp()}});
})();