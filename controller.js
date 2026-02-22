// app.js (ES5) — 只显示 layers.collision
import { draw , initWorld3} from "./loaddata.js";

export function $(id){ return document.getElementById(id); }

var state = { json:null, locked:false };
let SW = window.innerWidth;
let SH = window.innerHeight;
const DESIGN_W = 891;
const DESIGN_H = 370;
export var scale = Math.min(SW / DESIGN_W, SH / DESIGN_H)
$("stage").style.width = SW * scale;
$("stage").style.height = SH * scale;
$("c").style.width = String(640 * scale) + "px";
$("c").style.height = String(480 * scale) + "px";
console.log($("c").style.height)
function log(msg){
  var t = new Date().toLocaleTimeString();
  $("log").textContent = "["+msg+"] "+"\n"+$("log").textContent;
}
function setStatus(s){ $("status").textContent = s; }

function isArray(v){
  return Object.prototype.toString.call(v)==="[object Array]";
}

// ===== 横屏提示（保持你原来的行为）=====
function checkOrientation(){
  var mask = $("portraitMask");
  //if(window.innerHeight > window.innerWidth) mask.classList.add("show");
  //else mask.classList.remove("show");
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);

// ===== 侧边栏（保持你原来的按钮）=====
$("btnDrawer").onclick = function(){ $("drawer").classList.add("open"); };
$("btnCloseDrawer").onclick = function(){ $("drawer").classList.remove("open"); };

// ===== 锁键（尽力阻止触控缩放/滚动）=====
$("btnLock").onclick = function(){
  state.locked = !state.locked;
  var btn = $("btnLock");
  if(state.locked){
    btn.textContent = "🔒";
    btn.classList.add("lockOn");
    document.body.style.touchAction = "none";
    document.body.style.overflow = "hidden";
    log("Touch locked");
  }else{
    btn.textContent = "🔓";
    btn.classList.remove("lockOn");
    document.body.style.touchAction = "auto";
    document.body.style.overflow = "hidden";
    log("Touch unlocked");
  }
};

// ====== 核心：渲染 collision ======
export const canvas = document.getElementById("c");
export var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

function renderCollision(){
  var out = $("out");
  out.innerHTML = "";

  if(!state.json || !state.json.layers || !state.json.layers.collision){
    $("info").textContent = "没有找到 layers.collision";
    log("No layers.collision in JSON");
    return;
  }

  var coll = state.json.layers.collision; // 数组：每项是一行字符串 :contentReference[oaicite:1]{index=1}
  if(!isArray(coll) || coll.length === 0){
    $("info").textContent = "layers.collision 不是数组或为空";
    log("layers.collision invalid");
    return;
  }

  var limit = parseInt($("limit").value, 10) || 200; // 最多显示多少行
  var rowsShown = Math.min(coll.length, limit);

  // 统计一下 1 的数量（可选，但挺有用）
  var ones = 0;
  for(var y=0; y<coll.length; y++){
    var line = String(coll[y] || "");
    for(var x=0; x<line.length; x++){
      if(line.charAt(x) === "1") ones++;
    }
  }

  for(var i=0; i<rowsShown; i++){
    var li = document.createElement("li");
    li.textContent = "row " + i + ": " + coll[i];
    out.appendChild(li);
  }

  $("info").textContent =
    "collision 行数=" + coll.length +
    " | 每行长度(示例)=" + String(coll[0] || "").length +
    " | 1 的总数=" + ones +
    " | 显示行数=" + rowsShown;

  log("Rendered layers.collision");
}
function renderCha(){
  //var out = $("out");
  //out.innerHTML = "";

  if(!state.json || !state.json.scence1.character_pos){
    $("info").textContent = "没有找到 character_pos";
    return;
  }
  console.log(state.json.scence1.character_pos)
  for(var k in state.json.scence1.character_pos){
    console.log(k,state.json.scence1.character_pos[k] );
  }
}

// ====== 读文件 / 读URL ======
$("file").onchange = function(evt){
  var f = evt.target.files[0];
  if(!f) return;
  var r = new FileReader();
  r.onload = function(){
    try{
      state.json = JSON.parse(r.result);
      setStatus("JSON OK");
      $("info").textContent = "JSON loaded";
      //renderCollision();
      renderCha();
      log("JSON loaded (file)");
    }catch(e){
      setStatus("JSON ERR");
      log("JSON parse error");
    }
  };
  r.readAsText(f);
};

$("btnLoadUrl").onclick = function(){
  var url = ($("url").value || "").trim();
  if(!url) return;
  setStatus("Loading...");
  fetch(url).then(function(r){ return r.text(); }).then(function(t){
    try{
      state.json = JSON.parse(t);
      setStatus("JSON OK");
      $("info").textContent = "JSON loaded";
      renderCha();
      log("JSON loaded (url): " + url);
    }catch(e){
      setStatus("JSON ERR");
      log("JSON parse error");
    }
  }).catch(function(){
    setStatus("Load ERR");
    log("Load failed: " + url);
  });
};

// “列出来”按钮：直接重渲染 collision（不走下拉）
$("btnShow").onclick = function(){
  if(!state.json){
    log("No JSON yet");
    return;
  }
  renderCha();
};

// 清空输出
$("btnClear").onclick = function(){
  $("out").innerHTML = "";
  $("info").textContent = "Cleared.";
  log("Output cleared");
};

// 下拉框留着也无所谓：直接塞一个固定项避免空白
(function initListPick(){
  var pick = $("listPick");
  if(pick){
    pick.innerHTML = "";
    var op = document.createElement("option");
    op.value = "layers.collision";
    op.textContent = "layers.collision (only)";
    pick.appendChild(op);
  }
})();

// boot
checkOrientation();
document.body.style.overflow = "hidden";
async function main(){
  await initWorld3();
  function loop(){
    draw(ctx);
    requestAnimationFrame(loop);
  }
  loop();
}
main();



setStatus("Ready");
log("Boot OK");
