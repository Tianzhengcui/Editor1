// world_render.js (示例名)
import { ctx , scale} from "./controller.js";
import { loadMap2D } from "./loadmap.js";
// ✅ 把这些按你项目真实来源改成 import
//import { player, keys, canInteract } from "./world.js"; 
// 如果你没有 world.js 导出这些，就先用下面临时兜底：
const keys = {};
const player = { x: 1600, y: 100, dir: "down", moving: false, animTime: 0 };

let TILE = 32;
let ground = [];
let collision = [];
let Mwidth = 0;
let Mheight = 0;

export const camera = { x: 0, y: 0 };

const FRAME_W = 32;
const FRAME_H = 52;
const FRAME_COUNT = 3;
const ANIM_SPEED = 8;

const titles = new Image();
titles.src = "assets/tiles/tiles.png";

const playerImg = new Image();
playerImg.src = "assets/player.png";

titles.onload = () => console.log("tiles image loaded", titles.naturalWidth, titles.naturalHeight);
titles.onerror = () => console.error("tiles image failed:", titles.src);

playerImg.onload = () => console.log("player image loaded", playerImg.naturalWidth, playerImg.naturalHeight);
playerImg.onerror = () => console.error("player image failed:", playerImg.src);

const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

export async function initWorld3() {
  const m = await loadMap2D("./maps/map01.json");

  TILE = m.tileSize;
  Mwidth = m.width;
  Mheight = m.height;

  ground = m.layers.ground || [];
  collision = m.layers.collision || [];

  // ✅ 避免 keys 未定义
  window.addEventListener("keydown", (e) => { keys[e.key] = true; });
  window.addEventListener("keyup",   (e) => { keys[e.key] = false; });

  console.log("map loaded:", { TILE, Mwidth, Mheight, groundH: ground.length });
}

export function closeEnemy(ctx) {
  // ✅ canInteract 可能还没准备好，别直接炸
  if (!canInteract) return;

  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(220, 420, 200, 40);

  ctx.fillStyle = "white";
  ctx.font = "16px monospace";
  ctx.fillText("[ Enter ] 战斗", 240, 445);
}

export function draw() {
  // ✅ 如果地图还没加载出来，先画个字，别“白屏无反馈”
  if (!ground || ground.length === 0) {
    ctx.clearRect(0, 0, 640, 480);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#fff";
    ctx.font = "16px monospace";
    ctx.fillText("Loading map / ground is empty...", 20, 30);
    return;
  }

  ctx.clearRect(0, 0, 640*scale, 480*scale);

  // 背景
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 640*scale, 480*scale);

  // ✅ tiles 没加载完就别 drawImage（不然你以为画了，其实没画）
  const tilesReady = titles.complete && titles.naturalWidth > 0;

  for (let y = 0; y < ground.length; y++) {
    for (let x = 0; x < ground[y].length; x++) {
      const t = ground[y][x];
      if (t === -1) continue;

      if (tilesReady) {
        ctx.drawImage(
          titles,
          t * TILE, 0, TILE, TILE,
          x * TILE - camera.x, y * TILE - camera.y, TILE * scale, TILE *scale
        );
      } else {
        // 临时方块占位，避免“白屏”
        ctx.fillStyle = "#ccc";
        ctx.fillRect(x * TILE - camera.x, y * TILE - camera.y, TILE *scale, TILE*scale);
      }
    }
  }

  // 玩家
  const playerReady = playerImg.complete && playerImg.naturalWidth > 0;
  if (playerReady && player) {
    const row = DIR_ROW[player.dir];
    const frame =(Math.floor(player.animTime / ANIM_SPEED) % FRAME_COUNT) ;

    ctx.drawImage(
      playerImg,
      frame * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H,
      player.x - camera.x, player.y - camera.y,
      FRAME_W, FRAME_H
    );
  }
}

