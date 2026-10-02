// ratnalabala.vercel.app తెరిచి, F12 → Console లో ఇదంతా paste చేసి Enter నొక్కండి.
// 12 files download అవుతాయి: 00_setup.cypher + ప్రతి సంకలనానికి ఒక file (01 నుండి 11).
(async () => {
  const CREATED_BY = "సందీప్";
  // [collection key, poet_id, poet_name, totalPoems]
  const COLLECTIONS = [
    ["Jandhyala", 1, "జంధ్యాల పాపయ్య శాస్త్రి", 100],
    ["Sumati", 2, "బద్దెన", 110],
    ["SriKalahastheeswara", 3, "ధూర్జటి", 115],
    ["KrishnaSatakam", 4, "నరసింహ కవి", 101],
    ["NarayanaSatakam", 5, "బమ్మెర పోతన", 105],
    ["Annamacharya", 6, "తాళ్లపాక అన్నమాచార్యుఁడు", 91],
    ["ShivanandaLahari", 7, "ఆది శంకరాచార్యులు", 100],
    ["RamachandraPrabhu", 8, "కూచి నరసింహము", 99],
    ["YajnavalkyaSatakam", 9, "చింతా రామకృష్ణారావు", 108],
    ["DasarathiKaruNapaYonidhi", 10, "భద్రాచల రామదాసు", 108],
    ["TeaShatakam", 11, "ప్రసాదరావు మిరియాల", 100],
  ];
  const s = (v) => JSON.stringify(String(v ?? ""));
  const num = (f) => parseInt(String(f).replace(/\D/g, ""), 10) || 0;
  const pad = (n) => String(n).padStart(2, "0");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const download = async (name, text) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    a.download = name;
    a.click();
    await sleep(600); // బ్రౌజర్ ఒకేసారి ఎక్కువ downloads ని అడ్డుకోకుండా
  };

  // ముందు అన్ని సంకలనాలు తీసుకుంటాం, ఏదైనా విఫలమైతే ఏ file download కాదు
  const fetched = [];
  for (const [key, poetId, poetName, total] of COLLECTIONS) {
    const res = await fetch(`/api/main?endpoint=poems&collection=${key}`);
    if (!res.ok) { console.error(`❌ ${key}: HTTP ${res.status}. ఏ file download కాలేదు.`); return; }
    const poems = [...((await res.json()).poems ?? [])].sort((a, b) => num(a.filename) - num(b.filename));
    if (poems.length !== total) console.warn(`⚠️ ${key}: ఆశించినవి ${total}, వచ్చినవి ${poems.length}`);
    fetched.push({ key, poetId, poetName, poems });
    console.log(`✅ ${key}: ${poems.length}`);
  }

  // 00: constraints మాత్రమే
  await download("00_setup.cypher", [
    "// రత్నాలబాల → Neo4j: ముందుగా ఇది ఒక్కసారి నడపండి",
    "CREATE CONSTRAINT poet_id_unique IF NOT EXISTS FOR (p:Poet) REQUIRE p.poet_id IS UNIQUE;",
    "CREATE CONSTRAINT poem_id_unique IF NOT EXISTS FOR (p:Poem) REQUIRE p.poem_id IS UNIQUE;",
    "",
  ].join("\n"));

  // 01–11: ప్రతి సంకలనానికి ఒక file (కవి + పద్యాలు + WROTE సంబంధం)
  let poemId = 0;
  for (const { key, poetId, poetName, poems } of fetched) {
    const rows = poems.map((p) =>
      `  {poem_id: ${++poemId}, title: ${s(p.title)}, content: ${s(p.text)}}`
    );
    const text = [
      `// ${pad(poetId)} ${key}: ${poetName} (${poems.length} పద్యాలు)`,
      `MERGE (pt:Poet {poet_id: ${poetId}})`,
      `ON CREATE SET pt.poet_name = ${s(poetName)}, pt.created_by = ${s(CREATED_BY)}, pt.created_date = datetime()`,
      "WITH pt",
      `UNWIND [\n${rows.join(",\n")}\n] AS row`,
      "MERGE (p:Poem {poem_id: row.poem_id})",
      "ON CREATE SET p.title = row.title, p.content = row.content,",
      `  p.collection = ${s(key)}, p.created_by = ${s(CREATED_BY)}, p.created_date = datetime(),`,
      "  p.is_active = true",
      "MERGE (pt)-[:WROTE]->(p);",
      "",
    ].join("\n");
    await download(`${pad(poetId)}_${key}.cypher`, text);
  }

  console.log(`🎉 12 files download అయ్యాయి, మొత్తం ${poemId} పద్యాలు`);
})();