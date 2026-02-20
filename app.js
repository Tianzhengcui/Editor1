// ES5 safe helpers
function $(id){return document.getElementById(id);}

var state={json:null,locked:false};

// ===== util =====
function log(msg){
  var t=new Date().toLocaleTimeString();
  $("log").textContent="["+t+"] "+msg+"\n"+$("log").textContent;
}
function setStatus(s){$("status").textContent=s;}

function isArray(v){
  return Object.prototype.toString.call(v)==="[object Array]";
}
function isObject(v){
  return v && typeof v==="object" && !isArray(v);
}

// 通过 "a.b.c" 路径取值
function getByPath(obj, path){
  if(!obj || !path) return undefined;
  var parts = path.split(".");
  var cur = obj;
  for(var i=0;i<parts.length;i++){
    if(cur==null) return undefined;
    cur = cur[parts[i]];
  }
  return cur;
}

// 把数组项安全转文字（避免太长）
function pretty(v){
  var s;
  try{ s = JSON.stringify(v); }
  catch(e){ s = String(v); }
  if(s.length>300) s = s.slice(0,300)+"…";
  return s;
}

// ===== orientation check =====
function checkOrientation(){
  var mask=$("portraitMask");
  if(window.innerHeight>window.innerWidth){mask.classList.add("show");}
  else{mask.classList.remove("show");}
}
window.addEventListener("resize",checkOrientation);
window.addEventListener("orientationchange",checkOrientation);

// ===== drawer =====
$("btnDrawer").onclick=function(){ $("drawer").classList.add("open"); };
$("btnCloseDrawer").onclick=function(){ $("drawer").classList.remove("open"); };

// ===== lock button (best-effort) =====
$("btnLock").onclick=function(){
  state.locked=!state.locked;
  var btn=$("btnLock");
  if(state.locked){
    btn.textContent="🔒";
    btn.classList.add("lockOn");
    document.body.style.touchAction="none";
    // 进一步阻止滚动
    document.body.style.overflow="hidden";
    log("Touch locked");
  }else{
    btn.textContent="🔓";
    btn.classList.remove("lockOn");
    document.body.style.touchAction="auto";
    document.body.style.overflow="hidden"; // 这里仍然保持不滚动（你的 UI 更稳）
    log("Touch unlocked");
  }
};

// ===== file load =====
$("file").onchange=function(evt){
  var f=evt.target.files[0];
  if(!f)return;
  var r=new FileReader();
  r.onload=function(){
    try{
      state.json=JSON.parse(r.result);
      afterJSON();
      log("JSON loaded (file)");
    }catch(e){
      log("JSON parse error");
    }
  };
  r.readAsText(f);
};

// ===== url load =====
$("btnLoadUrl").onclick=function(){
  var url=$("url").value.trim();
  if(!url)return;
  fetch(url).then(function(r){return r.text();}).then(function(t){
    try{
      state.json=JSON.parse(t);
      afterJSON();
      log("JSON loaded (url)");
    }catch(e){
      log("JSON parse error");
    }
  }).catch(function(){
    log("Load failed");
  });
};

// ===== find arrays (支持 map01.json: layers.ground 等) =====
function collectArrayPaths(root){
  // 只做“浅层 + 重点层”扫描：顶层数组、root.layers 下的数组
  var paths = [];
  if(!root) return paths;

  // 1) 顶层直接是数组的字段
  for(var k in root){
    if(!root.hasOwnProperty(k)) continue;
    if(isArray(root[k])) paths.push(k);
  }

  // 2) 如果有 layers（你的格式就是这样） :contentReference[oaicite:1]{index=1}
  if(root.layers && isObject(root.layers)){
    for(var name in root.layers){
      if(!root.layers.hasOwnProperty(name)) continue;
      if(isArray(root.layers[name])) paths.push("layers."+name);
    }
  }

  // 去重
  var uniq = {};
  var out = [];
  for(var i=0;i<paths.length;i++){
    if(!uniq[paths[i]]){
      uniq[paths[i]]=1;
      out.push(paths[i]);
    }
  }
  return out;
}

function afterJSON(){
  var pick=$("listPick");
  pick.innerHTML="";
  if(!state.json) return;

  var paths = collectArrayPaths(state.json);

  // 如果没找到任何数组，就给个提示
  if(paths.length===0){
    var op=document.createElement("option");
    op.value="";
    op.textContent="(没有找到数组 list)";
    pick.appendChild(op);
    $("info").textContent="JSON loaded，但没有发现可列出的 list";
    setStatus("JSON OK");
    return;
  }

  // 默认优先选 layers.ground（如果存在）
  var defaultPath = "";
  for(var i=0;i<paths.length;i++){
    var op=document.createElement("option");
    op.value=paths[i];
    op.textContent=paths[i];
    pick.appendChild(op);
    if(paths[i]==="layers.ground") defaultPath = "layers.ground";
  }
  if(defaultPath) pick.value = defaultPath;

  // 显示一点 meta（适配你 map 格式）
  var info = "JSON loaded";
  if(state.json.tileSize!=null && state.json.width!=null && state.json.height!=null){
    info += " | tileSize="+state.json.tileSize+" w="+state.json.width+" h="+state.json.height;
  }
  $("info").textContent = info;
  setStatus("JSON OK");
}

// ===== show list =====
$("btnShow").onclick=function(){
  var path=$("listPick").value;
  if(!state.json || !path){
    log("No list selected");
    return;
  }
  var arr = getByPath(state.json, path);
  if(!isArray(arr)){
    log("Selected path is not an array: "+path);
    return;
  }

  var lim=parseInt($("limit").value,10)||200;
  var out=$("out");
  out.innerHTML="";

  // 如果是二维数组（map 的 tile layer 就是这样） :contentReference[oaicite:2]{index=2}
  var is2D = (arr.length>0 && isArray(arr[0]));

  if(is2D){
    // 按“行”列出来：Row 0: [1,1,1,...]
    for(var y=0; y<arr.length && y<lim; y++){
      var li=document.createElement("li");
      li.textContent = "row " + y + ": " + pretty(arr[y]);
      out.appendChild(li);
    }
    log("Rendered 2D list rows: "+path+" (rows shown="+Math.min(arr.length,lim)+")");
  }else{
    // 普通一维数组：逐项列出
    for(var i=0;i<arr.length && i<lim;i++){
      var li2=document.createElement("li");
      li2.textContent = i + ": " + pretty(arr[i]);
      out.appendChild(li2);
    }
    log("Rendered list: "+path+" (items shown="+Math.min(arr.length,lim)+")");
  }
};

$("btnClear").onclick=function(){
  $("out").innerHTML="";
  log("Output cleared");
};

// ===== boot =====
checkOrientation();
setStatus("Ready");
log("Boot OK");

