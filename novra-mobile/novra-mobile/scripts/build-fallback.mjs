// Génère src/data/catalogue-fallback.json à partir de la base Supabase publique.
// À relancer avant chaque build : `npm run snapshot` (variables EXPO_PUBLIC_* ou valeurs de .env).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env', '.env.production']) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
const env = loadEnv();
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = env.EXPO_PUBLIC_SUPABASE_KEY;
if (!URL_ || !KEY) { console.error('EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY manquants'); process.exit(1); }

const get = async (path) => {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { headers: { apikey: KEY } });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
};

const products = await get('products?select=id,slug,name,category,gender,price,description,details,images,colors,sizes,badge,featured,sort_order,track_inventory,focal_x,focal_y,created_at&status=eq.active&order=sort_order');
const variants = await get('product_variants?select=product_id,color,size,stock');
const byProduct = new Map();
for (const v of variants) {
  if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, []);
  byProduct.get(v.product_id).push({ color: v.color, size: v.size, stock: v.stock });
}
const out = products.map((p) => ({ ...p, product_variants: byProduct.get(p.id) ?? [] }));
writeFileSync('src/data/catalogue-fallback.json', JSON.stringify({ generatedAt: new Date().toISOString(), products: out }, null, 1));
console.log(`catalogue-fallback.json : ${out.length} produits`);
