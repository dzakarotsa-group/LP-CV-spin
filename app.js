const DEFAULT_CONFIG={name:'Castila Village',location:'Perak - Jombang',phone:'',promos1:['Gratis biaya akad','DP ringan mulai 5%','Gratis kanopi rumah','Cashback Rp5 juta','Voucher furniture'],promos2:['Free biaya KPR','Gratis pagar rumah','Bonus kitchen set','Gratis AJB & SHM','Subsidi angsuran 3 bulan','Voucher pindahan'],chatTemplate:'Halo Admin Castila Village, saya {nama} ({nomor}) dari {alamat}. Saya mau ambil promo {promo1} dan {promo2} yang saya dapat dari spin promo. Mohon info selanjutnya ya.'};
const API_URL='https://script.google.com/macros/s/AKfycbz0GaeSoGY6H-OPE5fI0xG8LXqak4v2MlyoQzEymsyyb_EuiBbIKhy7AaMFs1cKMNo9bQ/exec';
const DUMMY_PHONE='628123456789';
const normalizeItems=(items,limit)=>Array.isArray(items)?items.map(item=>String(item).trim()).filter(Boolean).slice(0,limit):[];
const normalizePhone=value=>String(value||'').replace(/\D/g,'');
const normalizeConfig=source=>{
  const normalized={...DEFAULT_CONFIG,...(source||{})};
  const phone=normalizePhone(normalized.phone);
  normalized.phone = phone && phone !== DUMMY_PHONE ? phone : '';
  normalized.promos1 = normalizeItems(normalized.promos1,5).length ? normalizeItems(normalized.promos1,5) : DEFAULT_CONFIG.promos1;
  normalized.promos2 = normalizeItems(normalized.promos2,6).length ? normalizeItems(normalized.promos2,6) : DEFAULT_CONFIG.promos2;
  const image = typeof normalized.image === 'string' ? normalized.image.trim() : '';
  normalized.image = image && !image.startsWith('blob:') ? image : '';
  return normalized;
};
const localConfig=()=>{try{return normalizeConfig(JSON.parse(localStorage.getItem('castilaConfig')||'{}'))}catch(error){console.error('Konfigurasi lokal tidak valid:',error);return DEFAULT_CONFIG}};
const loadRemoteConfig=url=>new Promise(resolve=>{if(!url||url.includes('GANTI_URL'))return resolve(localConfig());const callback=`castilaConfig_${Date.now()}`;window[callback]=data=>{delete window[callback];script.remove();if(data&&data.ok&&data.config)return resolve(normalizeConfig(data.config));console.error('Konfigurasi API tidak tersedia:',data&&data.error||'respons tidak valid');resolve(localConfig())};const script=document.createElement('script');script.src=`${url}?action=config&callback=${callback}`;script.onerror=()=>{delete window[callback];script.remove();console.error('Gagal memuat konfigurasi dari API:',url);resolve(localConfig())};document.head.appendChild(script)});
const apiUrl=localStorage.getItem('castilaApiUrl')||API_URL;const config=await loadRemoteConfig(apiUrl);let selected={1:null,2:null};const promoLists={1:config.promos1,2:config.promos2};
document.querySelector('#brandName').textContent=config.name;document.querySelector('#heroName').textContent=config.name;document.querySelector('#heroLocation').textContent=config.location;
const heroImage=document.querySelector('#heroImage');
const imageUrl=config.image || 'test.jpg';
heroImage.style.backgroundImage=`url("${imageUrl}")`;
heroImage.style.backgroundSize='cover';
heroImage.style.backgroundPosition='center';
heroImage.style.backgroundRepeat='no-repeat';
heroImage.style.setProperty('--hero-image-loaded','1');
function drawWheelText(number){
  const list=Array.isArray(promoLists[number])?promoLists[number].filter(promo=>String(promo).trim()):[];
  if(!list.length)return;
  const wheel=document.querySelector(`#wheel${number}`);
  const container=document.createElement('div');
  container.className='wheel-text-container';
  const angle=360/list.length;
  const radius=wheel.clientWidth*0.3;
  const colors=number===1
    ? ['#efaa70','#769b89','#d9e5da','#d98255','#527b6c']
    : ['#ed9b63','#769b89','#d9e5da','#d98255','#527b6c','#e8bd7b'];
  const stops=list.map((_,index)=>{
    const start=index*100/list.length;
    const end=(index+1)*100/list.length;
    return `${colors[index%colors.length]} ${start}% ${end}%`;
  });
  wheel.style.background=`conic-gradient(${stops.join(',')})`;
  list.forEach((promo,index)=>{
    const radians=(index*angle+angle/2)*Math.PI/180;
    const label=document.createElement('div');
    const text=document.createElement('span');
    label.className='wheel-text';
    label.style.left=`calc(50% + ${Math.sin(radians)*radius}px)`;
    label.style.top=`calc(50% - ${Math.cos(radians)*radius}px)`;
    text.textContent=promo;
    label.appendChild(text);
    container.appendChild(label);
  });
  wheel.insertBefore(container,wheel.querySelector('.wheel-center'));
}
drawWheelText(1);
drawWheelText(2);
document.querySelectorAll('.spin-button').forEach(button=>button.addEventListener('click',()=>spin(Number(button.dataset.spinButton))));
function spin(number){if(selected[number])return;const list=promoLists[number]||[];if(!list.length)return;const wheel=document.querySelector(`#wheel${number}`);const index=Math.floor(Math.random()*list.length);const angle=360/list.length;const spins=5+Math.floor(Math.random()*3);wheel.style.transform=`rotate(${spins*360+360-(index*angle+angle/2)}deg)`;buttonBusy(number,true);setTimeout(()=>{selected[number]=list[index];document.querySelector(`#result${number}`).textContent=list[index];document.querySelector(`#selected${number}`).textContent=list[index];buttonBusy(number,false)},3600)}
function buttonBusy(number,busy){const button=document.querySelector(`[data-spin-button="${number}"]`);button.disabled=busy;button.textContent=busy?'Sedang berputar...':selected[number]?'Promo sudah dipilih':'Putar sekarang'}
document.querySelector('#leadForm').addEventListener('submit',async event=>{event.preventDefault();const message=document.querySelector('#formMessage');if(!selected[1]||!selected[2]){message.textContent='Silakan putar Spin Promo 1 dan 2 terlebih dahulu.';document.querySelector('#promo').scrollIntoView({behavior:'smooth'});return}const form=new FormData(event.currentTarget);const lead={createdAt:new Date().toISOString(),name:form.get('name').trim(),phone:form.get('phone').trim(),address:form.get('address').trim(),promo1:selected[1],promo2:selected[2]};if(!lead.name||!lead.phone||!lead.address){message.textContent='Semua data wajib diisi.';return}const adminPhone=normalizePhone(config.phone).replace(/^0/,'62');if(!adminPhone || adminPhone === DUMMY_PHONE){message.textContent='Nomor WhatsApp admin belum termuat. Muat ulang halaman atau cek pengaturan admin.';return}if(apiUrl&&!apiUrl.includes('GANTI_URL')){fetch(apiUrl,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'lead',lead})}).catch(error=>console.error('Penyimpanan lead gagal:',error))}const chat=config.chatTemplate.replaceAll('{nama}',lead.name).replaceAll('{nomor}',lead.phone).replaceAll('{alamat}',lead.address).replaceAll('{promo1}',lead.promo1).replaceAll('{promo2}',lead.promo2);window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(chat)}`,'_blank')});
