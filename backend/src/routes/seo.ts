import { Router, Request, Response } from 'express';
import { loadGyms, getCities } from '../data/gymsLoader';

const router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cityTier(count: number): 'grande' | 'mediana' | 'pequena' {
  if (count >= 30) return 'grande';
  if (count >= 10) return 'mediana';
  return 'pequena';
}

function pickTemplate(city: string, count: number, gymNames: string[]): { intro: string; training: string } {
  const tier = cityTier(count);
  const top3 = gymNames.slice(0, 3).join(', ');
  const top2 = gymNames.slice(0, 2).join(' y ');
  const hash = city.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const intros: Record<string, string[]> = {
    grande: [
      `${city} es uno de los epicentros del Brazilian Jiu-Jitsu en España, con ${count} academias repartidas por toda la ciudad. Desde el centro hasta los barrios más alejados, encontrarás gimnasios para todos los niveles: desde clases para principiantes hasta entrenamientos de alto rendimiento orientados a la competición. Academias como ${top3} forman parte de una escena que no para de crecer.`,
      `Con ${count} centros de entrenamiento activos, ${city} ofrece una de las mayores concentraciones de BJJ del país. Tanto si buscas tu primer gi como si llevas años compitiendo, la variedad de academias —entre ellas ${top3}— garantiza que encuentres el ambiente y el nivel que necesitas.`,
    ],
    mediana: [
      `El Brazilian Jiu-Jitsu lleva años creciendo en ${city}, y hoy cuenta con ${count} academias donde entrenar. La comunidad local es cohesionada y activa, con clubs como ${top2} que organizan seminarios y open mats regulares. Una ciudad donde el BJJ tiene cada vez más arraigo.`,
      `${city} concentra ${count} academias de BJJ en una escena que combina clubes veteranos y gimnasios nuevos. Si buscas dónde empezar o dónde seguir progresando, encontrarás opciones adaptadas a tu nivel, con clubes como ${top2} liderando la actividad local.`,
    ],
    pequena: [
      `${city} cuenta con ${count} ${count === 1 ? 'academia' : 'academias'} de Brazilian Jiu-Jitsu donde dar tus primeros pasos en el grappling o seguir perfeccionando tu juego. Una comunidad pequeña pero comprometida que practica regularmente y recibe visitas de competidores de toda España.`,
      `Aunque compacta, la escena de BJJ en ${city} tiene ${count} ${count === 1 ? 'opción' : 'opciones'} de entrenamiento. La cercanía entre practicantes hace que el ambiente sea especialmente acogedor para quien quiere iniciarse o para quien pasa por la ciudad buscando un entrenamiento.`,
    ],
  };

  const trainings: Record<string, string[]> = {
    grande: [
      `Entrenar BJJ en ${city} significa tener acceso a una comunidad grande y diversa. Encontrarás clases de gi y no-gi, grupos de competición, open mats semanales y seminarios con instructores nacionales e internacionales. La alta concentración de academias genera también un circuito interno de interclub que acelera el progreso de todos los practicantes.`,
      `La escena de ${city} destaca por su variedad: academias especializadas en competición junto a clubs orientados a la salud y el fitness, horarios amplios que encajan con cualquier rutina y una cultura de open mat que facilita entrenar en distintos gimnasios sin fricciones.`,
    ],
    mediana: [
      `Entrenar en ${city} tiene la ventaja de pertenecer a una comunidad activa sin la dispersión de las grandes ciudades. Los open mats y los torneos locales son frecuentes, y los profesores conocen a sus alumnos por su nombre. El BJJ aquí es tan serio como en cualquier gran ciudad, con la cercanía como valor añadido.`,
      `La comunidad BJJ de ${city} combina lo mejor de dos mundos: la seriedad técnica de clubs bien establecidos y el ambiente familiar de una ciudad mediana donde todos se conocen. Los campamentos y torneos regionales son punto de encuentro habitual.`,
    ],
    pequena: [
      `Practicar BJJ en ${city} es una experiencia íntima donde el progreso es visible y la motivación colectiva es alta. Los viajes a torneos regionales son parte habitual de la vida del club, y la comunidad local está siempre abierta a recibir practicantes visitantes.`,
      `El BJJ en ${city} funciona como una familia pequeña pero sólida. Muchos practicantes llevan años juntos en el tatami, lo que crea un nivel técnico sorprendentemente alto para el tamaño de la ciudad.`,
    ],
  };

  const idx = hash % 2;
  return {
    intro: intros[tier][idx],
    training: trainings[tier][idx],
  };
}

function buildFaq(city: string, count: number, gyms: Array<{ name: string; rating: number | null; address: string | null }>): Array<{ q: string; a: string }> {
  const top = gyms[0];
  const bestRated = gyms
    .filter((g) => g.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0];

  const faqs: Array<{ q: string; a: string }> = [
    {
      q: `¿Cuántas academias de Brazilian Jiu-Jitsu hay en ${city}?`,
      a: `Actualmente hay ${count} ${count === 1 ? 'academia' : 'academias'} de BJJ registradas en ${city} en nuestro directorio. El número puede variar según nuevas aperturas o cierres.`,
    },
    {
      q: `¿Qué es el Brazilian Jiu-Jitsu y cómo puedo empezar en ${city}?`,
      a: `El Brazilian Jiu-Jitsu (BJJ) es un arte marcial de agarre enfocado en derribo, control en el suelo y sumisiones. Para empezar en ${city} no necesitas experiencia previa: la mayoría de academias ofrecen clases de iniciación. Busca una academia, contacta con ellos y pregunta por una clase de prueba gratuita.`,
    },
    {
      q: `¿Cuánto cuesta entrenar BJJ en ${city}?`,
      a: `El precio varía por academia y modalidad. En ${city} la cuota mensual típica oscila entre 50 € y 100 € al mes. Muchas academias ofrecen también clases sueltas para quienes no quieren comprometerse con una mensualidad.`,
    },
  ];

  if (bestRated && bestRated.rating) {
    faqs.push({
      q: `¿Cuál es la mejor academia de BJJ en ${city}?`,
      a: `Según las valoraciones de Google, ${bestRated.name} es una de las academias mejor valoradas de ${city}${bestRated.address ? `, situada en ${bestRated.address}` : ''}. Consulta nuestro directorio completo para comparar todas las opciones disponibles.`,
    });
  }

  if (count >= 5) {
    faqs.push({
      q: `¿Se hacen open mats en ${city}?`,
      a: `Sí, varios gimnasios de ${city} organizan open mats regulares, especialmente los fines de semana. Consulta la sección de Open Mats de nuestro directorio para ver horarios actualizados o contacta directamente con los clubs para confirmar disponibilidad.`,
    });
  }

  faqs.push({
    q: `¿Puedo entrenar BJJ en ${city} siendo principiante absoluto?`,
    a: `Absolutamente. Todas las academias de ${city} tienen clases adaptadas a principiantes. El BJJ tiene una curva de aprendizaje técnica, pero los buenos profesores saben cómo introducir a alumnos nuevos de forma segura y progresiva.`,
  });

  return faqs;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHtml(params: {
  city: string;
  slug: string;
  gyms: Array<{ name: string; address: string | null; rating: number | null; phone: string | null; website: string | null }>;
  intro: string;
  training: string;
  faqs: Array<{ q: string; a: string }>;
}): string {
  const { city, slug, gyms, intro, training, faqs } = params;
  const count = gyms.length;
  const title = `Academias de Brazilian Jiu-Jitsu en ${city} | BJJ Spain`;
  const description = `Encuentra las ${count} mejores academias de BJJ en ${city}. Horarios, precios, open mats y más. Directorio actualizado de Brazilian Jiu-Jitsu en ${city}, España.`;
  const canonical = `https://bjjspain.es/bjj-${slug}`;

  const gymListItems = gyms
    .map(
      (g, i) => `{
      "@type": "ListItem",
      "position": ${i + 1},
      "name": "${escapeHtml(g.name)}",
      "description": "Academia de Brazilian Jiu-Jitsu en ${escapeHtml(city)}"
      ${g.website ? `,"url": "${escapeHtml(g.website)}"` : ''}
    }`,
    )
    .join(',\n    ');

  const faqItems = faqs
    .map(
      (f) => `{
      "@type": "Question",
      "name": "${escapeHtml(f.q)}",
      "acceptedAnswer": { "@type": "Answer", "text": "${escapeHtml(f.a)}" }
    }`,
    )
    .join(',\n    ');

  const gymRows = gyms
    .map(
      (g) => `
    <div style="border:1px solid #222;border-radius:8px;padding:16px;margin-bottom:12px;background:#141414;">
      <h3 style="margin:0 0 6px;color:#f5c842;font-size:1.05rem;">${escapeHtml(g.name)}</h3>
      ${g.address ? `<p style="margin:0 0 4px;color:#aaa;font-size:.9rem;">📍 ${escapeHtml(g.address)}</p>` : ''}
      ${g.rating ? `<p style="margin:0 0 4px;color:#aaa;font-size:.9rem;">⭐ ${g.rating} / 5</p>` : ''}
      ${g.phone ? `<p style="margin:0 0 4px;color:#aaa;font-size:.9rem;">📞 ${escapeHtml(g.phone)}</p>` : ''}
      ${g.website ? `<p style="margin:0;"><a href="${escapeHtml(g.website)}" style="color:#f5c842;font-size:.9rem;" rel="noopener">Sitio web →</a></p>` : ''}
    </div>`,
    )
    .join('');

  const faqHtml = faqs
    .map(
      (f) => `
    <div style="margin-bottom:20px;">
      <h3 style="color:#fff;font-size:1rem;margin:0 0 6px;">${escapeHtml(f.q)}</h3>
      <p style="color:#aaa;font-size:.9rem;margin:0;">${escapeHtml(f.a)}</p>
    </div>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta name="robots" content="index, follow" />
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,sans-serif;background:#0d0d0d;color:#e5e5e5;line-height:1.6}
    .container{max-width:900px;margin:0 auto;padding:40px 20px}
    h1{font-size:clamp(1.6rem,4vw,2.4rem);color:#f5c842;margin-bottom:16px}
    h2{font-size:1.3rem;color:#f5c842;border-bottom:1px solid #222;padding-bottom:8px;margin-top:40px}
    p{color:#ccc;margin:0 0 16px}
    a{color:#f5c842}
    nav{background:#111;padding:12px 20px;border-bottom:1px solid #222;position:sticky;top:0;z-index:10}
    nav a{color:#f5c842;text-decoration:none;font-weight:600;margin-right:20px;font-size:.9rem}
    footer{margin-top:60px;padding:20px;text-align:center;color:#555;font-size:.8rem;border-top:1px solid #1a1a1a}
    .badge{display:inline-block;background:#1a1a1a;border:1px solid #333;border-radius:4px;padding:2px 8px;font-size:.8rem;color:#aaa;margin-bottom:16px}
  </style>
  <script type="application/ld+json">
  [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Academias de BJJ en ${escapeHtml(city)}",
      "description": "${escapeHtml(description)}",
      "numberOfItems": ${count},
      "itemListElement": [
    ${gymListItems}
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
    ${faqItems}
      ]
    }
  ]
  </script>
</head>
<body>
  <nav>
    <a href="/">🥋 BJJ Spain</a>
    <a href="/academias-bjj-espana">Todas las ciudades</a>
    <a href="/openmats">Open Mats</a>
    <a href="/eventos">Eventos</a>
  </nav>
  <div class="container">
    <span class="badge">📍 ${escapeHtml(city)}, España · ${count} academias</span>
    <h1>Academias de Brazilian Jiu-Jitsu en ${escapeHtml(city)}</h1>
    <p>${escapeHtml(intro)}</p>

    <h2>Academias de BJJ en ${escapeHtml(city)}</h2>
    ${gymRows}

    <h2>Entrenar BJJ en ${escapeHtml(city)}</h2>
    <p>${escapeHtml(training)}</p>

    <h2>Preguntas frecuentes sobre BJJ en ${escapeHtml(city)}</h2>
    ${faqHtml}
  </div>
  <footer>
    <p>© BJJ Spain — Directorio de academias de Brazilian Jiu-Jitsu en España</p>
    <p><a href="/academias-bjj-espana">Ver todas las ciudades</a> · <a href="/">Volver al inicio</a></p>
  </footer>
</body>
</html>`;
}

// GET /api/seo/city/:slug — JSON data for React components
router.get('/api/seo/city/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase().trim();
  const allGyms = loadGyms();
  const matching = allGyms.filter((g) => slugify(g.city) === slug);
  if (matching.length === 0) {
    res.status(404).json({ error: 'Ciudad no encontrada' });
    return;
  }
  const city = matching[0].city;
  const gymNames = matching.map((g) => g.name);
  const { intro, training } = pickTemplate(city, matching.length, gymNames);
  const faqs = buildFaq(city, matching.length, matching);
  const bestRated = [...matching].filter((g) => g.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;
  res.json({
    city,
    slug,
    count: matching.length,
    intro,
    training,
    faqs,
    bestRated: bestRated ? { name: bestRated.name, rating: bestRated.rating, address: bestRated.address } : null,
  });
});

// GET /bjj-:ciudad — serve complete crawlable HTML
router.get('/bjj-:ciudad', (req: Request, res: Response) => {
  const slug = req.params.ciudad.toLowerCase().trim();
  const allGyms = loadGyms();

  // Find gyms matching this slug
  const matching = allGyms.filter((g) => slugify(g.city) === slug);
  if (matching.length === 0) {
    res.status(404).send(`<h1>Ciudad no encontrada</h1><p>No hay academias de BJJ registradas para esta ciudad.</p><a href="/academias-bjj-espana">Ver todas las ciudades</a>`);
    return;
  }

  const city = matching[0].city;
  const gymNames = matching.map((g) => g.name);
  const { intro, training } = pickTemplate(city, matching.length, gymNames);
  const faqs = buildFaq(city, matching.length, matching);

  const html = buildHtml({ city, slug, gyms: matching, intro, training, faqs });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(html);
});

// GET /sitemap.xml
router.get('/sitemap.xml', (_req: Request, res: Response) => {
  const allGyms = loadGyms();
  const citySet = new Set<string>();
  allGyms.forEach((g) => citySet.add(g.city));

  const today = new Date().toISOString().split('T')[0];
  const cityUrls = [...citySet]
    .sort()
    .map((city) => {
      const slug = slugify(city);
      return `  <url>\n    <loc>https://bjjspain.es/bjj-${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    })
    .join('\n');

  const staticUrls = ['/', '/openmats', '/eventos', '/seminarios', '/instructores', '/academias-bjj-espana']
    .map((path) => `  <url>\n    <loc>https://bjjspain.es${path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${path === '/' ? '1.0' : '0.7'}</priority>\n  </url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${cityUrls}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// GET /academias-bjj-espana — city index page
router.get('/academias-bjj-espana', (_req: Request, res: Response) => {
  const allGyms = loadGyms();
  const cityMap = new Map<string, number>();
  allGyms.forEach((g) => cityMap.set(g.city, (cityMap.get(g.city) ?? 0) + 1));

  const sorted = [...cityMap.entries()].sort((a, b) => b[1] - a[1]);

  const cityLinks = sorted
    .map(([city, count]) => {
      const slug = slugify(city);
      return `<a href="/bjj-${slug}" style="display:flex;justify-content:space-between;padding:10px 14px;background:#141414;border:1px solid #222;border-radius:6px;text-decoration:none;color:#e5e5e5;transition:border-color .2s" onmouseover="this.style.borderColor='#f5c842'" onmouseout="this.style.borderColor='#222'"><span>${escapeHtml(city)}</span><span style="color:#f5c842;font-size:.85rem">${count} ${count === 1 ? 'academia' : 'academias'}</span></a>`;
    })
    .join('\n');

  const today = new Date().toISOString().split('T')[0];
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Academias de BJJ en España por ciudad | BJJ Spain</title>
  <meta name="description" content="Directorio completo de academias de Brazilian Jiu-Jitsu en España. Encuentra gimnasios de BJJ en Madrid, Barcelona, Valencia, Sevilla, Bilbao y más de ${sorted.length} ciudades." />
  <link rel="canonical" href="https://bjjspain.es/academias-bjj-espana" />
  <meta name="robots" content="index, follow" />
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:system-ui,sans-serif;background:#0d0d0d;color:#e5e5e5;line-height:1.6}
    .container{max-width:900px;margin:0 auto;padding:40px 20px}
    h1{font-size:clamp(1.6rem,4vw,2.2rem);color:#f5c842;margin-bottom:8px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-top:24px}
    nav{background:#111;padding:12px 20px;border-bottom:1px solid #222;position:sticky;top:0;z-index:10}
    nav a{color:#f5c842;text-decoration:none;font-weight:600;margin-right:20px;font-size:.9rem}
    footer{margin-top:60px;padding:20px;text-align:center;color:#555;font-size:.8rem;border-top:1px solid #1a1a1a}
  </style>
</head>
<body>
  <nav>
    <a href="/">🥋 BJJ Spain</a>
    <a href="/openmats">Open Mats</a>
    <a href="/eventos">Eventos</a>
  </nav>
  <div class="container">
    <h1>Academias de BJJ en España</h1>
    <p style="color:#aaa">Directorio completo de ${allGyms.length} academias de Brazilian Jiu-Jitsu en ${sorted.length} ciudades de España. Última actualización: ${today}.</p>
    <div class="grid">
      ${cityLinks}
    </div>
  </div>
  <footer>
    <p>© BJJ Spain — Directorio de academias de Brazilian Jiu-Jitsu en España</p>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(html);
});

export default router;
