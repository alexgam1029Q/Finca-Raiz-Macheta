function card(item){const category=escapeHtml(item.category==='Camioneta'?'Vehículo':item.category||'Publicación');const own=ownsListing(item);const coverImage=item.image||item.images?.[0]||'';const imageMarkup=coverImage?`<img class="card-media" src="${escapeHtml(coverImage)}" alt="${escapeHtml(item.title||'Publicación')}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="card-media-fallback" hidden aria-hidden="true">${item.type==='vehicle'?'Vehículo':'Propiedad'}</div>`:'<div class="card-media-fallback" aria-hidden="true">Sin imagen</div>';return `<article class="card"><div class="card-image">${imageMarkup}<span class="badge">${category}</span></div><div class="card-body"><div class="price">${money(item.price)}</div><h3>${escapeHtml(item.title)}</h3><div class="location">⌖ ${escapeHtml(item.location)}</div>${specsSummary(item)?`<div class="spec-summary">${specsSummary(item)}</div>`:''}<div class="card-footer"><span class="mini-type">${item.type==='vehicle'?'Vehículo':'Propiedad'}</span><span class="card-actions"><button class="btn btn-primary btn-small" data-detail="${escapeHtml(item.id)}">Ver</button>${own?`<button class="btn btn-outline btn-small" data-delete="${escapeHtml(item.id)}">Eliminar</button>`:''}</span></div></div></article>`}
function downloadListingsBackup(){if(!isAdmin()){toast('Solo un administrador puede descargar publicaciones.');return}const backup={format:'finca-raiz-macheta-listings',version:1,exportedAt:new Date().toISOString(),scope:'all-listings',listings:listings.map(item=>{const copy={...item};delete copy.id;delete copy.owner_id;delete copy.status;delete copy.created_at;delete copy.updated_at;return copy})};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`publicaciones-finca-raiz-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);toast(`${backup.listings.length} publicaciones de todos los usuarios descargadas`)}
async function importListingsBackup(file){if(!isAdmin()||!supabaseClient||!state.user?.id){toast('Solo un administrador conectado puede cargar publicaciones.');return}try{const parsed=JSON.parse(await file.text());const imported=Array.isArray(parsed)?parsed:parsed?.listings;if(!Array.isArray(imported)||!imported.length)throw new Error('El archivo no contiene publicaciones.');const textFields=await resolveListingTextColumns();const rows=imported.map(source=>{const item=normalizeListing(source);const row={title:String(item.title||'').trim(),type:item.type==='vehicle'?'vehicle':'property',price:Number(item.price)||0,location:String(item.location||'').trim(),image:item.image||null,images:Array.isArray(item.images)?item.images.filter(Boolean):[],videos:Array.isArray(item.videos)?item.videos.filter(Boolean):[],owner:state.user.id,status:'approved'};const description=String(source.description||source.desc||item.desc||'').trim();if(textFields.includes('description'))row.description=description;if(textFields.includes('desc'))row.desc=description;return row}).filter(row=>row.title&&row.location&&row.price>0);if(!rows.length)throw new Error('No hay publicaciones válidas para cargar.');const {data,error}=await supabaseClient.from('listings').insert(rows).select();if(error)throw error;listings=[...(data||[]).map(normalizeListing),...listings];render();toast(`${rows.length} publicaciones cargadas correctamente`)}catch(error){toast(`No se pudo cargar el respaldo: ${error.message}`)}}
function enhanceAdminBackup(){if(!isAdmin()||state.view!=='my'||document.querySelector('[data-admin-backup]'))return;const panel=document.querySelector('.dash-grid');if(!panel)return;panel.insertAdjacentHTML('beforeend','<section class="panel" data-admin-backup><h3>Respaldo de publicaciones</h3><p class="meta">Descarga un archivo JSON para conservar o trasladar tus publicaciones.</p><div class="admin-backup-actions"><button class="btn btn-outline btn-small" data-action="download-listings">Descargar publicaciones</button><label class="btn btn-primary btn-small" for="listings-backup-input">Cargar publicaciones</label><input id="listings-backup-input" type="file" accept="application/json,.json" hidden></div></section>');panel.querySelector('[data-action="download-listings"]').addEventListener('click',downloadListingsBackup);panel.querySelector('#listings-backup-input').addEventListener('change',event=>{const file=event.target.files?.[0];if(file)importListingsBackup(file);event.target.value=''})}
const seed = [];
const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseClient = window.supabase && supabaseConfig.url && !supabaseConfig.url.includes('YOUR_') && supabaseConfig.anonKey && !supabaseConfig.anonKey.includes('YOUR_')
	? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
const state = { view: 'home', filter: 'all', query: '', category: 'Todos', operation: 'Venta', selected: null, editing: null, user: null };
let listings = seed;
const app = document.getElementById('app');
const contact = {name:'Angel Salcedo',phone:'311 202 3715',whatsapp:'+573112023715',email:'angelovidioosalcedo@gmail.com',facebook:'https://www.facebook.com/share/1AbuBXdbKe/'};
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_GALLERY_IMAGES = 10;
const MAX_VIDEO_COUNT = 5;
const canPublish = () => Boolean(state.user);
const isAdmin = () => state.user?.role === 'admin';
function cleanAuthCallbackUrl(){
  if(!window.location.hash||!/access_token|refresh_token|type=recovery|type=signup/i.test(window.location.hash))return;
  window.history.replaceState({},document.title,`${window.location.pathname}${window.location.search}`);
}
const isSupabaseSchemaError = error => {
  const message = String(error?.message || error?.details || error || '');
  return /column|could not find|does not exist|relation .*listings|schema|status 400|status 500|not found|RLS|row level security/i.test(message);
};
const money = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
const imageStyle = (url, position='center', fit='cover') => {try{const parsed=new URL(String(url||''),window.location.href);if(!['http:','https:','blob:'].includes(parsed.protocol))return `background-position:${position}; background-size:${fit}; background-repeat:no-repeat;`;const safeUrl=parsed.href.replace(/["'()\\]/g,'');return `background-image:url("${safeUrl}"); background-position:${position}; background-size:${fit}; background-repeat:no-repeat;`}catch(error){return `background-position:${position}; background-size:${fit}; background-repeat:no-repeat;`}};
const removeLocationIcons = () => document.querySelectorAll('.location').forEach(element => { element.textContent = element.textContent.replace(/^⌖\s*/, ''); });
const normalizeListing = item => {const rawDesc=item.description || item.desc || '';const areaMatch=rawDesc.match(/<!--area:([0-9]+(?:\.[0-9]+)?):([^>]+)-->/);const specsMatch=rawDesc.match(/<!--specs:([^>]+)-->/);let specs={};try{specs=specsMatch?JSON.parse(decodeURIComponent(specsMatch[1])):{}}catch(error){}const cleanDesc=rawDesc.replace(/<!--area:[^>]+-->/,'').replace(/<!--specs:[^>]+-->/,'').trim() || 'Publicación creada por la comunidad.';const imageList = Array.isArray(item.images) ? item.images.filter(Boolean) : typeof item.images === 'string' && item.images.trim() ? item.images.split(',').map(url => url.trim()).filter(Boolean) : [];const videoList = Array.isArray(item.videos) ? item.videos.filter(Boolean) : typeof item.videos === 'string' && item.videos.trim() ? item.videos.split(',').map(url => url.trim()).filter(Boolean) : [];const coverUrl = item.image || imageList[0] || null;return {...item,...specs,area:item.area ?? (areaMatch?Number(areaMatch[1]):null),areaUnit:item.areaUnit || item.area_unit || (areaMatch?areaMatch[2]:'m²'),cover_position:item.cover_position || 'center',image:coverUrl,images:imageList.length ? imageList : (coverUrl ? [coverUrl] : []),videos:videoList,desc:cleanDesc,description:cleanDesc,owner:item.owner_id || item.owner};};
const safeListingPayload = payload => {
  const allowed = new Set(['title','type','category','price','location','image','images','videos','cover_position','description','desc','owner','owner_id','status']);
  return Object.fromEntries(Object.entries(payload || {}).filter(([key]) => allowed.has(key)));
};
const ownsListing = item => Boolean(state.user && item.owner === state.user.id);
const specsSummary = item => {const values=item.type==='vehicle'?[item.brand,item.model,item.year&&`Año ${item.year}`,item.kms&&`${Number(item.kms).toLocaleString('es-CO')} km`,item.fuel,item.transmission]:[item.propertyType,item.bedrooms&&`${item.bedrooms} hab.`,item.bathrooms&&`${item.bathrooms} baños`,item.parking&&`${item.parking} parqueos`,item.access];return values.filter(Boolean).slice(0,6).map(value=>`<span>${escapeHtml(value)}</span>`).join('')};
async function resolveListingTextColumns(){
	if(!supabaseClient) return ['description'];
	const probes = ['description,desc','description','desc'];
	for (const probe of probes) {
		const {error} = await supabaseClient.from('listings').select(probe).limit(1);
		if(!error) return probe.includes(',') ? ['description','desc'] : [probe];
	}
	return ['description'];
}
function validateVideoFiles(files = []){
	const oversized = [];
	for (const file of files) {
		if (!(file instanceof File) || !file.type.startsWith('video/')) continue;
		if (file.size > MAX_VIDEO_SIZE_BYTES) oversized.push(file.name);
	}
	return oversized;
}
async function optimizeImage(file){
  if (!(file instanceof File) || !file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 300 * 1024) return file;
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = objectUrl;
    });
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') || 'imagen';
    return new File([blob], `${name}.jpg`, {type:'image/jpeg', lastModified:Date.now()});
  } catch (error) {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
async function optimizeVideo(file){
  if (!(file instanceof File) || !file.type.startsWith('video/') || file.size < 5 * 1024 * 1024) return file;
  const videoUrl = URL.createObjectURL(file);
  try {
    if (typeof MediaRecorder === 'undefined') return file;
    const video = await new Promise((resolve, reject) => {
      const element = document.createElement('video');
      element.preload = 'auto';
      element.muted = true;
      element.playsInline = true;
      element.onloadeddata = () => resolve(element);
      element.onerror = () => reject(new Error('No se pudo preparar el video.'));
      element.src = videoUrl;
    });
    const width = Math.min(video.videoWidth || 1280, 1280);
    const height = Math.min(video.videoHeight || 720, 720);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';
    if (!mimeType) return file;
    const stream = canvas.captureStream ? canvas.captureStream(24) : null;
    if (!stream) return file;
    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    recorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    const done = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = () => reject(new Error('No se pudo optimizar el video.'));
    });
    const renderFrame = () => {
      const currentTime = video.currentTime;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (currentTime < (video.duration || 0) && !video.ended) {
        requestAnimationFrame(renderFrame);
      }
    };
    video.currentTime = 0;
    recorder.start(500);
    requestAnimationFrame(renderFrame);
    await video.play().catch(() => {});
    await new Promise(resolve => {
      video.onended = resolve;
      video.onpause = () => {
        if (video.ended || video.currentTime >= (video.duration || 0)) resolve();
      };
    });
    recorder.stop();
    await done;
    const optimizedBlob = new Blob(chunks, { type: mimeType });
    if (!optimizedBlob.size || optimizedBlob.size >= file.size) return file;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video';
    return new File([optimizedBlob], `${baseName}.webm`, { type: mimeType, lastModified: Date.now() });
  } catch (error) {
    return file;
  } finally {
    URL.revokeObjectURL(videoUrl);
  }
}
async function uploadMedia(file, folder){
	const maxBytes = folder === 'videos' ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  const uploadFile = folder === 'images' ? await optimizeImage(file) : await optimizeVideo(file);
  if (uploadFile.size > maxBytes) {
		const label = folder === 'videos' ? 'video' : 'imagen';
    throw new Error(`El ${label} "${file.name}" supera el límite de ${(maxBytes / (1024 * 1024)).toFixed(0)} MB incluso después de optimizarlo.`);
	}
  const path=`${folder}/${crypto.randomUUID()}-${uploadFile.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;
  const {error}=await supabaseClient.storage.from('listing-media').upload(path,uploadFile,{upsert:false});
	if(error)throw error;
	return supabaseClient.storage.from('listing-media').getPublicUrl(path).data.publicUrl;
}
async function loadSupabaseData(){
	if(!supabaseClient)return;
	const {data:{session}} = await supabaseClient.auth.getSession();
  cleanAuthCallbackUrl();
	state.user = session?.user ? {id:session.user.id,name:session.user.user_metadata.name || session.user.email,email:session.user.email,role:'user'} : null;
	if(state.user){const {data:profile}=await supabaseClient.from('profiles').select('role,logo_url').eq('id',state.user.id).maybeSingle();if(profile)Object.assign(state.user,profile)}
	if(!state.user && state.view==='my')state.view='home';
  let listingsQuery = supabaseClient.from('listings').select('*').order('created_at',{ascending:false});
  if(!isAdmin()) listingsQuery = listingsQuery.eq('status','approved');
  const {data,error} = await listingsQuery;
	if(error){
    const msg = isSupabaseSchemaError(error)
      ? 'La tabla de publicaciones no está disponible en Supabase. Revisa la tabla listings y sus columnas/RLS.'
      : `Supabase: ${error.message}`;
    toast(msg);
    listings=[];
    render();
    return;
  }
  listings=(data || []).map(normalizeListing);render();
}
function toast(text){const el=document.getElementById('toast');el.textContent=text;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function navigate(view, data=null){state.view=view;state.selected=data;render();removeLocationIcons();window.scrollTo({top:0,behavior:'smooth'})}
function header(){return `<header class="site-header"><div class="container nav"><a class="brand" href="#" data-nav="home"><img class="brand-logo" src="assets/Logo Finca raiz.jpg" alt="Finca Raíz Machetá"><span>Finca Raíz Machetá</span></a><button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" data-action="toggle-menu"><span></span><span></span><span></span></button><nav class="nav-links"><a href="#" data-nav="home">Inicio</a><a href="#" data-nav="properties">Propiedades</a><a href="#" data-nav="vehicles">Vehículos</a><a href="#" data-nav="my">Mis publicaciones</a></nav><div class="header-actions"><div class="music-player"><audio id="bg-music" loop style="display:none"></audio><button class="btn btn-music" id="music-toggle" data-action="toggle-music" title="Reproducir música">🔊</button></div><div id="site-qr" class="site-qr header-qr" role="img" aria-label="Código QR para abrir esta página en la red local"><img src="assets/qr-pagina.png" alt="Código QR para abrir esta página en la red local"></div>${state.user?`<button class="btn btn-quiet btn-small" data-action="logout">Salir</button>`:`<button class="btn btn-outline btn-small" data-nav="login">Iniciar sesión</button>`}<button class="btn btn-primary btn-small" data-nav="publish">+ Publicar</button></div></div></header>`}
function getMediaEntries(item = {}){const imageList=Array.isArray(item.images)?item.images.filter(Boolean):[];const videoList=Array.isArray(item.videos)?item.videos.filter(Boolean):[];const coverImage=item.image || imageList[0] || null;const entries=[];if(coverImage)entries.push({type:'image',url:coverImage});imageList.filter(url=>url!==coverImage).forEach(url=>entries.push({type:'image',url}));videoList.forEach(url=>entries.push({type:'video',url}));return entries.length ? entries : (item.image ? [{type:'image',url:item.image}] : []);}function card(item){const category=item.category==='Camioneta'?'Vehículo':item.category;const own=state.user&&(item.owner===state.user.email||item.owner===state.user.id);const videoList=Array.isArray(item.videos)?item.videos.filter(Boolean):[];const imageList=Array.isArray(item.images)?item.images.filter(Boolean):[];const coverImage=item.image || imageList[0] || null;const firstVideo=videoList[0] || null;const useVideoCover = !coverImage && Boolean(firstVideo);const imageStyleValue = coverImage ? imageStyle(coverImage, item.cover_position || 'center', 'cover') : 'background:linear-gradient(135deg,#dff7e8,#b2edc9); background-size:cover; background-position:center;';const badgeText = coverImage ? category : (useVideoCover ? 'Video' : category);return `<article class="card"><div class="card-image" style="${imageStyleValue}"><span class="badge">${badgeText}</span></div><div class="card-body"><div class="price">${money(item.price)}</div><h3>${item.title}</h3><div class="location">⌖ ${item.location}</div>${specsSummary(item)?`<div class="spec-summary">${specsSummary(item)}</div>`:''}<div class="card-footer"><span class="mini-type">${item.type==='vehicle'?'Vehículo':'Propiedad'}</span><span class="card-actions"><button class="btn btn-primary btn-small" data-detail="${item.id}">Ver</button>${own?`<button class="btn btn-outline btn-small" data-delete="${item.id}">Eliminar</button>`:''}</span></div></div></article>`}
function home(){const props=listings.filter(x=>x.type==='property').slice(0,3), cars=listings.filter(x=>x.type==='vehicle').slice(0,3);return `<section class="hero"><div class="container hero-content"><p class="kicker">El campo empieza aquí</p><h1>Encuentra tu próximo lugar para vivir, invertir o disfrutar.</h1><p>Fincas, terrenos, casas y vehículos seleccionados en Machetá y sus alrededores.</p><div class="search-panel"><div class="field"><label>¿Qué estás buscando?</label><input id="home-query" placeholder="Ej. finca, Toyota Hilux..." value="${state.query}"></div><div class="field"><label>Sección</label><select id="home-type"><option value="all">Todo</option><option value="property">Fincas y propiedades</option><option value="vehicle">Vehículos</option></select></div><div class="field"><label>Ubicación</label><input id="home-location" placeholder="Municipio o departamento"></div><button class="btn btn-lime" data-action="search">Buscar</button></div></div></section><main><section class="section container property-home-section"><div class="section-head"><div><div class="eyebrow">Propiedades</div><h2>Publicaciones destacadas</h2><p>Oportunidades que vale la pena conocer.</p></div><button class="btn btn-quiet" data-nav="properties">Ver todas →</button></div><div class="grid">${props.map(card).join('')}</div></section>${canPublish()?`<section class="section container"><div class="split-banner"><h2>Tu próxima historia puede empezar en Machetá.</h2><button class="btn btn-lime" data-nav="publish">Publicar un anuncio →</button></div></section>`:''}<section class="section container"><div class="section-head"><div><div class="eyebrow">Movilidad</div><h2>Vehículos recientes</h2></div><button class="btn btn-quiet" data-nav="vehicles">Explorar vehículos →</button></div><div class="grid">${cars.map(card).join('')}</div></section></main>`}
function catalog(type='property'){const isVehicle=type==='vehicle';const catalogItems=listings.filter(x=>type==='all'||x.type===type);const categories=isVehicle?['Todos','Automóvil','Camioneta','Campero','Camión','Moto']:['Todos','Finca','Casa','Lote'];let items=catalogItems;if(state.query)items=items.filter(x=>(x.title+' '+x.location+' '+x.category+' '+x.brand+' '+x.model).toLowerCase().includes(state.query.toLowerCase()));if(state.category&&state.category!=='Todos')items=items.filter(x=String(x.category||'').toLowerCase()===state.category.toLowerCase());if(state.operation==='Alquiler')items=items.filter(x=>String(x.operation||'').toLowerCase()==='alquiler');const emptyMessage=isVehicle?'No hay vehículos disponibles en este momento.':'No hay propiedades disponibles en este momento.';return `<main class="page container ${isVehicle?'vehicle-catalog':''}"><div class="vehicle-heading"><div class="page-title"><div class="eyebrow">${isVehicle?'Movilidad local':'Catálogo local'}</div><h1>${isVehicle?'Vehículos':'Fincas y propiedades'}</h1><p>${isVehicle?'Encuentra vehículos publicados en Machetá y sus alrededores.':'Explora opciones publicadas por personas de la región.'}</p></div></div><div class="filters"><div class="field"><label>Buscar</label><input id="catalog-query" placeholder="${isVehicle?'Marca, modelo o municipio':'Palabras clave'}" value="${state.query}"></div><div class="field"><label>Categoría</label><select id="catalog-category">${categories.map(category=>`<option ${category===state.category?'selected':''}>${category}</option>`).join('')}</select></div><div class="field"><label>Operación</label><select id="catalog-operation"><option ${state.operation==='Venta'?'selected':''}>Venta</option>${isVehicle?'':'<option '+(state.operation==='Alquiler'?'selected':'')+'>Alquiler</option>'}</select></div><button class="btn btn-primary" data-action="catalog-search">Filtrar resultados</button></div>${items.length?`<div class="grid">${items.map(card).join('')}</div>`:`<div class="empty">${catalogItems.length?'No encontramos publicaciones con esos criterios.':emptyMessage}</div>`}</main>`}
function detail(item){return `<main class="page container"><button class="btn btn-quiet" data-nav="${item.type==='vehicle'?'vehicles':'properties'}">← Volver al catálogo</button><div class="detail-layout" style="margin-top:18px"><div><div class="gallery-main" style="${imageStyle((Array.isArray(item.images)&&item.images[0])||item.image, 'center', 'contain')}" data-gallery-main><span class="badge">${item.category}</span></div><div class="gallery-thumbs">${(Array.isArray(item.images)&&item.images.length?item.images:[item.image].filter(Boolean)).map((url,idx)=>`<div class="thumb ${idx===0?'active':''}" style="${imageStyle(url, 'center', 'contain')}" data-gallery-idx="${idx}"></div>`).join('')}</div></div><aside class="detail-card"><div class="eyebrow">${item.type==='vehicle'?'Vehículo disponible':'Publicación destacada'}</div><h1>${item.title}</h1><div class="spec-grid">${item.type==='vehicle'?`<div class="spec"><b>${item.year}</b><span>Año</span></div><div class="spec"><b>${item.kms}</b><span>Kilometraje</span></div><div class="spec"><b>${item.fuel}</b><span>Combustible</span></div>`:`<div class="spec"><b>${item.area||'-'} ${item.areaUnit||'m²'}</b><span>Área</span></div>`}</div><div class="price">${money(item.price)}</div><div class="location">⌖ ${item.location}</div><div class="contact-row"><a class="btn btn-primary" href="tel:3112023715">☎ Llamar ahora</a><a class="btn btn-lime" href="https://wa.me/573112023715?text=Hola%2C%20estoy%20interesado%20en%20${encodeURIComponent(item.title)}" target="_blank">◉ WhatsApp</a></div><button class="btn btn-outline" style="width:100%" data-action="share">↗ Compartir publicación</button></aside></div><section class="detail-location" id="publication-map"><div class="eyebrow">Ubicación</div><h2>Encuentra esta publicación</h2><div class="embedded-map" data-detail-map data-location="${encodeURIComponent(item.location)}"><div class="map-loading">Cargando mapa...</div></div></section><section class="detail-section"><div class="eyebrow">Conoce más</div><h2>Sobre esta publicación</h2><p>${item.desc}</p><p class="meta">Publicado por ${state.user?.name||contact.name} · Información verificada por Finca Raíz Machetá</p></section>${Array.isArray(item.videos)&&item.videos.length?`<section class="detail-section"><div class="eyebrow">Multimedia</div><h2>Videos</h2><div class="video-gallery">${item.videos.map(url=>`<video style="max-width:100%;margin:10px 0;border-radius:8px;background:#000" controls><source src="${url}" type="video/mp4">Tu navegador no soporta videos.</video>`).join('')}</div></section>`:''}</main>`}
function login(){return `<main class="auth-wrap"><section class="auth-art"><p class="kicker">Finca Raíz Machetá</p><h1>Lo bueno de encontrar un lugar propio.</h1><p>Administra tus publicaciones y conecta con nuevas oportunidades.</p></section><section class="auth-form"><form class="form-box" id="login-form"><h2>Bienvenido de nuevo</h2><p>Ingresa a tu cuenta para continuar.</p><button type="button" class="btn google-btn" data-action="google" style="width:100%"><img class="google-mark" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">Continuar con Google</button><div class="field" style="margin-top:18px"><label>Correo electrónico</label><input name="email" type="email" required placeholder="tu@correo.com"></div><div class="field"><label>Contraseña</label><input name="password" type="password" required placeholder="••••••••"></div><button class="btn btn-primary" style="width:100%">Iniciar sesión</button><p style="text-align:center;margin-top:20px">¿Aún no tienes cuenta? <a href="#" data-nav="register" style="color:var(--green);font-weight:700">Regístrate</a></p></form></section></main>`}
function register(){return `<main class="auth-wrap"><section class="auth-art"><p class="kicker">Únete a la comunidad</p><h1>Publica lo que hace especial a tu tierra.</h1><p>Tu anuncio llegará a personas buscando algo auténtico en Colombia.</p></section><section class="auth-form"><form class="form-box" id="register-form"><h2>Crea tu cuenta</h2><p>Cualquier usuario registrado puede publicar anuncios.</p><button type="button" class="btn google-btn" data-action="google" style="width:100%"><img class="google-mark" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="">Registrarse con Google</button><div class="field" style="margin-top:18px"><label>Nombre completo</label><input name="name" required placeholder="Tu nombre"></div><div class="field"><label>Correo electrónico</label><input name="email" type="email" required placeholder="tu@correo.com"></div><div class="field"><label>Contraseña</label><input name="password" type="password" minlength="6" required placeholder="Mínimo 6 caracteres"></div><button class="btn btn-primary" style="width:100%">Crear cuenta</button><p style="text-align:center;margin-top:20px">¿Ya tienes cuenta? <a href="#" data-nav="login" style="color:var(--green);font-weight:700">Inicia sesión</a></p></form></section></main>`}
function publish(){if(!state.user)return login();if(!canPublish())return '<main class="page container"><div class="empty"><h2>Publicación restringida</h2><p>Solo el administrador puede crear publicaciones.</p></div></main>';return `<main class="page container"><div class="page-title"><div class="eyebrow">Comparte una oportunidad</div><h1>Publicar anuncio</h1><p>Cuéntanos qué tienes para ofrecer.</p></div><form class="panel" id="publish-form"><div class="form-grid"><div class="field"><label>Título</label><input name="title" required placeholder="Ej. Finca El Paraíso"></div><div class="field"><label>Tipo de publicación</label><select name="type"><option value="property">Finca o propiedad</option><option value="vehicle">Vehículo</option></select></div><div class="field"><label>Precio en COP</label><input name="price" type="text" inputmode="numeric" required placeholder="350.000.000"></div><div class="field location-field"><label>Municipio / ubicación</label><input name="location" required placeholder="Machetá, Cundinamarca"><button type="button" class="btn btn-outline map-location-button" data-action="map-location">Seleccionar ubicación en el mapa</button><small class="meta map-location-help">Elige el punto exacto en el mapa satelital.</small></div><div class="field full"><label>Portada</label><div class="cover-crop-control"><input name="coverImage" type="file" accept="image/*"><button type="button" class="btn btn-outline btn-small" data-action="adjust-cover">Ajustar recorte</button><input type="hidden" name="coverPosition" value="50% 50%"><small class="meta">Sube la foto y ajústala como en WhatsApp para que quede bien recortada.</small></div></div><div class="field full"><label>Descripción</label><textarea name="desc" rows="5" placeholder="Describe los detalles más importantes..."></textarea></div></div><div class="confirm-actions" style="margin-top:20px;justify-content:flex-start"><button type="button" class="btn btn-outline" data-action="save-draft">Guardar borrador</button><button type="button" class="btn btn-quiet" data-action="clear-draft">Borrar borrador</button></div><button class="btn btn-primary" style="margin-top:20px">Enviar publicación</button></form></main>`}
function dashboard(){if(!state.user)return login();const own=listings.filter(x=>x.owner===state.user.email || x.owner===state.user.id);return `<main class="dashboard"><div class="container"><div class="section-head"><div><div class="eyebrow">Espacio personal</div><h1 style="font-size:38px">Hola, ${state.user.name.split(' ')[0]}</h1><p>Gestiona tus anuncios y mantén tu información al día.</p></div><button class="btn btn-primary" data-nav="publish">+ Nueva publicación</button></div><div class="stats"><div class="stat"><span>Mis publicaciones</span><strong>${own.length}</strong></div><div class="stat"><span>Publicaciones activas</span><strong>${own.length}</strong></div><div class="stat"><span>Consultas recibidas</span><strong>12</strong></div><div class="stat"><span>Tu rol</span><strong style="font-size:20px">${state.user.role==='admin'?'Admin':'Usuario'}</strong></div></div><div class="dash-grid"><section class="panel"><h3>Mis publicaciones</h3>${own.length?own.map(x=>`<div class="listing-row ${x.type==='vehicle'?'vehicle-listing':'property-listing'}"><div class="listing-thumb" style="${imageStyle(x.image)}"></div><div class="listing-info"><b>${x.title}</b><small class="meta">${money(x.price)} · ${x.location}</small></div><div class="listing-actions"><span class="status">Activa</span><button class="btn btn-outline btn-small" data-edit-listing="${x.id}" title="Editar publicación">Editar</button><button class="btn btn-outline btn-small" data-delete="${x.id}" title="Eliminar publicación">Eliminar</button></div></div>`).join(''):'<div class="empty">Aún no tienes publicaciones.</div>'}</section><section class="panel"><h3>Contacto de Finca Raíz Machetá</h3><p class="meta">Tu publicación incluye botones de contacto directos.</p><div class="list-row"><span>☎ ${contact.phone}</span><span class="status">Configurado</span></div><div class="list-row"><span>◉ WhatsApp</span><span class="status">Activo</span></div>${canPublish()?'<button class="btn btn-outline btn-small" data-action="contact">Editar datos de contacto</button>':''}</section></div></div></main>`}
function bindMediaGallery(){const thumbs=document.querySelectorAll('.gallery-thumbs .thumb');if(!thumbs.length)return;const main=document.querySelector('[data-gallery-main]');if(!main)return;thumbs.forEach(thumb=>thumb.addEventListener('click',()=>{const idx=Number(thumb.dataset.galleryIdx||0);const mediaEntries=getMediaEntries(state.selected||{});const entry=mediaEntries[idx]||mediaEntries[0];if(!entry||!entry.url)return;main.innerHTML=entry.type==='video'?`<video class="gallery-video" controls playsinline preload="metadata" src="${entry.url}" style="width:100%;height:100%;object-fit:cover;background:#000;border-radius:12px;"></video>`:`<div class="gallery-main-image" style="${imageStyle(entry.url, 'center', 'contain')}"></div>`;thumbs.forEach(item=>item.classList.toggle('active',item===thumb));main.insertAdjacentHTML('beforeend','<span class="badge">'+(state.selected?.category||'Video')+'</span>');}));}function render(){const existingMusic=document.getElementById('bg-music');const savedMusic=existingMusic?{currentTime:existingMusic.currentTime||0,paused:existingMusic.paused,muted:existingMusic.muted,volume:existingMusic.volume}:null;let body=state.view==='home'?home():state.view==='properties'?catalog('property'):state.view==='vehicles'?catalog('vehicle'):state.view==='detail'?detail(state.selected):state.view==='presentation'?presentation():state.view==='login'?login():state.view==='register'?register():state.view==='publish'?publish():dashboard();app.innerHTML=header()+body+(state.view==='home'?`<footer class="footer"><div class="container footer-grid"><div><div class="brand"><span class="brand-mark">⌂</span> Finca Raíz Machetá</div><p>Conectamos personas con lugares, oportunidades y caminos en el corazón de Cundinamarca.</p></div><div><h4>Explora</h4><a href="#" data-nav="properties">Fincas y propiedades</a><br><a href="#" data-nav="vehicles">Vehículos</a></div><div><h4>Contacto</h4><p>${contact.name}<br>${contact.phone}<br>WhatsApp disponible</p></div></div></footer>`:'')+`<div class="mobile-bar"><a href="tel:3112023715">☎ Llamar</a><a href="https://wa.me/573112023715" target="_blank">◉ WhatsApp</a></div>`;bind();bindMediaGallery();const newMusic=document.getElementById('bg-music');if(newMusic&&savedMusic){newMusic.currentTime=savedMusic.currentTime;newMusic.muted=savedMusic.muted;newMusic.volume=savedMusic.volume;if(!savedMusic.paused){newMusic.play().catch(()=>{})}}}
function bind(){document.querySelectorAll('[data-nav]').forEach(el=>el.onclick=e=>{e.preventDefault();navigate(el.dataset.nav)});document.querySelectorAll('[data-detail]').forEach(el=>el.onclick=()=>navigate('detail',listings.find(x=>x.id==el.dataset.detail)));document.querySelectorAll('[data-action="logout"]').forEach(el=>el.onclick=async()=>{if(supabaseClient)await supabaseClient.auth.signOut();state.user=null;navigate('home');toast('Sesión cerrada')});document.getElementById('login-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);if(!supabaseClient){toast('Configura Supabase para iniciar sesión.');return}const {error}=await supabaseClient.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error){toast(error.message);return}await loadSupabaseData();navigate('my');toast('Bienvenido a Finca Raíz Machetá')});document.getElementById('register-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.target);if(!supabaseClient){toast('Configura Supabase para crear una cuenta.');return}const {data,error}=await supabaseClient.auth.signUp({email:f.get('email'),password:f.get('password'),options:{data:{name:f.get('name')}}});if(error){toast(error.message);return}if(!data.session){toast('Revisa tu correo para confirmar la cuenta.');return}await loadSupabaseData();navigate('my');toast('Cuenta creada correctamente.')});document.querySelector('[data-action="search"]')?.addEventListener('click',()=>{state.query=document.getElementById('home-query').value;navigate(document.getElementById('home-type').value==='vehicle'?'vehicles':'properties')});document.querySelector('[data-action="catalog-search"]')?.addEventListener('click',()=>{state.query=document.getElementById('catalog-query').value;render()});document.querySelector('[data-action="share"]')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('Enlace copiado al portapapeles')}catch{toast('Puedes copiar el enlace desde la barra del navegador')}});document.querySelector('[data-action="contact"]')?.addEventListener('click',()=>toast('Los datos de contacto están listos para personalizar desde tu panel.'));const musicToggle=document.getElementById('music-toggle');const bgMusic=document.getElementById('bg-music');if(musicToggle&&bgMusic){if(!bgMusic.src || !bgMusic.src.includes('Finca%20raiz%20Macheta.mp3') && !bgMusic.src.includes('Finca raiz Macheta.mp3'))bgMusic.src='assets/Finca raiz Macheta.mp3';bgMusic.preload='auto';bgMusic.loop=true;let isPlaying=!bgMusic.paused;if(!bgMusic.muted && bgMusic.paused){const playPromise=bgMusic.play();if(playPromise&&typeof playPromise.then==='function'){playPromise.catch(()=>{})}isPlaying=true}musicToggle.textContent=isPlaying?'🔇':'🔊';musicToggle.title=isPlaying?'Silenciar música':'Activar música';musicToggle.addEventListener('click',()=>{if(isPlaying){bgMusic.pause();bgMusic.muted=true;musicToggle.textContent='🔊';musicToggle.title='Activar música'}else{bgMusic.currentTime=0;bgMusic.muted=false;const playPromise=bgMusic.play();if(playPromise&&typeof playPromise.then==='function'){playPromise.catch(()=>{})}musicToggle.textContent='🔇';musicToggle.title='Silenciar música'}isPlaying=!isPlaying})};document.querySelectorAll('.gallery-thumbs .thumb').forEach(thumb=>thumb.addEventListener('click',()=>{const idx=Number(thumb.dataset.galleryIdx||0);const allImages=Array.isArray(state.selected?.images)&&state.selected.images.length?state.selected.images:[state.selected?.image].filter(Boolean);const main=document.querySelector('[data-gallery-main]');if(main&&allImages[idx]){main.style.backgroundImage=`url('${allImages[idx]}')`;document.querySelectorAll('.gallery-thumbs .thumb').forEach(t=>t.classList.remove('active'));thumb.classList.add('active')}}))}
function confirmDelete(){return new Promise(resolve=>{const root=document.getElementById('modal-root');root.innerHTML='<div class="modal-backdrop"><section class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div class="modal-head"><h2 id="confirm-title">Eliminar publicación</h2><button class="close" data-confirm="cancel" aria-label="Cerrar">&times;</button></div><p>¿Seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p><div class="confirm-actions"><button class="btn btn-outline" data-confirm="cancel">Cancelar</button><button class="btn btn-danger" data-confirm="delete">Eliminar</button></div></section></div>';root.querySelectorAll('[data-confirm]').forEach(button=>button.addEventListener('click',()=>{root.innerHTML='';resolve(button.dataset.confirm==='delete')}))})}
function escapeHtml(value){return String(value ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')} 
function openEditListingModal(item){
  const root=document.getElementById('modal-root');
  if(!root||!item)return;
  const currentType=item.type || 'property';
  const isVehicle=currentType==='vehicle';
  const locationValue=escapeHtml(item.location || '');
  const descValue=escapeHtml(item.desc || '');
  const propertyTypeValue=item.propertyType || 'Casa';
  const areaValue=Number(item.area || 0);
  const areaUnitValue=item.areaUnit || 'm²';

  let vehicleFields='';
  if(isVehicle){
    vehicleFields =
      '<div class="field"><label>Marca</label><input name="brand" value="'+escapeHtml(item.brand || '')+'" placeholder="Ej. Toyota"></div>' +
      '<div class="field"><label>Modelo</label><input name="model" value="'+escapeHtml(item.model || '')+'" placeholder="Ej. Hilux"></div>' +
      '<div class="field"><label>Año</label><input name="year" type="number" min="1900" max="2100" value="'+escapeHtml(item.year || '')+'" placeholder="Ej. 2022"></div>' +
      '<div class="field"><label>Kilometraje</label><input name="kms" type="number" min="0" value="'+escapeHtml(item.kms || '')+'" placeholder="Ej. 45000"></div>' +
      '<div class="field"><label>Combustible</label><select name="fuel"><option value="">Seleccionar</option><option value="Gasolina" '+(item.fuel==='Gasolina'?'selected':'')+'>Gasolina</option><option value="Diésel" '+(item.fuel==='Diésel'?'selected':'')+'>Diésel</option><option value="Híbrido" '+(item.fuel==='Híbrido'?'selected':'')+'>Híbrido</option><option value="Eléctrico" '+(item.fuel==='Eléctrico'?'selected':'')+'>Eléctrico</option></select></div>' +
      '<div class="field"><label>Transmisión</label><select name="transmission"><option value="">Seleccionar</option><option value="Manual" '+(item.transmission==='Manual'?'selected':'')+'>Manual</option><option value="Automática" '+(item.transmission==='Automática'?'selected':'')+'>Automática</option></select></div>';
  } else {
    vehicleFields =
      '<div class="field"><label>Tipo de inmueble</label><select name="propertyType"><option value="Casa" '+(propertyTypeValue==='Casa'?'selected':'')+'>Casa</option><option value="Finca" '+(propertyTypeValue==='Finca'?'selected':'')+'>Finca</option><option value="Lote" '+(propertyTypeValue==='Lote'?'selected':'')+'>Lote</option><option value="Apartamento" '+(propertyTypeValue==='Apartamento'?'selected':'')+'>Apartamento</option></select></div>' +
      '<div class="field"><label>Área</label><div class="area-input"><input name="area" type="number" min="0.01" step="0.01" value="'+escapeHtml(areaValue || '')+'" placeholder="Ej. 1200"><select name="areaUnit"><option value="m²" '+(areaUnitValue==='m²'?'selected':'')+'>m²</option><option value="hectáreas" '+(areaUnitValue==='hectáreas'?'selected':'')+'>Hectáreas</option></select></div></div>' +
      '<div class="field"><label>Habitaciones</label><input name="bedrooms" type="number" min="0" value="'+escapeHtml(item.bedrooms || '')+'" placeholder="Ej. 3"></div>' +
      '<div class="field"><label>Baños</label><input name="bathrooms" type="number" min="0" value="'+escapeHtml(item.bathrooms || '')+'" placeholder="Ej. 2"></div>' +
      '<div class="field"><label>Parqueaderos</label><input name="parking" type="number" min="0" value="'+escapeHtml(item.parking || '')+'" placeholder="Ej. 1"></div>' +
      '<div class="field"><label>Acceso</label><select name="access"><option value="">Seleccionar</option><option value="Vía pavimentada" '+(item.access==='Vía pavimentada'?'selected':'')+'>Vía pavimentada</option><option value="Vía destapada" '+(item.access==='Vía destapada'?'selected':'')+'>Vía destapada</option><option value="Carretera" '+(item.access==='Carretera'?'selected':'')+'>Carretera</option><option value="Camino de tierra" '+(item.access==='Camino de tierra'?'selected':'')+'>Camino de tierra</option></select></div>';
  }



  const coverImg = item.image ? '<div class="media-preview"><img src="'+item.image+'" alt="Portada" style="max-width:100px;height:auto"><button type="button" class="btn btn-danger btn-small" data-remove-cover>Eliminar portada</button></div>' : '<div class="meta">Sin imagen de portada</div>';
  
  const galleryImages = Array.isArray(item.images) && item.images.length ? item.images.map((url, idx) => '<div class="media-preview" style="display:inline-block;margin:5px"><img src="'+url+'" alt="Imagen '+idx+'" style="max-width:80px;height:80px;object-fit:cover"><button type="button" class="btn btn-danger btn-tiny" data-remove-image="'+idx+'" style="display:block;width:100%">✕</button></div>').join('') : '<div class="meta">Sin imágenes adicionales</div>';
  
  const videoList = Array.isArray(item.videos) && item.videos.length ? item.videos.map((url, idx) => '<div class="media-preview" style="margin:5px 0"><small>'+url.substring(url.lastIndexOf('/')+1,url.length)+'</small><button type="button" class="btn btn-danger btn-small" data-remove-video="'+idx+'">Eliminar</button></div>').join('') : '<div class="meta">Sin videos</div>';

  root.innerHTML =
    '<div class="modal-backdrop">' +
    '<section class="modal location-modal" role="dialog" aria-modal="true" aria-labelledby="location-title" style="max-height:90vh;overflow-y:auto">' +
    '<div class="modal-head"><h2 id="location-title">Editar publicación</h2><button class="close" data-location-close aria-label="Cerrar">&times;</button></div>' +
    '<form id="edit-listing-form" data-item-id="'+item.id+'" enctype="multipart/form-data">' +
    '<div class="form-grid">' +
    '<div class="field"><label>Título</label><input type="text" name="title" value="'+escapeHtml(item.title || '')+'" required></div>' +
    '<div class="field"><label>Tipo</label><select name="type"><option value="property" '+(currentType==='property'?'selected':'')+'>Propiedad</option><option value="vehicle" '+(isVehicle?'selected':'')+'>Vehículo</option></select></div>' +
    '<div class="field"><label>Precio en COP</label><input type="number" name="price" value="'+Number(item.price || 0)+'" min="0" required></div>' +
    '<div class="field"><label>Municipio / Ubicación</label><input type="text" name="location" value="'+locationValue+'" required placeholder="Machetá, Cundinamarca"></div>' +
    '<div class="field"><button type="button" class="btn btn-outline" data-location-map>Seleccionar en el mapa</button></div>' +
    '<div class="field"><label>Enfoque de portada</label><select name="coverPosition"><option value="center" '+((item.cover_position||'center')==='center'?'selected':'')+'>Centrado</option><option value="top" '+((item.cover_position||'center')==='top'?'selected':'')+'>Superior</option><option value="bottom" '+((item.cover_position||'center')==='bottom'?'selected':'')+'>Inferior</option><option value="left" '+((item.cover_position||'center')==='left'?'selected':'')+'>Izquierda</option><option value="right" '+((item.cover_position||'center')==='right'?'selected':'')+'>Derecha</option></select><small class="meta">Ajusta el recorte de la imagen principal.</small></div>' +
    '<div class="field full"><label>Portada actual</label>'+coverImg+'<label style="margin-top:10px">Reemplazar portada</label><input type="file" name="coverImage" accept="image/*"><small class="meta">Selecciona una nueva imagen para la portada</small></div>' +
    '<div class="field full"><label>Galerías de imágenes</label><div style="border:1px solid #ccc;padding:10px;border-radius:4px;margin-bottom:10px">'+galleryImages+'</div><label>Agregar más imágenes</label><input type="file" name="galleryImages" accept="image/*" multiple><small class="meta">Puedes agregar varias imágenes</small></div>' +
    '<div class="field full"><label>Videos</label><div style="border:1px solid #ccc;padding:10px;border-radius:4px;margin-bottom:10px">'+videoList+'</div><label>Agregar videos</label><input type="file" name="videoFiles" accept="video/*" multiple><small class="meta">Máximo 5 videos y 50 MB por archivo.</small></div>' +
    '<div class="field full"><label>Descripción</label><textarea name="desc" rows="5" required>'+descValue+'</textarea></div>' +
    vehicleFields +
    '</div>' +
    '<div class="confirm-actions"><button type="button" class="btn btn-outline" data-location-close>Cancelar</button><button type="submit" class="btn btn-primary">Guardar cambios</button></div>' +
    '</form></section></div>';

  const close = () => { root.innerHTML = ''; };
  const closeButton = root.querySelector('[data-location-close]');
  closeButton?.addEventListener('click', close);

  // Manejar eliminación de portada
  root.querySelector('[data-remove-cover]')?.addEventListener('click', e => {
    e.preventDefault();
    root.querySelector('[data-remove-cover]').parentElement.innerHTML = '<div class="meta">Portada eliminada</div>';
    root.querySelector('input[name="coverImage"]').dataset.removeCover = 'true';
  });

  // Manejar eliminación de imágenes de galería
  Array.from(root.querySelectorAll('[data-remove-image]')).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const idx = btn.dataset.removeImage;
      btn.parentElement.remove();
      if(!root.querySelector('[data-remove-image]') && !root.querySelector('.media-preview img[alt*="Imagen"]')){
        const container = root.querySelector('[data-remove-image]')?.parentElement?.parentElement || root.querySelector('.field:nth-of-type(8)');
        if(container) container.innerHTML = '<div class="meta">Sin imágenes adicionales</div>';
      }
      const deletedList = root.querySelector('input[name="galleryImages"]').dataset.deletedImages || '';
      root.querySelector('input[name="galleryImages"]').dataset.deletedImages = deletedList ? deletedList + ',' + idx : idx;
    });
  });

  // Manejar eliminación de videos
  Array.from(root.querySelectorAll('[data-remove-video]')).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const idx = btn.dataset.removeVideo;
      btn.parentElement.remove();
      const deletedList = root.querySelector('input[name="videoFiles"]').dataset.deletedVideos || '';
      root.querySelector('input[name="videoFiles"]').dataset.deletedVideos = deletedList ? deletedList + ',' + idx : idx;
    });
  });

  root.querySelector('[data-location-map]')?.addEventListener('click', () => {
    const locationInput = root.querySelector('input[name="location"]');
    if(!locationInput)return;
    openMapPickerForField(locationInput, () => {});
  });

  const form = root.querySelector('#edit-listing-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const title = form.querySelector('[name="title"]').value.trim();
    const type = form.querySelector('[name="type"]').value;
    const price = Number(form.querySelector('[name="price"]').value);
    const location = form.querySelector('[name="location"]').value.trim();
    const desc = form.querySelector('[name="desc"]').value.trim();
    const coverPosition = form.querySelector('[name="coverPosition"]').value || 'center';

    if(!title || !location || !desc || !Number.isFinite(price) || price <= 0){
      toast('Completa título, ubicación, descripción y precio válidos.');
      return;
    }

    if(!supabaseClient || !state.user?.id){
      toast('Inicia sesión para guardar cambios.');
      return;
    }

    toast('Guardando cambios...');

    const baseData = {title, type, price, location, cover_position: coverPosition};

    // Procesar imagen de portada (reemplazar)
    const coverImageInput = form.querySelector('[name="coverImage"]');
    let finalCoverUrl = item.image || null;
    if(coverImageInput?.dataset.removeCover === 'true'){
      finalCoverUrl = null;
      baseData.image = null;
    } else if(coverImageInput?.files?.length > 0){
      try{
        const coverUrl = await uploadMedia(coverImageInput.files[0], 'images');
        finalCoverUrl = coverUrl;
        baseData.image = coverUrl;
      }catch(err){
        toast('Error al subir imagen de portada: ' + err.message);
        return;
      }
    } else {
      baseData.image = item.image || null;
    }

    // Procesar galería de imágenes (agregar nuevas, eliminar seleccionadas)
    let finalImages = Array.isArray(item.images) ? [...item.images] : [];
    finalImages = finalImages.filter(url => url !== item.image || finalCoverUrl !== null);
    if(finalCoverUrl && !finalImages.includes(finalCoverUrl)){
      finalImages = [finalCoverUrl, ...finalImages.filter(url => url !== finalCoverUrl)];
    }
    const deletedImageIds = (form.querySelector('[name="galleryImages"]').dataset.deletedImages || '').split(',').filter(Boolean).map(Number);
    finalImages = finalImages.filter((_, idx) => !deletedImageIds.includes(idx));
    
    const galleryInput = form.querySelector('[name="galleryImages"]');
    if(galleryInput?.files?.length > 0){
      try{
        const newImageUrls = await Promise.all(Array.from(galleryInput.files).map(file => uploadMedia(file, 'images')));
        finalImages = [...finalImages, ...newImageUrls];
      }catch(err){
        toast('Error al subir imágenes: ' + err.message);
        return;
      }
    }
    if(finalImages.length > 0) baseData.images = finalImages;

    // Procesar videos (agregar nuevos, eliminar seleccionados)
    let finalVideos = Array.isArray(item.videos) ? [...item.videos] : [];
    const deletedVideoIds = (form.querySelector('[name="videoFiles"]').dataset.deletedVideos || '').split(',').filter(Boolean).map(Number);
    finalVideos = finalVideos.filter((_, idx) => !deletedVideoIds.includes(idx));
    
    const videoInput = form.querySelector('[name="videoFiles"]');
    if(videoInput?.files?.length > 0){
      try{
        const newVideoUrls = await Promise.all(Array.from(videoInput.files).map(file => uploadMedia(file, 'videos')));
        finalVideos = [...finalVideos, ...newVideoUrls];
      }catch(err){
        toast('Error al subir videos: ' + err.message);
        return;
      }
    }
    if(finalVideos.length > 0) baseData.videos = finalVideos;

    const typeSpecificSpecs = type === 'vehicle'
      ? {
          brand: form.querySelector('[name="brand"]').value.trim(),
          model: form.querySelector('[name="model"]').value.trim(),
          year: form.querySelector('[name="year"]').value || null,
          kms: form.querySelector('[name="kms"]').value || null,
          fuel: form.querySelector('[name="fuel"]').value || null,
          transmission: form.querySelector('[name="transmission"]').value || null,
        }
      : {
          propertyType: form.querySelector('[name="propertyType"]').value || null,
          bedrooms: form.querySelector('[name="bedrooms"]').value || null,
          bathrooms: form.querySelector('[name="bathrooms"]').value || null,
          parking: form.querySelector('[name="parking"]').value || null,
          access: form.querySelector('[name="access"]').value || null,
        };

    const metadata = `<!--specs:${encodeURIComponent(JSON.stringify(typeSpecificSpecs))}-->`;
    const descriptionText = `${desc}${type === 'vehicle' ? '' : `\n<!--area:${Number(form.querySelector('[name="area"]')?.value || 0)}:${form.querySelector('[name="areaUnit"]')?.value || 'm²'}-->`}${metadata}`;
    const textFields = await resolveListingTextColumns();
    const updatePayload = {...baseData};
    if(textFields.includes('description')) updatePayload.description = descriptionText;
    if(textFields.includes('desc')) updatePayload.desc = descriptionText;

    const {data:currentOwner, error:ownerError} = await supabaseClient.from('listings').select('owner').eq('id', item.id).maybeSingle();
    if(ownerError){
      toast(ownerError.message);
      return;
    }
    if(!currentOwner || (currentOwner.owner !== state.user.id && currentOwner.owner !== state.user.email)){
      toast('No tienes permiso para editar esta publicación.');
      return;
    }

    if(finalCoverUrl && !updatePayload.images) updatePayload.images = [finalCoverUrl];
    if(finalCoverUrl && updatePayload.images && !updatePayload.images.includes(finalCoverUrl)) updatePayload.images = [finalCoverUrl, ...updatePayload.images.filter(url => url !== finalCoverUrl)];

    const safeUpdatePayload = safeListingPayload(updatePayload);
    let {error} = await supabaseClient.from('listings').update(safeUpdatePayload).eq('id', item.id).select().single();
    if(error && /column|could not find/i.test(error.message)){
      const fallbackUpdate = safeListingPayload(updatePayload);
      const retry = await supabaseClient.from('listings').update(fallbackUpdate).eq('id', item.id).select().single();
      error = retry.error;
    }
    if(error){
      toast(error.message);
      return;
    }

    await loadSupabaseData();
    close();
    navigate('my');
    toast('Publicación actualizada correctamente');
  });
}function openMapPickerForField(targetInput,onSelect){const root=document.getElementById('modal-root');root.innerHTML='<div class="modal-backdrop"><section class="modal map-modal" role="dialog" aria-modal="true" aria-labelledby="map-title"><div class="modal-head"><h2 id="map-title">Selecciona la ubicación</h2><button class="close" data-map-close aria-label="Cerrar">&times;</button></div><p class="meta">Haz clic en el punto exacto. Puedes cambiar entre mapa y satélite.</p><div id="location-map"></div><div class="map-selected meta" id="map-selected">Ninguna ubicación seleccionada</div><div class="confirm-actions"><button class="btn btn-outline" data-map-close>Cancelar</button><button class="btn btn-primary" data-map-use disabled>Usar esta ubicación</button></div></section></div>';const initial=[5.0817,-73.6085];const map=L.map('location-map').setView(initial,13);const streetLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'});const satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri, Maxar, Earthstar Geographics'});streetLayer.addTo(map);L.control.layers({'Mapa':streetLayer,'Satélite':satelliteLayer},null,{position:'topright',collapsed:false}).addTo(map);let marker=null;let selectedAddress='';const close=()=>{map.remove();root.innerHTML=''};root.querySelectorAll('[data-map-close]').forEach(button=>button.addEventListener('click',close));root.querySelector('[data-map-use]').addEventListener('click',()=>{if(!selectedAddress)return;targetInput.value=selectedAddress;close();if(onSelect)onSelect(selectedAddress);else toast('Ubicación agregada correctamente')});map.on('click',async event=>{if(marker)marker.setLatLng(event.latlng);else marker=L.marker(event.latlng).addTo(map);const selected=root.querySelector('#map-selected');selected.textContent='Buscando dirección...';try{const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${event.latlng.lat}&lon=${event.latlng.lng}`);const result=await response.json();selectedAddress=result?.address?`${result.address.city || result.address.town || result.address.village || result.address.municipality || result.address.county || 'Ubicación'}${result.address.state ? ', '+result.address.state : ''}${result.address.country ? ', '+result.address.country : ''}`:(event.latlng.lat.toFixed(5)+', '+event.latlng.lng.toFixed(5));selected.textContent=selectedAddress;root.querySelector('[data-map-use]').disabled=false}catch(error){selectedAddress=`${event.latlng.lat.toFixed(5)}, ${event.latlng.lng.toFixed(5)}`;selected.textContent=selectedAddress;root.querySelector('[data-map-use]').disabled=false}})}
document.addEventListener('click',async event=>{const google=event.target.closest('[data-action="google"]');if(google){if(!supabaseClient){toast('Configura Supabase para usar Google.');return}const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.href}});if(error)toast(error.message);return}const editListing=event.target.closest('[data-edit-listing]');if(editListing){if(!supabaseClient||!state.user?.id)return;const item=listings.find(value=>String(value.id)===editListing.dataset.editListing);if(!item)return;openEditListingModal(item);return}const remove=event.target.closest('[data-delete]');if(!remove||!supabaseClient)return;if(!await confirmDelete())return;const {error}=await supabaseClient.from('listings').delete().eq('id',remove.dataset.delete).eq('owner',state.user.id);if(error){toast(error.message);return}listings=listings.filter(item=>String(item.id)!==remove.dataset.delete);render();toast('Publicación eliminada')});
document.addEventListener('click',async event=>{const google=event.target.closest('[data-action="google"]');if(!google)return;event.stopImmediatePropagation();if(!supabaseClient){toast('Configura Supabase para usar Google.');return}const redirectTo=`${window.location.origin}${window.location.pathname}`;const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options:{redirectTo}});if(error)toast(`Google: ${error.message}`)},true);
function setInputFiles(input,files){const transfer=new DataTransfer();files.forEach(file=>transfer.items.add(file));input.files=transfer.files}
function bindMediaRemoveButtons(input){if(!input||input.dataset.mediaBound)return;input.dataset.mediaBound='true';const field=input.closest('.field');if(!field)return;const preview=document.createElement('div');preview.className='selected-media-preview';preview.style.marginTop='8px';field.appendChild(preview);const refresh=()=>{const files=Array.from(input.files||[]);if(!files.length){preview.innerHTML='<div class="meta">Sin archivos seleccionados</div>';return;}preview.innerHTML=files.map((file,index)=>`<div class="media-preview" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0;padding:8px;border:1px solid #dfe7df;border-radius:8px;background:#f7faf7"><div style="display:flex;align-items:center;gap:10px;min-width:0"><span style="display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;background:${file.type.startsWith('video/')?'#e8f7d3':'#dff7e8'};font-size:16px">${file.type.startsWith('video/')?'🎬':'🖼️'}</span><small style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${file.name}</small></div><button type="button" class="btn btn-danger btn-tiny" data-remove-media-index="${index}">Quitar</button></div>`).join('');preview.querySelectorAll('[data-remove-media-index]').forEach(button=>button.addEventListener('click',()=>{const current=Array.from(input.files||[]);const next=current.filter((_,idx)=>idx!==Number(button.dataset.removeMediaIndex));setInputFiles(input,next);refresh()}));};input.addEventListener('change',refresh);refresh();}
function bindCoverCropper(input){if(!input||input.dataset.cropBound)return;input.dataset.cropBound='true';const form=input.closest('form');const hidden=form?.querySelector('[name="coverPosition"]');const trigger=form?.querySelector('[data-action="adjust-cover"]');if(!hidden||!trigger)return;input.addEventListener('change',()=>{if(input.files?.length)openCoverCropper(input,hidden)});trigger.addEventListener('click',()=>{if(!input.files?.length){toast('Primero selecciona una imagen para la portada.');return}openCoverCropper(input,hidden)})}
function readImageFromFile(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file);const image=new Image();image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer la imagen.'))};image.src=url;})}
async function createCroppedFile(file, xPercent, yPercent, zoom=1.35){const image=await readImageFromFile(file);const outputSize=1200;const cropSize=Math.min(image.naturalWidth,image.naturalHeight)/zoom;const centerX=image.naturalWidth*(Number(xPercent || 50)/100);const centerY=image.naturalHeight*(Number(yPercent || 50)/100);const sx=Math.min(Math.max(centerX-cropSize/2,0),Math.max(0,image.naturalWidth-cropSize));const sy=Math.min(Math.max(centerY-cropSize/2,0),Math.max(0,image.naturalHeight-cropSize));const canvas=document.createElement('canvas');canvas.width=outputSize;canvas.height=outputSize;const context=canvas.getContext('2d');context.fillStyle='#000000';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,sx,sy,cropSize,cropSize,0,0,outputSize,outputSize);return new Promise(resolve=>canvas.toBlob(blob=>resolve(new File([blob],file.name || 'cover.jpg',{type:'image/jpeg'})), 'image/jpeg', 0.82));}
function openCoverCropper(input, hiddenInput){const file=input.files?.[0];const root=document.getElementById('modal-root');if(!file||!root)return;const objectUrl=URL.createObjectURL(file);const img=document.createElement('img');img.onload=()=>{let offsetX=0;let offsetY=0;let scale=1.35;root.innerHTML=`<div class="modal-backdrop"><section class="modal crop-modal" role="dialog" aria-modal="true" aria-labelledby="crop-title"><div class="modal-head"><h2 id="crop-title">Ajusta la portada</h2><button class="close" data-crop-close aria-label="Cerrar">&times;</button></div><div class="cover-cropper-wrapper"><div class="cover-cropper-frame" id="cover-cropper-frame"><img id="cover-cropper-image" src="${objectUrl}" alt="Imagen a ajustar"></div></div><div class="cover-cropper-tools"><label for="cover-cropper-zoom">Zoom</label><input id="cover-cropper-zoom" type="range" min="1" max="2.5" step="0.05" value="1.35"></div><div class="confirm-actions"><button type="button" class="btn btn-outline" data-crop-close>Cancelar</button><button type="button" class="btn btn-primary" data-crop-apply>Listo</button></div></section></div>`;const frame=root.querySelector('#cover-cropper-frame');const image=root.querySelector('#cover-cropper-image');const zoomControl=root.querySelector('#cover-cropper-zoom');const clampPercent=(value,min,max)=>Math.min(max,Math.max(min,value));const getCoverValue=()=>{const width=img.naturalWidth*scale;const height=img.naturalHeight*scale;const maxX=Math.max(0,(width-frame.clientWidth)/2);const maxY=Math.max(0,(height-frame.clientHeight)/2);const pctX=maxX ? ((offsetX+maxX)/(maxX*2))*100 : 50;const pctY=maxY ? ((offsetY+maxY)/(maxY*2))*100 : 50;return `${clampPercent(pctX,0,100).toFixed(1)}% ${clampPercent(pctY,0,100).toFixed(1)}%`};const updateTransform=()=>{const width=img.naturalWidth*scale;const height=img.naturalHeight*scale;const maxX=Math.max(0,(width-frame.clientWidth)/2);const maxY=Math.max(0,(height-frame.clientHeight)/2);offsetX=Math.min(maxX,Math.max(-maxX,offsetX));offsetY=Math.min(maxY,Math.max(-maxY,offsetY));image.style.transform=`translate(${offsetX}px, ${offsetY}px) scale(${scale})`;};zoomControl.addEventListener('input',event=>{scale=Number(event.target.value||1.35);updateTransform();});let dragging=false;let startX=0;let startY=0;frame.addEventListener('pointerdown',event=>{dragging=true;startX=event.clientX-offsetX;startY=event.clientY-offsetY;frame.setPointerCapture(event.pointerId);});frame.addEventListener('pointermove',event=>{if(!dragging)return;offsetX=event.clientX-startX;offsetY=event.clientY-startY;updateTransform();});frame.addEventListener('pointerup',()=>{dragging=false});frame.addEventListener('pointerleave',()=>{dragging=false});root.querySelector('[data-crop-close]').addEventListener('click',()=>{URL.revokeObjectURL(objectUrl);root.innerHTML='' });root.querySelector('[data-crop-apply]').addEventListener('click',async()=>{const percent = getCoverValue();const value = percent.split(' ');const x = Number.parseFloat(value[0]) || 50;const y = Number.parseFloat(value[1]) || 50;const cropped = await createCroppedFile(file, x, y, scale);const transfer = new DataTransfer();transfer.items.add(cropped);input.files = transfer.files;hiddenInput.value = percent;URL.revokeObjectURL(objectUrl);root.innerHTML='';toast('Recorte de portada ajustado');});const refresh=()=>{if(!frame.clientWidth||!frame.clientHeight||!img.naturalWidth||!img.naturalHeight)return;updateTransform();};requestAnimationFrame(refresh);};img.src=objectUrl;}
function enhanceImageUpload(){const form=document.querySelector('#publish-form');if(!form||form.dataset.mediaEnhanced)return;form.dataset.mediaEnhanced='true';const existingCover=form.querySelector('input[name="coverImage"]');const existingGallery=form.querySelector('input[name="galleryImages"]');const existingVideo=form.querySelector('input[name="videoFiles"]');const hidden=form.querySelector('[name="coverPosition"]')||Object.assign(document.createElement('input'),{type:'hidden',name:'coverPosition',value:'50% 50%'});if(!form.querySelector('[name="coverPosition"]'))form.appendChild(hidden);if(existingCover)bindCoverCropper(existingCover);if(existingGallery)bindMediaRemoveButtons(existingGallery);if(existingVideo)bindMediaRemoveButtons(existingVideo);if(existingCover&&existingGallery&&existingVideo)return;const insertAfter=existingCover?existingCover.closest('.field'):form.querySelector('input[name="price"]')?.closest('.field')||form.querySelector('input[name="title"]')?.closest('.field')||form.querySelector('textarea[name="desc"]')?.closest('.field');const mediaMarkup='<div class="field gallery-upload"><label>Galería de imágenes</label><input name="galleryImages" type="file" accept="image/*" multiple><small class="meta">Puedes seleccionar hasta 10 imágenes adicionales.</small></div><div class="field video-upload"><label>Videos</label><input name="videoFiles" type="file" accept="video/*" multiple><small class="meta">Máximo 1 video y 50 MB por archivo.</small></div>';if(insertAfter){insertAfter.insertAdjacentHTML('afterend',mediaMarkup)}else{form.insertAdjacentHTML('beforeend',mediaMarkup)};const coverInput=form.querySelector('input[name="coverImage"]');if(coverInput){const hidden=form.querySelector('[name="coverPosition"]')||Object.assign(document.createElement('input'),{type:'hidden',name:'coverPosition',value:'50% 50%'});if(!form.querySelector('[name="coverPosition"]'))form.appendChild(hidden);bindCoverCropper(coverInput)};form.querySelectorAll('input[name="galleryImages"], input[name="videoFiles"]').forEach(bindMediaRemoveButtons)}
const PUBLISH_DRAFT_KEY='finca-raiz-publish-draft';
function savePublishDraft(form){if(!form)return;const draft={};form.querySelectorAll('input:not([type="file"]),select,textarea').forEach(field=>{if(field.name)draft[field.name]=field.value});try{localStorage.setItem(PUBLISH_DRAFT_KEY,JSON.stringify(draft))}catch(error){}}
function restorePublishDraft(form){if(!form)return;try{const draft=JSON.parse(localStorage.getItem(PUBLISH_DRAFT_KEY)||'null');if(!draft)return;Object.entries(draft).forEach(([name,value])=>{const field=form.elements.namedItem(name);if(field)field.value=value});form.querySelector('select[name="type"]')?.dispatchEvent(new Event('change'));toast('Borrador restaurado')}catch(error){}}
function clearPublishDraft(){try{localStorage.removeItem(PUBLISH_DRAFT_KEY)}catch(error){}}
function openDraftManager(){
  const root=document.getElementById('modal-root');
  if(!root)return;
  let draft=null;
  try{draft=JSON.parse(localStorage.getItem(PUBLISH_DRAFT_KEY)||'null')}catch(error){}
  const title=String(draft?.title||'Borrador sin título');
  const location=String(draft?.location||'Sin ubicación');
  root.innerHTML=`<div class="modal-backdrop"><section class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="draft-title"><div class="modal-head"><h2 id="draft-title">Borradores</h2><button class="close" data-draft-action="close" aria-label="Cerrar">&times;</button></div>${draft?`<label class="draft-option"><input type="radio" name="selected-draft" data-draft-select><span><strong>${escapeHtml(title)}</strong><br><span class="meta">${escapeHtml(location)}</span></span></label><div class="confirm-actions"><button class="btn btn-outline" data-draft-action="delete">Borrar</button><button class="btn btn-primary" data-draft-action="load" disabled>Cargar</button></div>`:'<p class="meta">No tienes borradores guardados.</p><div class="confirm-actions"><button class="btn btn-outline" data-draft-action="close">Cerrar</button></div>'}</section></div>`;
  const selection=root.querySelector('[data-draft-select]');
  const loadButton=root.querySelector('[data-draft-action="load"]');
  selection?.addEventListener('change',()=>{if(loadButton)loadButton.disabled=!selection.checked});
}
function enhanceMediaPreview(input){const field=input.closest('.field');if(!field||field.querySelector('.media-preview-grid'))return;const preview=document.createElement('div');preview.className='media-preview-grid';field.appendChild(preview);input.addEventListener('change',()=>{preview.innerHTML='';Array.from(input.files||[]).forEach(file=>{const item=document.createElement('div');item.className='media-preview-item';const media=file.type.startsWith('video/')?document.createElement('video'):document.createElement('img');media.src=URL.createObjectURL(file);media.alt=file.name;if(media.tagName==='VIDEO'){media.muted=true;media.playsInline=true;media.preload='metadata'}const label=document.createElement('small');label.textContent=file.name;item.append(media,label);preview.appendChild(item)})})}
function enhancePublishForm(){const form=document.querySelector('#publish-form');if(!form||form.dataset.publishEnhanced)return;form.dataset.publishEnhanced='true';const clearButton=form.querySelector('[data-action="clear-draft"]');if(clearButton)clearButton.remove();const saveButton=form.querySelector('[data-action="save-draft"]');if(saveButton){const openButton=document.createElement('button');openButton.type='button';openButton.className='btn btn-quiet';openButton.dataset.action='open-drafts';openButton.textContent='Abrir borradores';saveButton.after(openButton)}form.querySelectorAll('input[type="file"]').forEach(enhanceMediaPreview);const progress=document.createElement('p');progress.className='publish-progress';progress.hidden=true;progress.setAttribute('role','status');form.querySelector('button[type="submit"], button.btn-primary:last-child')?.before(progress)}
function enhancePriceField(){const field=document.querySelector('#publish-form input[name="price"]');if(!field||field.dataset.formatted)return;field.dataset.formatted='true';const format=()=>{const digits=field.value.replace(/\D/g,'');field.value=digits?new Intl.NumberFormat('es-CO').format(Number(digits)):''};field.addEventListener('input',format);format()}
function enhanceAreaField(){const form=document.querySelector('#publish-form');const priceField=form?.querySelector('input[name="price"]');if(!form||!priceField)return;let areaField=form.querySelector('[data-area-field]');if(!areaField){priceField.insertAdjacentHTML('afterend','<div class="field" data-area-field><label>Área</label><div class="area-input"><input name="area" type="number" min="0.01" step="0.01" placeholder="Ej. 1200"><select name="areaUnit" aria-label="Unidad del área"><option value="m²">m²</option><option value="hectáreas">Hectáreas</option></select></div></div>');areaField=form.querySelector('[data-area-field]')}const typeField=form.querySelector('select[name="type"]');const updateArea=()=>{const isProperty=typeField?.value!=='vehicle';areaField.hidden=!isProperty;areaField.querySelector('input[name="area"]').required=isProperty};const updateTitle=()=>{const titleField=form.querySelector('input[name="title"]');if(titleField)titleField.placeholder=typeField?.value==='vehicle'?'Ej. Toyota Hilux 2020':'Ej. Finca El Paraíso'};typeField?.addEventListener('change',updateArea);typeField?.addEventListener('change',updateTitle);typeField?.addEventListener('input',updateArea);typeField?.addEventListener('input',updateTitle);updateArea();updateTitle();form.querySelector('input[name="location"]')?.parentElement.classList.add('location-field')}
document.addEventListener('change',event=>{if(event.target.matches('#publish-form select[name="type"]')){const areaField=document.querySelector('#publish-form [data-area-field]');const areaInput=areaField?.querySelector('input[name="area"]');if(areaField&&areaInput){areaField.hidden=event.target.value==='vehicle';areaInput.required=event.target.value!=='vehicle'}}});
function enhanceListingFields(){const form=document.querySelector('#publish-form');const typeField=form?.querySelector('select[name="type"]');const locationField=form?.querySelector('input[name="location"]')?.parentElement;if(!form||!typeField||!locationField||form.querySelector('[data-listing-fields]'))return;locationField.insertAdjacentHTML('beforebegin','<div class="listing-fields" data-listing-fields><div class="vehicle-fields"><div class="field"><label>Marca</label><input name="brand" placeholder="Ej. Toyota"></div><div class="field"><label>Modelo</label><input name="model" placeholder="Ej. Hilux"></div><div class="field"><label>Año</label><input name="year" type="number" min="1900" max="2100" placeholder="Ej. 2022"></div><div class="field"><label>Kilometraje</label><input name="kms" type="number" min="0" placeholder="Ej. 45000"></div><div class="field"><label>Combustible</label><select name="fuel"><option value="">Seleccionar</option><option>Gasolina</option><option>Diésel</option><option>Híbrido</option><option>Eléctrico</option></select></div><div class="field"><label>Transmisión</label><select name="transmission"><option value="">Seleccionar</option><option>Manual</option><option>Automática</option></select></div></div><div class="property-fields"><div class="field"><label>Tipo de inmueble</label><select name="propertyType"><option>Casa</option><option>Finca</option><option>Lote</option><option>Apartamento</option></select></div><div class="property-residential-fields"><div class="field"><label>Habitaciones</label><input name="bedrooms" type="number" min="0" placeholder="Ej. 3"></div><div class="field"><label>Baños</label><input name="bathrooms" type="number" min="0" placeholder="Ej. 2"></div><div class="field"><label>Parqueaderos</label><input name="parking" type="number" min="0" placeholder="Ej. 1"></div></div><div class="field"><label>Acceso</label><select name="access"><option value="">Seleccionar</option><option>Vía pavimentada</option><option>Vía destapada</option><option>Acceso peatonal</option></select></div></div></div>');const update=()=>{const vehicle=typeField.value==='vehicle';form.classList.toggle('vehicle-form',vehicle);form.querySelector('.vehicle-fields').hidden=!vehicle;form.querySelector('.property-fields').hidden=vehicle;const residential=['Casa','Apartamento'].includes(form.querySelector('select[name="propertyType"]')?.value);form.querySelector('.property-residential-fields').hidden=vehicle||!residential};const propertyType=form.querySelector('select[name="propertyType"]');typeField.addEventListener('change',update);typeField.addEventListener('input',update);propertyType.addEventListener('change',update);update()}
document.addEventListener('click',event=>{if(event.target.closest('[data-nav="publish"]'))setTimeout(()=>{enhanceImageUpload();enhanceAreaField();enhancePriceField();enhanceListingFields();enhancePublishForm()},0)});
function openLocationPicker(){const root=document.getElementById('modal-root');root.innerHTML='<div class="modal-backdrop"><section class="modal map-modal" role="dialog" aria-modal="true" aria-labelledby="map-title"><div class="modal-head"><h2 id="map-title">Selecciona la ubicación</h2><button class="close" data-map-close aria-label="Cerrar">&times;</button></div><p class="meta">Haz clic en el punto exacto. Puedes cambiar entre mapa y satélite.</p><div id="location-map"></div><div class="map-selected meta" id="map-selected">Ninguna ubicación seleccionada</div><div class="confirm-actions"><button class="btn btn-outline" data-map-close>Cancelar</button><button class="btn btn-primary" data-map-use disabled>Usar esta ubicación</button></div></section></div>';const locationInput=document.querySelector('#publish-form input[name="location"]');const initial=[5.0817,-73.6085];const map=L.map('location-map').setView(initial,13);const streetLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'});const satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri, Maxar, Earthstar Geographics'});streetLayer.addTo(map);L.control.layers({'Mapa':streetLayer,'Satélite':satelliteLayer},null,{position:'topright',collapsed:false}).addTo(map);let marker=null;let selectedAddress='';const close=()=>{map.remove();root.innerHTML=''};root.querySelectorAll('[data-map-close]').forEach(button=>button.addEventListener('click',close));root.querySelector('[data-map-use]').addEventListener('click',()=>{if(!selectedAddress)return;locationInput.value=selectedAddress;close();toast('Ubicación agregada correctamente')});map.on('click',async event=>{if(marker)marker.setLatLng(event.latlng);else marker=L.marker(event.latlng).addTo(map);const selected=root.querySelector('#map-selected');selected.textContent='Buscando dirección...';try{const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${event.latlng.lat}&lon=${event.latlng.lng}&accept-language=es`);if(!response.ok)throw new Error('No se pudo consultar la dirección');const data=await response.json();selectedAddress=data.display_name||`${event.latlng.lat.toFixed(6)}, ${event.latlng.lng.toFixed(6)}`;selected.textContent=selectedAddress;root.querySelector('[data-map-use]').disabled=false}catch(error){selected.textContent='No se pudo obtener la dirección. Intenta de nuevo.'}});setTimeout(()=>map.invalidateSize(),100)}
document.addEventListener('click',event=>{const presentationButton=event.target.closest('[data-action="presentation"]');if(presentationButton){event.preventDefault();navigate('presentation');return}const button=event.target.closest('[data-action="map-location"]');if(!button)return;openLocationPicker()});
document.addEventListener('submit', async event => {
  if (event.target.id !== 'publish-form') return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const form = event.target;
  if (form.dataset.submitting === 'true') return;
  const formData = new FormData(form);
  const title = String(form.querySelector('[name="title"]')?.value || '').trim();
  const type = String(form.querySelector('[name="type"]')?.value || 'property');
  const price = Number(String(form.querySelector('[name="price"]')?.value || '').replace(/\D/g, ''));
  const location = String(form.querySelector('[name="location"]')?.value || '').trim();
  const coverPosition = String(form.querySelector('[name="coverPosition"]')?.value || 'center');
  const descriptionText = String(form.querySelector('[name="desc"]')?.value || '').trim() || 'Publicación creada por la comunidad.';
  const area = Number(form.querySelector('[name="area"]')?.value || 0);
  const areaUnit = String(form.querySelector('[name="areaUnit"]')?.value || 'm²');
  const coverFiles = Array.from(form.querySelectorAll('input[name="coverImage"]')).flatMap(input => Array.from(input.files || [])).filter(file => file instanceof File && file.size > 0);
  const galleryFiles = Array.from(form.querySelectorAll('input[name="galleryImages"]')).flatMap(input => Array.from(input.files || [])).filter(file => file instanceof File && file.size > 0);
  const videoFiles = Array.from(form.querySelectorAll('input[name="videoFiles"]')).flatMap(input => Array.from(input.files || [])).filter(file => file instanceof File && file.size > 0);

  if (!coverFiles.length && !galleryFiles.length && !videoFiles.length) {
    toast('Selecciona al menos una foto o un video para la publicación.');
    return;
  }
  if (galleryFiles.length > MAX_GALLERY_IMAGES) {
    toast(`Máximo ${MAX_GALLERY_IMAGES} imágenes por publicación.`);
    return;
  }
  if (videoFiles.length > MAX_VIDEO_COUNT) {
    toast(`Máximo ${MAX_VIDEO_COUNT} videos por publicación.`);
    return;
  }
  if (validateVideoFiles(videoFiles).length) {
    toast('Los videos no pueden superar 50 MB. Reduce el archivo antes de enviar.');
    return;
  }
  if (!title || !location || !Number.isFinite(price) || price <= 0) {
    toast('Completa título, ubicación y precio válidos.');
    return;
  }
  if (type !== 'vehicle' && (!Number.isFinite(area) || area <= 0)) {
    toast('Ingresa el área de la propiedad.');
    return;
  }
  if (!supabaseClient || !state.user?.id) {
    toast('Configura Supabase e inicia sesión para publicar.');
    return;
  }

  form.dataset.submitting = 'true';
  const submitButton = form.querySelector('button[type="submit"], button.btn-primary:last-child');
  const progress = form.querySelector('.publish-progress');
  if (submitButton) { submitButton.disabled = true; submitButton.dataset.originalText = submitButton.textContent; submitButton.textContent = 'Subiendo publicación...'; }
  if (progress) { progress.hidden = false; progress.textContent = 'Subiendo imágenes y videos...'; }

  try {
    const [coverUrls, galleryUrls, videoUrls] = await Promise.all([
      Promise.all(coverFiles.map(file => uploadMedia(file, 'images'))),
      Promise.all(galleryFiles.map(file => uploadMedia(file, 'images'))),
      Promise.all(videoFiles.map(file => uploadMedia(file, 'videos'))),
    ]);
    const finalVideoUrls = videoUrls.filter(Boolean);

    const combinedImages = [...coverUrls, ...galleryUrls].filter(Boolean);
    const primaryImage = combinedImages[0] || null;
    const specs = type === 'vehicle'
      ? {
          brand: String(form.querySelector('[name="brand"]')?.value || '').trim(),
          model: String(form.querySelector('[name="model"]')?.value || '').trim(),
          year: form.querySelector('[name="year"]')?.value || null,
          kms: form.querySelector('[name="kms"]')?.value || null,
          fuel: form.querySelector('[name="fuel"]')?.value || null,
          transmission: form.querySelector('[name="transmission"]')?.value || null,
        }
      : {
          propertyType: form.querySelector('[name="propertyType"]')?.value || 'Casa',
          bedrooms: form.querySelector('[name="bedrooms"]')?.value || null,
          bathrooms: form.querySelector('[name="bathrooms"]')?.value || null,
          parking: form.querySelector('[name="parking"]')?.value || null,
          access: form.querySelector('[name="access"]')?.value || null,
        };

    const category = type === 'vehicle' ? (specs.brand || 'Vehículo') : (specs.propertyType || 'Propiedad');
    const summary = `${descriptionText}${type === 'vehicle' ? '' : `\n<!--area:${area}:${areaUnit}-->`}<!--specs:${encodeURIComponent(JSON.stringify(specs))}-->`;
    const status = isAdmin() ? 'approved' : 'pending';

    const insertPayload = {
      title,
      type,
      category,
      price,
      location,
      image: primaryImage,
      images: combinedImages,
      videos: finalVideoUrls,
      cover_position: coverPosition,
      description: summary,
      desc: summary,
      owner: state.user.id,
      owner_id: state.user.id,
      status,
    };

    const safeInsertPayload = safeListingPayload(insertPayload);
    let { data: createdRows, error } = await supabaseClient.from('listings').insert(safeInsertPayload).select();
    if (error && /column|could not find/i.test(error.message)) {
      const fallbackPayload = safeListingPayload({
        title,
        type,
        category,
        price,
        location,
        image: primaryImage,
        images: combinedImages,
        videos: finalVideoUrls,
        cover_position: coverPosition,
        description: summary,
        desc: summary,
        owner: state.user.id,
        owner_id: state.user.id,
        status,
      });
      const retry = await supabaseClient.from('listings').insert(fallbackPayload).select();
      createdRows = retry.data;
      error = retry.error;
    }
    if (error) throw error;

    listings = [normalizeListing((createdRows && createdRows[0]) || insertPayload), ...listings];
    clearPublishDraft();
    render();
    navigate('my');
    toast(status === 'approved' ? 'Publicación enviada correctamente.' : 'Publicación enviada y pendiente por aprobación.');
  } catch (error) {
    if (isSupabaseSchemaError(error)) {
      toast('La base de datos de publicaciones está incompleta o bloqueada. Revisa la tabla listings y el RLS en Supabase.');
    } else {
      toast(error?.message || 'No se pudo enviar la publicación.');
    }
  } finally {
    form.dataset.submitting = 'false';
    if (submitButton) { submitButton.disabled = false; submitButton.textContent = submitButton.dataset.originalText || 'Enviar publicación'; }
    if (progress) { progress.hidden = true; }
  }
});

document.addEventListener('click',event=>{const navigation=document.querySelector('.nav-links');if(!navigation?.classList.contains('is-open'))return;const selectedLink=event.target.closest('.nav-links [data-nav]');const outside=!event.target.closest('.nav-links')&&!event.target.closest('[data-action="toggle-menu"]');if(selectedLink||outside){navigation.classList.remove('is-open');document.querySelector('[data-action="toggle-menu"]')?.setAttribute('aria-expanded','false')}} ,true);
document.addEventListener('click',event=>{const form=document.querySelector('#publish-form');if(!form)return;const saveButton=event.target.closest('[data-action="save-draft"]');const clearButton=event.target.closest('[data-action="clear-draft"]');if(saveButton){event.preventDefault();savePublishDraft(form);return;}if(clearButton){event.preventDefault();clearPublishDraft();return;}const navigationTarget=event.target.closest('[data-nav]');if(navigationTarget&&state.view==='publish')savePublishDraft(form)} ,true);
document.addEventListener('click',event=>{
  const openButton=event.target.closest('[data-action="open-drafts"]');
  if(openButton){event.preventDefault();openDraftManager();return;}
  const draftAction=event.target.closest('[data-draft-action]')?.dataset.draftAction;
  if(!draftAction)return;
  const root=document.getElementById('modal-root');
  if(draftAction==='close'){root.innerHTML='';return;}
  if(draftAction==='delete'){clearPublishDraft();root.innerHTML='';toast('Borrador eliminado');return;}
  if(draftAction==='load'){
    if(!root.querySelector('[data-draft-select]:checked')){toast('Selecciona un borrador para cargarlo');return;}
    const form=document.querySelector('#publish-form');
    if(form)restorePublishDraft(form);
    root.innerHTML='';
  }
});
document.addEventListener('input',event=>{const form=event.target.closest('#publish-form');if(!form)return;savePublishDraft(form)},true);
function autoSavePublishDraft(){
  const form=document.querySelector('#publish-form');
  if(form&&state.view==='publish') savePublishDraft(form);
}
window.addEventListener('beforeunload',autoSavePublishDraft);
window.addEventListener('pagehide',autoSavePublishDraft);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden') autoSavePublishDraft();
});
const logoInput=document.createElement('input');logoInput.type='file';logoInput.accept='image/*';logoInput.hidden=true;document.body.appendChild(logoInput);
function applyLogo(){const logo=state.user?.logo_url;document.querySelectorAll('.brand-logo').forEach(image=>{image.src='assets/Logo Finca raiz.jpg';image.removeAttribute('title')});document.querySelectorAll('.profile-photo').forEach(image=>{image.src=logo || 'assets/Logo Finca raiz.jpg'})}
logoInput.addEventListener('change',async()=>{const file=logoInput.files[0];if(!file||!supabaseClient||!state.user?.id){toast('Inicia sesión para cambiar la foto de perfil.');return}try{const url=await uploadMedia(file,'logos');const {error}=await supabaseClient.from('profiles').update({logo_url:url}).eq('id',state.user.id);if(error)throw error;state.user.logo_url=url;applyLogo();toast('Foto de perfil actualizada correctamente')}catch(error){toast(error.message)}});
document.addEventListener('click',event=>{if(event.target.closest('.profile-photo-button'))logoInput.click();const toggle=event.target.closest('[data-action="toggle-menu"]');if(toggle){const navigation=document.querySelector('.nav-links');const isOpen=navigation.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(isOpen));toggle.setAttribute('aria-label',isOpen?'Cerrar menú':'Abrir menú')}setTimeout(applyLogo,0)});
document.addEventListener('click',async event=>{const inspect=event.target.closest('[data-inspect]');if(inspect){const item=listings.find(value=>String(value.id)===inspect.dataset.inspect);if(item)navigate('detail',item);return}const action=event.target.closest('[data-approve],[data-reject]');if(!action||!isAdmin()||!supabaseClient)return;const status=action.dataset.approve?'approved':'rejected';const id=action.dataset.approve||action.dataset.reject;const {data,error}=await supabaseClient.from('listings').update({status}).eq('id',id).select().single();if(error){toast(error.message);return}listings=listings.map(item=>String(item.id)===String(id)?normalizeListing(data):item);render();toast(status==='approved'?'Publicación aprobada':'Publicación rechazada')});
function enhanceMobileContacts(){const bar=document.querySelector('.mobile-bar');if(!bar||bar.querySelector('[data-mobile-facebook]'))return;bar.innerHTML=`<a href="tel:${contact.phone.replace(/\s/g,'')}" aria-label="Llamar por teléfono"><i class="fa-solid fa-phone" aria-hidden="true"></i><span>Teléfono</span></a><a href="https://wa.me/${contact.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span></a><a href="${contact.facebook}" target="_blank" rel="noopener" data-mobile-facebook aria-label="Visitar Facebook"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i><span>Facebook</span></a>`}
function enhanceDetailMap(){const container=document.querySelector('[data-detail-map]');if(!container||container.dataset.loaded||!window.L)return;container.dataset.loaded='true';container.querySelector('.map-loading')?.remove();const location=decodeURIComponent(container.dataset.location||'');const fallback=[5.0817,-73.6085];const map=L.map(container).setView(fallback,13);const streetLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'});const satelliteLayer=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'&copy; Esri, Maxar, Earthstar Geographics'});streetLayer.addTo(map);L.control.layers({'Mapa':streetLayer,'Satélite':satelliteLayer},null,{position:'topright',collapsed:false}).addTo(map);fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=es&q=${encodeURIComponent(location)}`).then(response=>response.json()).then(results=>{const result=results[0];if(!result)return;const coordinates=[Number(result.lat),Number(result.lon)];map.setView(coordinates,15);L.marker(coordinates).addTo(map).bindPopup(location).openPopup()}).catch(()=>{});setTimeout(()=>map.invalidateSize(),100)}
function enhanceQrCode(){const container=document.getElementById('site-qr');if(!container||container.querySelector('img')||container.dataset.loaded||!window.QRCode)return;container.dataset.loaded='true';if(location.protocol==='file:'){container.textContent='Publica la página para compartirla';return}new QRCode(container,{text:location.href,width:148,height:148,colorDark:'#1d2922',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M})}
	function enhanceContactLinks(){enhanceMobileContacts();updateHeroContent();updateFooterDescription();enhanceProfilePhoto();enhanceLocationButton();enhanceDetailSpecs();enhanceDetailMap();enhancePresentationButton();enhanceQrCode()}
function enhanceLocationButton(){const location=document.querySelector('.detail-card .location');const specs=document.querySelector('.detail-card .spec-grid');if(!location||!specs||specs.querySelector('[data-map-button]'))return;specs.insertAdjacentHTML('beforeend','<a class="map-button" data-map-button href="#publication-map">Ver mapa</a>')}
function enhanceDetailSpecs(){const location=document.querySelector('.detail-card .location');if(!location||location.querySelector('[data-detail-specs]')||!state.selected)return;const summary=specsSummary(state.selected);if(summary)location.insertAdjacentHTML('afterend',`<div class="detail-specs" data-detail-specs>${summary}</div>`)}
function enhancePresentationButton(){const navigation=document.querySelector('.nav-links');if(navigation&&!navigation.querySelector('[data-presentation-button]'))navigation.insertAdjacentHTML('beforeend','<a class="btn btn-lime btn-small presentation-nav-button" data-presentation-button data-action="presentation" href="#">Tarjeta de presentación</a>')}
function presentation(){return '<main class="page presentation-page"><section class="section presentation-section" id="presentation-section"><div class="container presentation-layout"><div class="presentation-copy"><div class="eyebrow">Conócenos</div><h1>Tarjeta de presentación</h1><p>Conoce los servicios de Finca Raíz Machetá.</p></div><div class="presentation-image"><img src="assets/Tarjeta de presentacion Finca Raiz.jpeg" alt="Tarjeta de presentación de Finca Raíz Machetá"></div></div></section></main>'}
function enhanceProfilePhoto(){const heading=document.querySelector('.dashboard .section-head');if(!heading||heading.querySelector('[data-profile-photo]'))return;const button=`<button class="profile-photo-button" type="button" data-profile-photo aria-label="Cargar foto de perfil" title="Cargar foto de perfil"><img class="profile-photo" src="${state.user?.logo_url||'assets/Logo Finca raiz.jpg'}" alt="Foto de perfil"><span class="profile-photo-hint">+</span></button>`;heading.querySelector('[data-nav="publish"]')?.insertAdjacentHTML('beforebegin',button)}
function updateFooterDescription(){document.querySelector('.footer .footer-grid > div:first-child p')?.replaceChildren(document.createTextNode('Descubre nuevas oportunidades en finca raíz y vehículos, encuentra propiedades y automóviles que se ajusten a tus necesidades.'))}
function updateHeroContent(){document.querySelector('.hero .kicker')?.replaceChildren(document.createTextNode('Tu próxima propiedad está aquí'));document.querySelector('.hero h1')?.replaceChildren(document.createTextNode('Encuentra la propiedad que estás buscando en Macheta y sus alrededores.'));document.querySelector('.presentation-copy a[href*="Tarjeta"]')?.remove();document.querySelector('.footer .footer-grid > div:first-child p')?.replaceChildren(document.createTextNode('Encontramos contigo el espacio ideal para tus nuevos proyectos.'));const footerContact=document.querySelector('.footer .footer-grid > div:nth-child(3)');if(footerContact&&!footerContact.querySelector('[data-desktop-contacts]'))footerContact.insertAdjacentHTML('beforeend',`<div class="contact-links" data-desktop-contacts><a class="btn btn-primary btn-small" href="tel:${contact.phone.replace(/\s/g,'')}" aria-label="Llamar por teléfono"><i class="fa-solid fa-phone" aria-hidden="true"></i> Teléfono</a><a class="btn btn-lime btn-small" href="https://wa.me/${contact.whatsapp.replace(/\D/g,'')}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp</a><a class="btn btn-outline btn-small" href="${contact.facebook}" target="_blank" rel="noopener" aria-label="Visitar Facebook"><i class="fa-brands fa-facebook-f" aria-hidden="true"></i> Facebook</a></div>`);document.querySelector('.split-banner')?.closest('.section')?.remove();[...document.querySelectorAll('.section-head h2')].find(heading=>heading.textContent.trim()==='Vehículos recientes')?.closest('.section')?.classList.add('vehicle-home-section');enhanceAdminRequests()}
function enhanceAdminRequests(){if(!isAdmin()||state.view!=='my'||document.querySelector('[data-admin-requests]'))return;const requests=listings.filter(item=>item.status==='pending');const panel=document.querySelector('.dash-grid');if(!panel)return;panel.insertAdjacentHTML('afterbegin',`<section class="panel" data-admin-requests><h3>Solicitudes pendientes</h3>${requests.length?requests.map(item=>`<div class="listing-row"><div class="listing-info"><b>${item.title}</b><small class="meta">${money(item.price)} · ${item.location}</small></div><div class="listing-actions"><button class="btn btn-outline btn-small" data-inspect="${item.id}">Inspeccionar</button><button class="btn btn-primary btn-small" data-approve="${item.id}">Aprobar</button><button class="btn btn-danger btn-small" data-reject="${item.id}">Rechazar</button></div></div>`).join(''):'<div class="empty">No hay solicitudes pendientes.</div>'}</section>`)}
document.addEventListener('click',event=>{const button=event.target.closest('[data-action="catalog-search"]');if(!button)return;state.category=document.getElementById('catalog-category')?.value||'Todos';state.operation=document.getElementById('catalog-operation')?.value||'Venta'},true);
new MutationObserver(enhanceContactLinks).observe(app,{childList:true});
new MutationObserver(enhanceDetailGallery).observe(app,{childList:true});
new MutationObserver(()=>{document.querySelectorAll('.gallery-thumbs .thumb').forEach(thumb=>{if(!thumb.style.backgroundImage||thumb.style.backgroundImage==='none')thumb.remove()});const thumbs=document.querySelector('.gallery-thumbs');if(thumbs&&!thumbs.querySelector('.thumb'))thumb.remove()}).observe(app,{childList:true,subtree:true});
document.addEventListener('error',event=>{if(event.target.matches?.('.thumb-media'))event.target.closest('.thumb')?.remove()},true);
new MutationObserver(enhanceDetailEditButton).observe(app,{childList:true});
new MutationObserver(enhanceMobileMenuActions).observe(app,{childList:true});
new MutationObserver(enhanceAdminBackup).observe(app,{childList:true});
card = function(item){const category=escapeHtml(item.category==='Camioneta'?'Vehículo':item.category||'Publicación');const own=ownsListing(item);const coverImage=item.image||item.images?.[0]||'';const imageMarkup=coverImage?`<img class="card-media" src="${escapeHtml(coverImage)}" alt="${escapeHtml(item.title||'Publicación')}" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><div class="card-media-fallback" hidden aria-hidden="true">${item.type==='vehicle'?'Vehículo':'Propiedad'}</div>`:'<div class="card-media-fallback" aria-hidden="true">Sin imagen</div>';return `<article class="card"><div class="card-image">${imageMarkup}<span class="badge">${category}</span></div><div class="card-body"><div class="price">${money(item.price)}</div><h3>${escapeHtml(item.title)}</h3><div class="location">⌖ ${escapeHtml(item.location)}</div>${specsSummary(item)?`<div class="spec-summary">${specsSummary(item)}</div>`:''}<div class="card-footer"><span class="mini-type">${item.type==='vehicle'?'Vehículo':'Propiedad'}</span><span class="card-actions"><button class="btn btn-primary btn-small" data-detail="${escapeHtml(item.id)}">Ver</button>${own?`<button class="btn btn-outline btn-small" data-delete="${escapeHtml(item.id)}">Eliminar</button>`:''}</span></div></div></article>`};
function enhanceDetailGallery(){const main=document.querySelector('[data-gallery-main]');if(!main)return;const mediaUrls=Array.isArray(state.selected?.images)?state.selected.images.filter(Boolean):[state.selected?.image].filter(Boolean);if(mediaUrls.length&&!main.querySelector('.detail-media-image')){const image=document.createElement('img');image.className='detail-media-image';image.src=mediaUrls[0];image.alt=state.selected?.title||'Imagen de la publicación';image.loading='eager';image.onerror=()=>{image.remove();if(!main.querySelector('.gallery-empty'))main.insertAdjacentHTML('afterbegin','<div class="gallery-empty">No se pudo cargar esta imagen.</div>')};main.insertBefore(image,main.firstChild)}const thumbs=document.querySelector('.gallery-thumbs');if(thumbs){thumbs.querySelectorAll('.thumb').forEach((thumb,index)=>{const url=mediaUrls[index];if(!url||thumb.querySelector('.thumb-media'))return;const image=document.createElement('img');image.className='thumb-media';image.src=url;image.alt=`Miniatura ${index+1}`;image.onerror=()=>image.remove();thumb.appendChild(image)});if(!thumbs.querySelector('.thumb'))thumb.remove()}const hasMedia=Boolean(main.querySelector('.detail-media-image,video'));if(!hasMedia&&!main.querySelector('.gallery-empty'))main.insertAdjacentHTML('afterbegin','<div class="gallery-empty">Esta publicación no tiene imágenes disponibles.</div>')}
function enhanceDetailEditButton(){const card=document.querySelector('.detail-card');const item=state.selected;if(!card||!item||!state.user||(!ownsListing(item)&&!isAdmin())||card.querySelector('[data-edit-listing]'))return;const shareButton=card.querySelector('[data-action="share"]');const button=document.createElement('button');button.className='btn btn-outline detail-edit-button';button.dataset.editListing=item.id;button.type='button';button.textContent='Editar publicación';if(shareButton)shareButton.before(button);else card.appendChild(button)}
function enhanceMobileMenuActions(){const navigation=document.querySelector('.nav-links');const actions=document.querySelector('.header-actions');if(!navigation||!actions||navigation.querySelector('[data-menu-action]'))return;['[data-nav="login"]','[data-nav="publish"]','[data-action="logout"]'].forEach(selector=>{const source=actions.querySelector(selector);if(!source)return;const button=source.cloneNode(true);button.dataset.menuAction='true';button.classList.add('menu-only');button.addEventListener('click',event=>{if(button.dataset.nav){event.preventDefault();navigate(button.dataset.nav)}else if(button.dataset.action==='logout'){if(supabaseClient)supabaseClient.auth.signOut();state.user=null;navigate('home');toast('Sesión cerrada')}});navigation.appendChild(button)})}
function enhanceHomeSearch(){
  const locationField=document.querySelector('#home-location')?.closest('.field');
  if(locationField)locationField.remove();
}
render();
enhanceHomeSearch();
new MutationObserver(enhanceHomeSearch).observe(app,{childList:true});
bindMediaGallery();
removeLocationIcons();
enhanceContactLinks();
enhanceDetailGallery();
enhanceDetailEditButton();
enhanceMobileMenuActions();
function ensureDetailThumbImages(){const mainImage=document.querySelector('.detail-media-image');const thumbs=document.querySelectorAll('.gallery-thumbs .thumb');if(!thumbs.length)return;const urls=Array.isArray(state.selected?.images)?state.selected.images.filter(Boolean):[];thumbs.forEach((thumb,index)=>{if(thumb.querySelector('.thumb-media'))return;const url=urls[index]||mainImage?.currentSrc||mainImage?.src;if(!url)return;const image=document.createElement('img');image.className='thumb-media';image.src=url;image.alt=`Miniatura ${index+1}`;image.onerror=()=>thumb.remove();thumb.appendChild(image)})}
ensureDetailThumbImages();
new MutationObserver(ensureDetailThumbImages).observe(app,{childList:true,subtree:true});
enhanceImageUpload();
applyLogo();
loadSupabaseData();
if(supabaseClient)supabaseClient.auth.onAuthStateChange(()=>setTimeout(loadSupabaseData,0));