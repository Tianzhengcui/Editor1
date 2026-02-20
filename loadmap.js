export async function loadMap2D(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error(`loadMap2D failed: ${res.status} ${url}`);
    const j = await res.json();

  // 简单校验一下维度（可选但建议）
  const { width, height } = j;
  const ground = j.layers && j.layers.ground;
  const collision = j.layers && j.layers.collision;
  console.log(ground.length)
  console.log(collision.length)
  if(!ground || !collision) throw new Error("Map JSON missing layers.ground / layers.collision");
  //if(ground.length !== height || collision.length !== height) throw new Error("Map height mismatch");

  for(let y=0;y<height;y++){
    //if(ground[y].length !== width || collision[y].length !== width) throw new Error(`Map width mismatch at row ${y}`);
  }

  return j; // {tileSize,width,height,layers:{ground,collision}}
}
