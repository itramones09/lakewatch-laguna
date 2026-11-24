/* Phase 11.5 — on-demand, source-credited Commons photo carousel.
   Fetches the Laguna de Bay file category and lake-related descendants; no bulk downloads. */
(()=>{
  'use strict';
  const api='https://commons.wikimedia.org/w/api.php';
  const rootCategory='Category:Laguna de Bay';
  const licenseURLs={
    'CC0 1.0':'https://creativecommons.org/publicdomain/zero/1.0/',
    'CC BY-SA 3.0':'https://creativecommons.org/licenses/by-sa/3.0/',
    'CC BY-SA 4.0':'https://creativecommons.org/licenses/by-sa/4.0/'
  };
  // These eight previously reviewed records are the offline/error fallback.
  const featuredPhotos=[
    {
      title:'The lake from Paete',place:'Paete, Laguna',year:'2025',category:'view',
      description:'Elevated view of Laguna de Bay from the Three Crosses area of Paete.',
      author:'RFNirmala',license:'CC0 1.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Paete%2C_Laguna_and_Laguna_Lake_17Apr2025.jpg/960px-Paete%2C_Laguna_and_Laguna_Lake_17Apr2025.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Paete,_Laguna_and_Laguna_Lake_17Apr2025.jpg'
    },
    {
      title:'View from Biñan',place:'Biñan, Laguna',year:'2026',category:'view',
      description:'Laguna de Bay shoreline looking across the open lake from Biñan.',
      author:'THELVBE',license:'CC BY-SA 4.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Laguna_de_Bay_%28view_from_Bi%C3%B1an%2C_Laguna%29.jpg/960px-Laguna_de_Bay_%28view_from_Bi%C3%B1an%2C_Laguna%29.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Laguna_de_Bay_(view_from_Bi%C3%B1an,_Laguna).jpg'
    },
    {
      title:'Pililla lakescape',place:'Pililla, Rizal',year:'2011',category:'view',
      description:'Expansive view across Laguna de Bay with green hills in the foreground.',
      author:'Idawriter',license:'CC BY-SA 3.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Laguna_de_Bay_-_panoramio.jpg/960px-Laguna_de_Bay_-_panoramio.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Laguna_de_Bay_-_panoramio.jpg'
    },
    {
      title:'Twilight on the water',place:'Binangonan, Rizal',year:'2025',category:'sunset',
      description:'A traditional wooden boat moored along Laguna de Bay at dusk.',
      author:'AdobongPogi',license:'CC BY-SA 4.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Twilight_Stillness_at_Laguna_de_Bay.jpg/960px-Twilight_Stillness_at_Laguna_de_Bay.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Twilight_Stillness_at_Laguna_de_Bay.jpg'
    },
    {
      title:'Lakeside livelihood',place:'Muntinlupa City',year:'2018',category:'shore',
      description:'Water spinach cultivation and a small boat on Laguna de Bay.',
      author:'FroyR',license:'CC BY-SA 4.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Laguna_de_Bay.jpg/960px-Laguna_de_Bay.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Laguna_de_Bay.jpg'
    },
    {
      title:'Sucat lakeside walk',place:'Sucat, Muntinlupa',year:'2017',category:'shore',
      description:'A lakeside walkway and aquatic vegetation at Sucat People’s Park.',
      author:'Judgefloro',license:'CC0 1.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/6081Sucat_Muntinlupa_Park_Covered_Court_Laguna_de_Bay_46.jpg/960px-6081Sucat_Muntinlupa_Park_Covered_Court_Laguna_de_Bay_46.jpg',
      source:'https://commons.wikimedia.org/wiki/File:6081Sucat_Muntinlupa_Park_Covered_Court_Laguna_de_Bay_46.jpg'
    },
    {
      title:'Laguna Bay sunset',place:'Laguna de Bay',year:'2015',category:'sunset',
      description:'Sunset reflected over the lake and distant city skyline.',
      author:'Ranieljosecastaneda',license:'CC BY-SA 4.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Laguna_Bay_Sunset.jpg/960px-Laguna_Bay_Sunset.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Laguna_Bay_Sunset.jpg'
    },
    {
      title:'Calamba lakeside',place:'Calamba, Laguna',year:'2011',category:'shore',
      description:'A boat on Laguna de Bay with the Mount Makiling area in the distance.',
      author:'WikiCalambenyo',license:'CC BY-SA 3.0',
      url:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Calamba_City_Lakeside.jpg',
      source:'https://commons.wikimedia.org/wiki/File:Calamba_City_Lakeside.jpg'
    }
  ];
  const grid=document.getElementById('lake-gallery-grid');
  const dialog=document.getElementById('lake-photo-dialog');
  if(!grid||!dialog)return;
  const $=id=>document.getElementById(id);
  const large=$('lake-photo-large');
  const error=$('lake-photo-unavailable');
  let photos=featuredPhotos.map(p=>({...p,kind:'featured'}));
  let filtered=[],start=0,filter='all',search='',loading=false,exhausted=false,apiFailed=false;
  let activeDialogIndex=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing=!reduced.matches, hovering=false;
  const cards=new Map();
  const section=$('view-gallery'), toggle=$('lake-carousel-play');
  const toVisit=[{title:rootCategory,depth:0,next:null}];
  const visitedCategories=new Set([rootCategory]);
  const pendingTitles=[];
  const seenFileTitles=new Set(featuredPhotos.map(p=>decodeURIComponent(p.source.split('File:')[1]||'').replace(/_/g,' ').toLowerCase()));
  const countEl=$('lake-gallery-count'),status=$('lake-gallery-status'),more=$('lake-gallery-more');
  const pos=$('lake-carousel-position'),back=$('lake-carousel-prev'),forward=$('lake-carousel-next');
  function text(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=value;return el;}
  function urlSafe(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}}
  function link(label,url,cls){const a=document.createElement('a');a.textContent=label;a.href=urlSafe(url)||'https://commons.wikimedia.org/wiki/Category:Laguna_de_Bay';a.target='_blank';a.rel='noopener noreferrer';if(cls)a.className=cls;return a;}
  function stripHTML(value){const doc=new DOMParser().parseFromString(String(value??''),'text/html');return (doc.body.textContent||'').replace(/\s+/g,' ').trim();}
  function metaValue(meta,k){return stripHTML(meta?.[k]?.value||'');}
  function titleCase(title){return title.replace(/^File:/i,'').replace(/\.(jpe?g|png|webp)$/i,'').replace(/_/g,' ').replace(/\s+/g,' ').trim();}
  function categorize(name){
    if(/sunset|sunrise|dusk|twilight|golden hour|evening/i.test(name))return 'sunset';
    if(/boat|fisher|fish|floating|walkway|park|shore|market|village|community|livelihood|water hyacinth|lakeside/i.test(name))return 'shore';
    return 'view';
  }
  // Do not traverse tributary/river categories; the project's geographic focus is the lake.
  function allowedSubcategory(title,depth){
    const t=title.replace(/^Category:/,'');
    if(/tributar|river|creek|stream|canal|general paciano rizal park/i.test(t))return false;
    if(depth>=3)return false;
    if(depth===0)return /^(Laguna Lake in |Laguna de Bay|Views of Laguna de Bay|Aerial photographs of Laguna de Bay|Talim Island|Sucat People's Park|Laguna Caldera|History of Laguna de Bay)/i.test(t);
    return /laguna|lake|bay|talim|sucat|island|aerial|view/i.test(t);
  }
  async function commons(params){
    const qs=new URLSearchParams({action:'query',format:'json',formatversion:'2',origin:'*',...params});
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),16000);
    try{
      const response=await fetch(`${api}?${qs}`,{signal:controller.signal,credentials:'omit'});
      if(!response.ok)throw Error(`Commons API responded ${response.status}`);
      const data=await response.json();
      if(data.error)throw Error(data.error.info||'Commons API error');
      return data;
    }finally{clearTimeout(timeout);}
  }
  async function collectTitles(){
    while(!pendingTitles.length&&toVisit.length){
      const job=toVisit.shift();
      const params={list:'categorymembers',cmtitle:job.title,cmtype:'file|subcat',cmlimit:'100'};
      if(job.next)params.cmcontinue=job.next;
      const data=await commons(params);
      (data.query?.categorymembers||[]).forEach(item=>{
        if(item.ns===6){
          const normalized=item.title.slice(5).toLowerCase();
          if(!seenFileTitles.has(normalized)){
            seenFileTitles.add(normalized);
            pendingTitles.push({title:item.title,category:job.title});
          }
        }else if(item.ns===14&&allowedSubcategory(item.title,job.depth)&&!visitedCategories.has(item.title)){
          visitedCategories.add(item.title);
          toVisit.push({title:item.title,depth:job.depth+1,next:null});
        }
      });
      if(data.continue?.cmcontinue)toVisit.unshift({...job,next:data.continue.cmcontinue});
    }
  }
  function fromInfo(page,category){
    const info=page.imageinfo?.[0];if(!info)return null;
    if(!/^image\/(jpeg|png|webp)$/i.test(info.mime||''))return null;
    if(/(?:^|\W)(diagram|locator|flag|seal|coat.of.arms|logo|cartographic.map)(?:\W|$)/i.test(page.title))return null;
    const meta=info.extmetadata||{};
    const author=metaValue(meta,'Artist')||info.user||'See original file';
    const license=metaValue(meta,'LicenseShortName')||'See source for license';
    const licenseUrl=urlSafe(meta.LicenseUrl?.value)||licenseURLs[license]||'';
    const year=(metaValue(meta,'DateTimeOriginal')||info.timestamp||'').match(/\b(18|19|20)\d{2}\b/)?.[0]||'Date not specified';
    const source='https://commons.wikimedia.org/wiki/'+encodeURIComponent(page.title.replace(/ /g,'_'));
    return {
      title:titleCase(page.title),place:category.replace(/^Category:/,''),year,category:categorize(page.title),
      description:'Photograph catalogued in the Wikimedia Commons Laguna de Bay collection.',
      author,license,licenseUrl,source,kind:'commons',
      url:urlSafe(info.thumburl)||urlSafe(info.url)
    };
  }
  async function fetchMetadata(items){
    const data=await commons({prop:'imageinfo',titles:items.map(x=>x.title).join('|'),iiprop:'url|mime|extmetadata|user|timestamp',iiurlwidth:'720'});
    const categoryByTitle=new Map(items.map(x=>[x.title.toLowerCase(),x.category]));
    return (data.query?.pages||[]).map(p=>fromInfo(p,categoryByTitle.get(p.title.toLowerCase())||rootCategory)).filter(p=>p&&p.url);
  }
  function current(){return photos.filter(p=>{
    if(filter!=='all'&&p.category!==filter)return false;
    if(search&&!`${p.title} ${p.place} ${p.author}`.toLowerCase().includes(search))return false;
    return true;
  });}
  function remaining(){return pendingTitles.length>0||toVisit.length>0;}
  function makeCard(p,index){
    const card=document.createElement('article');card.className='lake-photo-card';card.setAttribute('aria-label',`${index+1} of ${filtered.length}: ${p.title}`);
    const btn=document.createElement('button');btn.type='button';btn.className='lake-photo-open';btn.setAttribute('aria-label',`View ${p.title}`);
    const img=document.createElement('img');img.src=p.url;img.loading='lazy';img.decoding='async';img.alt=`${p.title} — ${p.place}`;img.referrerPolicy='no-referrer';
    img.addEventListener('error',()=>{btn.classList.add('lake-photo-failed');img.style.display='none';});
    btn.append(img,text('span','lake-photo-open-overlay','View larger ↗'));
    btn.addEventListener('click',()=>openPhoto(p));
    const body=document.createElement('div');body.className='lake-photo-card-body';
    body.append(text('span','lake-photo-place',`${p.place} · ${p.year}`),text('h4','',p.title));
    const credit=document.createElement('p');credit.className='lake-photo-credit';
    credit.append(document.createTextNode(`Credit: ${p.author} · `),link(p.license,p.licenseUrl||p.source));
    body.append(credit,link('Original file & attribution ↗',p.source,'lake-photo-source-link'));
    card.append(btn,body);return card;
  }
  function render(){
    filtered=current();
    const n=filtered.length;
    start=n?((start%n)+n)%n:0;
    for(const [p,card] of cards){if(!filtered.includes(p)){card.remove();cards.delete(p);}}
    grid.querySelector('.lake-carousel-empty')?.remove();
    const visible=new Set();
    for(let offset=-2;offset<=2;offset++){
      if(!n)break;
      const i=(start+offset+n*2)%n,p=filtered[i];
      // For short collections use the nearest unique position, preferring the right on ties.
      const d=(i-start+n)%n;
      const slot=d>n/2?d-n:d;
      if(slot!==offset)continue;
      visible.add(p);
      let card=cards.get(p);
      if(!card){card=makeCard(p,i);cards.set(p,card);grid.append(card);}
      card.dataset.slot=String(slot);
      card.setAttribute('aria-label',`${i+1} of ${n}: ${p.title}`);
      card.inert=slot!==0;
      card.setAttribute('aria-hidden',String(slot!==0));
    }
    for(const [p,card] of cards){if(!visible.has(p)){card.remove();cards.delete(p);}}
    if(!n)grid.append(text('p','lake-carousel-empty','No matching photos loaded yet. Try All photos or load more Commons records.'));
    back.disabled=n<2;forward.disabled=n<2;toggle.disabled=n<2;
    toggle.textContent=playing?'Pause rotation':'Play rotation';
    pos.setAttribute('aria-live',playing?'off':'polite');
    pos.textContent=n?`${start+1} of ${n} loaded`:'No matching photos';
    countEl.textContent=`${photos.length} photographs loaded${exhausted?' · collection scanned':''}`;
    more.disabled=loading||exhausted;
    more.hidden=exhausted&&!apiFailed;
    more.textContent=loading?'Loading photographs…':apiFailed?'Retry Wikimedia Commons':'Load more photographs';
  }
  async function loadMore(){
    if(loading||exhausted)return;
    loading=true;apiFailed=false;render();
    status.textContent='Loading more Wikimedia Commons photo records…';
    try{
      let attempts=0,added=0;
      while(added<24&&attempts++<5){
        if(!pendingTitles.length)await collectTitles();
        if(!pendingTitles.length){exhausted=true;break;}
        const part=pendingTitles.splice(0,24);
        let result;
        try{result=await fetchMetadata(part);}
        catch(err){pendingTitles.unshift(...part);throw err;}
        photos.push(...result);added+=result.length;
      }
      if(!remaining())exhausted=true;
      status.textContent=exhausted
        ?'Reached the end of the scanned lake-focused Commons category tree. Files can be added by Wikimedia editors.'
        :`${added} more image(s) added. Use the arrows to rotate or Load more photographs to expand the collection.`;
    }catch(err){
      apiFailed=true;
      status.textContent=`Wikimedia Commons is temporarily unavailable (${err.message}). The eight featured photographs remain available. Retry to load the collection.`;
    }finally{loading=false;render();}
  }
  function setFilter(value){playing=false;filter=value;start=0;render();}
  function displayPhoto(p){
    const idx=filtered.indexOf(p);activeDialogIndex=idx<0?0:idx;
    $('lake-photo-counter').textContent=`Photo ${activeDialogIndex+1} of ${filtered.length} matching`;
    $('lake-photo-title').textContent=p.title;
    $('lake-photo-description').textContent=`${p.description} · ${p.place} · ${p.year}`;
    $('lake-photo-credit').textContent=`Creator / uploader credit: ${p.author} · ${p.license}`;
    $('lake-photo-source').href=p.source;
    $('lake-photo-license').href=p.licenseUrl||licenseURLs[p.license]||p.source;
    error.hidden=true;large.hidden=false;large.src=p.url;large.alt=p.title;
  }
  function openPhoto(p){playing=false;render();displayPhoto(p);if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}
  function movePhoto(delta){if(!filtered.length)return;activeDialogIndex=(activeDialogIndex+delta+filtered.length)%filtered.length;displayPhoto(filtered[activeDialogIndex]);}
  large.addEventListener('error',()=>{large.hidden=true;error.hidden=false;});
  $('lake-photo-close').addEventListener('click',()=>dialog.close?.());
  $('lake-photo-prev').addEventListener('click',()=>movePhoto(-1));
  $('lake-photo-next').addEventListener('click',()=>movePhoto(1));
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close?.();});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();movePhoto(-1);}if(e.key==='ArrowRight'){e.preventDefault();movePhoto(1);}});
  document.querySelectorAll('[data-lake-filter]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-lake-filter]').forEach(b=>{const on=b===button;b.classList.toggle('is-selected',on);b.setAttribute('aria-pressed',String(on));});
    setFilter(button.dataset.lakeFilter);
  }));
  $('lake-gallery-search').addEventListener('input',e=>{playing=false;search=e.target.value.toLowerCase().trim();start=0;render();});
  function rotate(delta,manual=false){if(filtered.length<2)return;if(manual)playing=false;start+=delta;render();}
  back.addEventListener('click',()=>rotate(-1,true));
  forward.addEventListener('click',()=>rotate(1,true));
  toggle.addEventListener('click',()=>{playing=!playing;render();});
  grid.addEventListener('pointerenter',()=>hovering=true);
  grid.addEventListener('pointerleave',()=>hovering=false);
  grid.addEventListener('focusin',()=>{playing=false;render();});
  reduced.addEventListener?.('change',e=>{if(e.matches){playing=false;render();}});
  setInterval(()=>{if(playing&&!hovering&&!section.hidden&&!document.hidden&&!dialog.open&&!grid.contains(document.activeElement))rotate(1);},4200);
  more.addEventListener('click',loadMore);
  grid.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();back.click();}
    if(e.key==='ArrowRight'){e.preventDefault();forward.click();}
  });
  let touchStart=0;
  grid.addEventListener('touchstart',e=>{touchStart=e.touches[0]?.clientX||0;},{passive:true});
  grid.addEventListener('touchend',e=>{const diff=(e.changedTouches[0]?.clientX||0)-touchStart;if(Math.abs(diff)>55)(diff>0?back:forward).click();},{passive:true});

  window.addEventListener('lakewatch-gallery-show',()=>render());
  render();
  loadMore();
})();
