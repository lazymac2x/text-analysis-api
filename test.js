// Quick integration test — start server, hit all endpoints, verify responses

const http = require('http');

const BASE = 'http://localhost:4600';

const TEXTS = {
  english: `Artificial intelligence has transformed the way we interact with technology.
Machine learning algorithms can now process vast amounts of data and identify patterns
that would be impossible for humans to detect. While some people fear that AI will
replace human workers, others believe it will create new opportunities and enhance
our capabilities. The truth likely lies somewhere in between. What is certain is that
AI is here to stay, and we must learn to work alongside these powerful tools.`,

  positive: `This is an absolutely wonderful and amazing experience! I really love how
everything works so perfectly. The team did an excellent job creating this fantastic product.`,

  negative: `This is a terrible and horrible product. I hate how it fails constantly.
The worst experience I have ever had. Completely useless and frustrating.`,

  korean: `인공지능 기술이 빠르게 발전하면서 우리의 일상생활에도 큰 변화가 일어나고 있습니다.
자연어 처리 기술을 활용한 챗봇 서비스가 다양한 분야에서 활용되고 있으며,
이미지 인식 기술도 크게 향상되었습니다.`,

  spanish: `La inteligencia artificial ha transformado la forma en que interactuamos con la tecnología.
Los algoritmos de aprendizaje automático pueden procesar grandes cantidades de datos.`,

  french: `L'intelligence artificielle a transformé la façon dont nous interagissons avec la technologie.
Les algorithmes d'apprentissage automatique peuvent traiter de grandes quantités de données.`,

  german: `Künstliche Intelligenz hat die Art und Weise verändert, wie wir mit Technologie umgehen.
Die Algorithmen des maschinellen Lernens können große Datenmengen verarbeiten.`,

  japanese: `人工知能は私たちの生活を大きく変えました。機械学習アルゴリズムは膨大なデータを処理できるようになりました。`,

  chinese: `人工智能已经改变了我们与技术互动的方式。机器学习算法现在可以处理大量数据。`,
};

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, BASE);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE}${path}`, (res) => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode, body: chunks }); }
      });
    }).on('error', reject);
  });
}

async function run() {
  let pass = 0, fail = 0;

  function check(name, condition, detail) {
    if (condition) {
      console.log(`  PASS  ${name}`);
      pass++;
    } else {
      console.log(`  FAIL  ${name} — ${detail || ''}`);
      fail++;
    }
  }

  console.log('\n=== Health ===');
  const h = await get('/health');
  check('health', h.status === 200 && h.body.status === 'ok');

  console.log('\n=== Sentiment ===');
  const sp = await post('/api/v1/sentiment', { text: TEXTS.positive });
  check('positive sentiment', sp.body.data.label === 'positive', `got: ${sp.body.data.label}`);
  const sn = await post('/api/v1/sentiment', { text: TEXTS.negative });
  check('negative sentiment', sn.body.data.label === 'negative', `got: ${sn.body.data.label}`);

  console.log('\n=== Readability ===');
  const r = await post('/api/v1/readability', { text: TEXTS.english });
  check('readability scores', r.body.data.fleschReadingEase > 0, `FRE: ${r.body.data.fleschReadingEase}`);
  check('has interpretation', typeof r.body.data.interpretation === 'string');

  console.log('\n=== Keywords ===');
  const k = await post('/api/v1/keywords', { text: TEXTS.english });
  check('keywords returned', k.body.data.keywords.length > 0, `count: ${k.body.data.keywords.length}`);

  console.log('\n=== Language Detection ===');
  const lEn = await post('/api/v1/language', { text: TEXTS.english });
  check('detect English', lEn.body.data.language === 'en', `got: ${lEn.body.data.language}`);
  const lKo = await post('/api/v1/language', { text: TEXTS.korean });
  check('detect Korean', lKo.body.data.language === 'ko', `got: ${lKo.body.data.language}`);
  const lEs = await post('/api/v1/language', { text: TEXTS.spanish });
  check('detect Spanish', lEs.body.data.language === 'es', `got: ${lEs.body.data.language}`);
  const lFr = await post('/api/v1/language', { text: TEXTS.french });
  check('detect French', lFr.body.data.language === 'fr', `got: ${lFr.body.data.language}`);
  const lDe = await post('/api/v1/language', { text: TEXTS.german });
  check('detect German', lDe.body.data.language === 'de', `got: ${lDe.body.data.language}`);
  const lJa = await post('/api/v1/language', { text: TEXTS.japanese });
  check('detect Japanese', lJa.body.data.language === 'ja', `got: ${lJa.body.data.language}`);
  const lZh = await post('/api/v1/language', { text: TEXTS.chinese });
  check('detect Chinese', lZh.body.data.language === 'zh', `got: ${lZh.body.data.language}`);

  console.log('\n=== Stats ===');
  const st = await post('/api/v1/stats', { text: TEXTS.english });
  check('word count > 0', st.body.data.words > 0, `words: ${st.body.data.words}`);
  check('has reading time', st.body.data.readingTime.seconds > 0);

  console.log('\n=== Full Analysis ===');
  const a = await post('/api/v1/analyze', { text: TEXTS.english });
  check('has sentiment', !!a.body.data.sentiment);
  check('has readability', !!a.body.data.readability);
  check('has keywords', !!a.body.data.keywords);
  check('has language', !!a.body.data.language);
  check('has stats', !!a.body.data.stats);
  check('has profanity', !!a.body.data.profanity);
  check('has summary', !!a.body.data.summary);

  console.log('\n=== Validation ===');
  const v = await post('/api/v1/sentiment', { text: '' });
  check('rejects empty text', v.status === 400);
  const v2 = await post('/api/v1/sentiment', {});
  check('rejects missing text', v2.status === 400);

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${pass} passed, ${fail} failed out of ${pass + fail}`);
  console.log(`${'='.repeat(40)}\n`);

  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
