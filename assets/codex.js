'use strict';
(function(){
  const store=window.POXU_CODEX_DATA;
  const catalog=document.getElementById('catalog');
  const count=document.getElementById('resultCount');
  const empty=document.getElementById('empty');
  const query=document.getElementById('search');
  const category=document.getElementById('category');
  const reset=document.getElementById('reset');
  const tabs=[document.getElementById('tabPlants'),document.getElementById('tabZombies')];
  if(!store || !Array.isArray(store.plants)|| !Array.isArray(store.zombies)){
    count.textContent='图鉴数据读取失败，请确认 assets/codex-data.js 已完整部署。';return;
  }
  const groups=[];
  const byName=new Map();
  store.zombies.forEach(function(item){
    if(!byName.has(item.name)){const x={name:item.name,forms:[]};byName.set(item.name,x);groups.push(x);}
    byName.get(item.name).forms.push(item);
  });
  const activeForm=new Map();
  let tab='plants';
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
  const contains=(value,q)=>String(value==null?'':value).toLocaleLowerCase().includes(q);
  const textOf=(values)=>values.join(' ').toLocaleLowerCase();
  function metric(title,value){let item=el('div','metric');item.append(el('small','',title),el('b','',value==null||value===''?'待核对':value));return item;}
  function plantCard(p,index){
    const card=el('article','entry');
    const head=el('div','entry-head');const left=el('div');left.append(el('span','type-label',p.category),el('h3','',p.name),el('div','en',p.en));
    head.append(left,el('div','number',String(index+1).padStart(2,'0')));card.append(head);
    const metrics=el('div','metrics');metrics.append(metric('当前 HP',p.currentHp),metric('阳光',p.currentSun),metric('冷却 / 秒',p.currentCooldown));card.append(metrics);
    const summary=el('p','description short',p.mechanic);card.append(summary);
    const button=el('button','expand','展开完整属性 ＋');button.type='button';button.setAttribute('aria-expanded','false');
    const detail=el('div','detail');detail.hidden=true;
    const dl=el('dl');[['HP 修改',p.hpChange],['阳光修改',p.sunChange],['冷却修改',p.cooldownChange],['原版 HP',p.originalHp],['原版阳光',p.originalSun],['原版冷却（秒）',p.originalCooldown]].forEach(function(kv){dl.append(el('dt','',kv[0]),el('dd','',kv[1]));});
    detail.append(dl,el('p','full-detail',p.mechanic));
    button.addEventListener('click',()=>{detail.hidden=!detail.hidden;summary.hidden=!detail.hidden;const open=!detail.hidden;button.textContent=open?'收起详情 −':'展开完整属性 ＋';button.setAttribute('aria-expanded',String(open));});
    card.append(button,detail);return card;
  }
  function zombieCard(z,index){
    const card=el('article','entry zombie');
    const head=el('div','entry-head');const left=el('div');left.append(el('span','type-label',z.forms.length>1?z.forms.length+' 种形态':'基础形态'),el('h3','',z.name),el('div','en','点击下方标签切换形态'));
    head.append(left,el('div','number',String(index+1).padStart(2,'0')));card.append(head);
    const pills=el('div','variant-pills');pills.setAttribute('aria-label',z.name+'形态选择');card.append(pills);
    const content=el('div','zombie-detail');card.append(content);
    function drawForm(){
      const formIndex=activeForm.has(z.name)?activeForm.get(z.name):0;
      const form=z.forms[Math.min(formIndex,z.forms.length-1)];
      pills.replaceChildren();
      z.forms.forEach(function(f,j){const b=el('button','variant-pill'+(j===formIndex?' active':''),f.variant);b.type='button';b.setAttribute('aria-pressed',String(j===formIndex));b.addEventListener('click',()=>{activeForm.set(z.name,j);drawForm();});pills.append(b);});
      content.replaceChildren(el('h4','',form.variant));
      [['贴图变化',form.art],['HP / 装备',form.hp],['移动速度',form.speed],['啃食伤害',form.bite],['机制修改',form.mechanic]].forEach(function(kv){let block=el('div','rowinfo');block.append(el('strong','',kv[0]),el('p','',kv[1]||'待核对'));content.append(block);});
    }
    drawForm();return card;
  }
  function initCategory(){category.replaceChildren();const all=el('option','','全部分类');all.value='all';category.append(all);
    const opts=tab==='plants'?store.categories:['allWithElite','baseOnly','specialOnly'];
    const names={allWithElite:'包含精英分支',baseOnly:'只有一个形态',specialOnly:'含特殊形态'};
    opts.forEach(function(x){const op=el('option','',names[x]||x);op.value=x;category.append(op);});
    category.value='all';
  }
  function selected(items){return items.filter(function(p){const q=query.value.trim().toLocaleLowerCase();if(tab==='plants'){
      if(category.value!=='all'&&p.category!==category.value)return false;
      return !q||contains(textOf([p.name,p.en,p.category,p.hpChange,p.sunChange,p.cooldownChange,p.mechanic,p.currentHp,p.currentSun,p.currentCooldown]),q);
    }
    if(category.value==='allWithElite'&&!p.forms.some(f=>f.variantType==='精英'))return false;
    if(category.value==='baseOnly'&&p.forms.length!==1)return false;
    if(category.value==='specialOnly'&&!p.forms.some(f=>f.variantType==='特殊'))return false;
    return !q||contains(textOf([p.name,...p.forms.flatMap(f=>[f.variant,f.art,f.hp,f.speed,f.bite,f.mechanic])]),q);
  });}
  function render(){const isPlants=tab==='plants';const items=selected(isPlants?store.plants:groups);
    const frag=document.createDocumentFragment();items.forEach((item,i)=>frag.append(isPlants?plantCard(item,store.plants.indexOf(item)):zombieCard(item,groups.indexOf(item))));
    catalog.replaceChildren(frag);
    count.textContent=isPlants?`显示 ${items.length} / ${store.plants.length} 株植物`:`显示 ${items.length} / ${groups.length} 类僵尸（数据库共 ${store.zombies.length} 条形态）`;
    empty.hidden=items.length!==0;
  }
  function resetAll(){query.value='';category.value='all';render();}
  tabs.forEach(function(t){t.addEventListener('click',()=>{
    tab=t.dataset.tab;tabs.forEach(x=>{const active=x===t;x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active));});
    query.value='';initCategory();render();
  });});
  query.addEventListener('input',render);category.addEventListener('change',render);reset.addEventListener('click',resetAll);document.getElementById('emptyReset').addEventListener('click',resetAll);
  initCategory();render();
})();
