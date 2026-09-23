/**
 * Coarse continent outlines, used to decide which points of the globe's dot grid are land.
 *
 * Deliberately low-fidelity: the globe draws each point as a ~2px dot, so detail finer than a
 * couple of degrees is smaller than a pixel and only costs work. Rings are [lon, lat] in degrees,
 * lon -180..180 and lat -90..90, and every ring is treated as a simple closed polygon — no holes,
 * so inland seas are filled. At dot scale that reads as "world map" and nothing more is needed.
 */

/* eslint-disable */
const RINGS = [
  // North America, down through Central America
  [[-168,66],[-166,68],[-156,71],[-140,70],[-128,70],[-114,69],[-100,70],[-92,73],[-82,73],[-74,68],
   [-64,61],[-56,54],[-53,47],[-60,46],[-67,45],[-70,41],[-74,39],[-76,35],[-81,31],[-80,25],[-83,28],
   [-88,30],[-94,29],[-97,26],[-91,19],[-87,16],[-83,10],[-79,8],[-83,14],[-92,15],[-96,16],[-105,20],
   [-110,24],[-113,30],[-117,33],[-121,36],[-124,41],[-124,48],[-131,54],[-140,59],[-148,60],[-157,58],[-165,62]],
  // Greenland
  [[-58,83],[-30,84],[-20,80],[-22,72],[-38,66],[-45,60],[-53,66],[-58,72],[-62,78]],
  // South America
  [[-81,9],[-75,11],[-68,11],[-60,9],[-52,5],[-50,0],[-44,-2],[-38,-5],[-35,-8],[-39,-15],[-41,-22],
   [-48,-25],[-53,-33],[-58,-38],[-62,-41],[-66,-45],[-69,-52],[-74,-53],[-75,-46],[-73,-40],[-71,-32],
   [-70,-23],[-70,-18],[-75,-14],[-79,-7],[-81,-4],[-80,1],[-78,5]],
  // Africa
  [[-17,15],[-16,21],[-12,28],[-9,32],[-5,36],[3,37],[10,34],[18,31],[25,32],[32,31],[35,28],[38,22],
   [39,15],[43,12],[51,12],[51,5],[45,0],[41,-5],[40,-11],[36,-17],[35,-22],[32,-26],[28,-32],[22,-34],
   [18,-34],[15,-27],[12,-18],[9,-2],[5,4],[-2,5],[-8,4],[-13,8],[-17,11]],
  // Eurasia: north coast eastward, then back west through SE Asia, India, Arabia and the Med
  [[-10,36],[-9,43],[-2,43],[-1,46],[-4,48],[0,49],[4,53],[9,54],[13,54],[19,54],[24,57],[28,59],[30,60],
   [25,65],[22,66],[17,68],[20,70],[28,71],[36,68],[44,68],[55,68],[65,70],[75,73],[85,74],[95,76],
   [105,77],[113,74],[128,73],[140,72],[150,70],[160,70],[170,69],[178,68],[175,62],[165,60],[160,58],
   [155,52],[143,45],[140,42],[132,43],[130,38],[126,35],[122,31],[120,25],[112,21],[108,15],[106,10],
   [104,2],[100,7],[98,12],[95,16],[92,21],[88,22],[85,20],[82,17],[80,13],[77,8],[75,15],[73,20],
   [70,25],[65,25],[61,25],[57,25],[56,27],[52,29],[50,25],[52,19],[55,17],[52,14],[45,13],[43,13],
   [39,21],[35,28],[34,31],[36,33],[36,36],[30,36],[26,40],[23,40],[20,40],[16,41],[13,38],[15,42],
   [12,44],[8,44],[4,43],[3,42],[-2,36]],
  // Australia
  [[113,-22],[114,-28],[116,-35],[123,-34],[129,-32],[134,-33],[138,-35],[141,-38],[146,-39],[150,-37],
   [153,-31],[153,-25],[146,-19],[142,-11],[136,-12],[130,-11],[126,-14],[122,-18],[117,-21]],
  // Islands large enough to survive the dot grid
  [[-6,50],[-3,50],[2,53],[-1,56],[-3,58],[-5,58],[-6,55],[-5,52]],               // British Isles
  [[-24,65],[-14,66],[-14,64],[-22,63]],                                          // Iceland
  [[129,32],[135,34],[140,36],[142,41],[145,44],[142,45],[138,38],[133,34],[130,31]], // Japan
  [[43,-12],[50,-15],[50,-25],[45,-25],[43,-18]],                                 // Madagascar
  [[172,-34],[178,-37],[178,-41],[172,-45],[166,-46],[170,-41]],                   // New Zealand
  [[109,2],[119,1],[117,-4],[110,-3]],                                            // Borneo
  [[95,5],[103,1],[110,-6],[115,-9],[106,-7],[100,0]],                            // Sumatra + Java
  [[131,-1],[141,-3],[150,-7],[147,-9],[138,-9],[132,-5]],                        // New Guinea
  [[120,18],[124,12],[126,7],[122,10],[120,14]],                                  // Philippines
  [[-85,22],[-77,20],[-74,20],[-80,23]],                                          // Cuba / Hispaniola
  [[145,-41],[148,-41],[148,-43],[145,-43]],                                      // Tasmania
]
/* eslint-enable */

/** Ray-casting point-in-polygon. Rings never cross the antimeridian, so no wrapping is needed. */
function inRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** True when [lon, lat] falls on one of the landmasses above. */
export function isLand(lon, lat) {
  for (const ring of RINGS) if (inRing(lon, lat, ring)) return true
  return false
}

/**
 * An even-ish covering of the land in [lon, lat] pairs.
 *
 * Rows are spaced by `step` degrees of latitude and the number of columns in each row scales with
 * cos(lat), so dots stay roughly equidistant on the sphere instead of bunching at the poles the
 * way a naive lon/lat grid does.
 */
export function landPoints(step = 2.6) {
  const points = []
  for (let lat = -78; lat <= 84; lat += step) {
    const circumference = Math.cos((lat * Math.PI) / 180)
    const columns = Math.max(6, Math.round((360 / step) * circumference))
    for (let c = 0; c < columns; c++) {
      const lon = -180 + (360 / columns) * c
      if (isLand(lon, lat)) points.push([lon, lat])
    }
  }
  return points
}
