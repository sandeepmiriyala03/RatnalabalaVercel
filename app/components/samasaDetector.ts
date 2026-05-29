/* ═══════════════════════════════════════════════════════════
   TELUGU SAMASA DETECTOR — Full Rule-Based, No API
   Covers: తత్పురుష, కర్మధారయ, ద్విగు, ద్వంద్వ, బహువ్రీహి, అవ్యయీభావ
═══════════════════════════════════════════════════════════ */

export interface DetectResult {
  detected: boolean;
  samasaId: number;
  samasaName: string;
  subtype: string;
  purvapadam: string;
  uttarapadam: string;
  vigraha: string;
  definition: string;
  pradhanyam: string;
  examples: { samasa: string; vigraha: string }[];
}

/* ═══════════════════════════════════════════
   DICTIONARIES
═══════════════════════════════════════════ */

// విశేషణాలు — adjectives
const VISESHANALU = [
  "పెద్ద","చిన్న","నల్ల","తెల్ల","మంచి","చెడు","అందమైన","సరస","మృదు","మధుర",
  "శీత","ఉష్ణ","నూత్న","పురాతన","దివ్య","పవిత్ర","గొప్ప","కోమల","సుందర","రమ్య",
  "నవ","తాజా","దుర్","సు","కు","నిర్","విశాల","సూక్ష్మ","స్థూల","దీర్ఘ","హ్రస్వ",
  "శుభ","అశుభ","సత్","అసత్","పూర్ణ","అర్ధ","సమ","విషమ","ఏక","బహు",
];

// ఉపమాన పూర్వపద పదాలు — simile first words
const UPAMANA_PURVA = [
  "చిగురు","బింబ","పద్మ","కమల","చంద్ర","సూర్య","మేఘ","హిమ","స్వర్ణ","రజత",
  "మణి","రత్న","వజ్ర","కుసుమ","పుష్ప","మకర","నవ","ముత్యపు","పగడపు","వెన్నెల",
];

// ఉపమాన ఉత్తర పదాలు — simile last words
const UPAMANA_UTTARA = [
  "కమలము","అరవిందము","చంద్రుడు","పద్మము","కమలం","తారల","నయనాలు","వదనం",
  "ముఖము","పాదాలు","చరణాలు","హస్తాలు","కేలు","కన్నులు","నేత్రాలు","ఓష్ఠము",
];

// సంఖ్యా వాచకాలు — numbers
const SANKHYA = [
  "ద్వి","ద్వా","త్రి","చతుర్","పంచ","షట్","సప్త","అష్ట","నవ","దశ","ఏక","శత",
  "సహస్ర","లక్ష","కోటి","ముప్పది","నలభై","ఏభై","అరవై","డెబ్బై","ఎనభై","తొంభై",
  "రెండు","మూడు","నాలుగు","ఐదు","ఆరు","ఏడు","ఎనిమిది","తొమ్మిది","పది","పన్నెండు",
];

// అవ్యయాలు — indeclinables
const AVYAYALU = [
  "యథా","ప్రతి","ప్రత్య","అను","అధి","అప","అభి","పరి","వి","సు","నిర్","నిస్",
  "అంత","బహిర్","ఉప","అంతర్","బహు","పున","పున్","సర్వ",
];

// నఞ్ prefixes — negation
const NAJ_PREFIXES = [
  "అ","అన్","అనా","నిర్","నిస్","వి","దుర్","దుస్","నిః","కు","అప","బద",
];

// బహువ్రీహి patterns — body parts, attributes
const BAHUVRIHI_UTTARA = [
  "అంబర","ఆక్ష","ఆనన","భుజ","కంఠ","శేఖర","లోచన","కర","పాద","నయన",
  "హస్త","దంత","జిహ్వ","నాస","కర్ణ","నేత్ర","ముఖ","లయ","ఆలయ","నిలయ",
  "ధర","హర","పతి","నాథ","స్వామి","రాజ","ఈశ","దేవ","వర","పాణి",
  "మాల","కేశ","శిర","మస్తక","వక్ష","హృదయ","జఠర","నాభి","జంఘ","జాను",
];

// ద్వంద్వ — paired words
const DVANDVA_PAIRS = [
  ["రామ","కృష్ణ"],["సీత","రామ"],["రాధ","కృష్ణ"],["శివ","కేశవ"],
  ["లక్ష్మీ","నారాయణ"],["అన్న","దమ్మ"],["అమ్మ","నాన్న"],["తల్లి","దండ్రి"],
  ["అన్న","చెల్లె"],["అక్క","తమ్ముడు"],["రాత్రి","పగలు"],["పగలు","రాత్రి"],
  ["సుఖ","దుఃఖ"],["లాభ","నష్ట"],["జన్మ","మరణ"],["ధర్మ","అర్థ"],
  ["అర్థ","కామ"],["కామ","మోక్ష"],["సత్య","అసత్య"],["పాప","పుణ్య"],
  ["స్వర్గ","నరక"],["దేవ","దానవ"],["నర","నారాయణ"],["బ్రహ్మ","విష్ణు"],
  ["శంకర","పార్వతి"],["గంగ","యమున"],["రాజ","రాణి"],["మేఘ","వర్ష"],
  ["ఉప్పు","పప్పు"],["అన్న","నీళ్ళు"],
];

// షష్ఠీ తత్పురుష endings — possession
const SHASHTI_UTTARA = [
  "భటుడు","కొమ్మ","పుత్రుడు","కుమారుడు","కొడుకు","పుత్రి","కుమారి","కూతురు",
  "భార్య","పత్ని","భర్త","స్వామి","నాథుడు","అధిపతి","రాజు","నగరము","పట్టణం",
  "గ్రామం","దేశం","రాజ్యం","శాస్త్రం","కళ","విద్య","ఆలయం","మందిరం","గుడి",
  "పూజ","కార్యం","పని","సేవ","భక్తి","ప్రేమ","ద్వేషం","సంపద","ఆస్తి",
  "నామం","మాట","వాక్కు","లేఖ","పత్రం","పుస్తకం","గ్రంథం","కావ్యం",
];

// Known compound words dictionary — exact matches
const KNOWN_SAMASA_DICT: Record<string, { id: number; subtype: string; purva: string; uttara: string; vigraha: string }> = {
  // తత్పురుష
  "రామబాణము":    { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"రామ", uttara:"బాణము", vigraha:"రాముని యొక్క బాణము" },
  "రాజభటుడు":   { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"రాజు", uttara:"భటుడు", vigraha:"రాజుయొక్క భటుడు" },
  "చెట్టుకొమ్మ": { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"చెట్టు", uttara:"కొమ్మ", vigraha:"చెట్టు యొక్క కొమ్మ" },
  "దేవాలయము":   { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"దేవుడు", uttara:"ఆలయము", vigraha:"దేవుని యొక్క ఆలయము" },
  "రాజపుత్రుడు": { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"రాజు", uttara:"పుత్రుడు", vigraha:"రాజుయొక్క పుత్రుడు" },
  "దేశభక్తి":   { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"దేశం", uttara:"భక్తి", vigraha:"దేశము యొక్క భక్తి" },
  "విద్యాలయం":  { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"విద్య", uttara:"ఆలయం", vigraha:"విద్య యొక్క ఆలయం" },
  "గ్రంథాలయం":  { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"గ్రంథం", uttara:"ఆలయం", vigraha:"గ్రంథముల యొక్క ఆలయం" },
  "జలాశయం":    { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"జలం", uttara:"ఆశయం", vigraha:"జలము యొక్క ఆశయం" },
  "మాతృభూమి":  { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"మాతృ", uttara:"భూమి", vigraha:"తల్లి వంటి భూమి" },
  "రాజమందిరం": { id:1, subtype:"షష్ఠీ తత్పురుష", purva:"రాజు", uttara:"మందిరం", vigraha:"రాజుయొక్క మందిరం" },
  "కృష్ణశ్రితుడు":{ id:1, subtype:"ద్వితీయ తత్పురుష", purva:"కృష్ణుడు", uttara:"శ్రితుడు", vigraha:"కృష్ణుని ఆశ్రయించినవాడు" },
  "గుణహీనుడు":  { id:1, subtype:"తృతీయ తత్పురుష", purva:"గుణము", uttara:"హీనుడు", vigraha:"గుణము చేత హీనుడు" },
  "ప్రాణాధికుడు":{ id:1, subtype:"పంచమీ తత్పురుష", purva:"ప్రాణము", uttara:"అధికుడు", vigraha:"ప్రాణముకంటె అధికుడు" },
  "గృహకృత్యములు":{ id:1, subtype:"సప్తమీ తత్పురుష", purva:"గృహము", uttara:"కృత్యములు", vigraha:"గృహమందలి కృత్యములు" },
  "అర్థరాజ్యము": { id:1, subtype:"ప్రథమా తత్పురుష", purva:"అర్థ", uttara:"రాజ్యము", vigraha:"రాజ్యము యొక్క అర్థభాగము" },
  "అజ్ఞానము":   { id:1, subtype:"నఞ్ తత్పురుష", purva:"అ", uttara:"జ్ఞానము", vigraha:"జ్ఞానము లేనిది" },
  "అసత్యము":    { id:1, subtype:"నఞ్ తత్పురుష", purva:"అ", uttara:"సత్యము", vigraha:"సత్యము కానిది" },
  "అధర్మం":     { id:1, subtype:"నఞ్ తత్పురుష", purva:"అ", uttara:"ధర్మం", vigraha:"ధర్మం కానిది" },
  "అన్యాయం":    { id:1, subtype:"నఞ్ తత్పురుష", purva:"అ", uttara:"న్యాయం", vigraha:"న్యాయం కానిది" },
  "నిర్గుణుడు":  { id:1, subtype:"నఞ్ తత్పురుష", purva:"నిర్", uttara:"గుణుడు", vigraha:"గుణము లేనివాడు" },

  // కర్మధారయ
  "సరసపుమాట":   { id:2, subtype:"విశేషణ పూర్వపద కర్మధారయ", purva:"సరస", uttara:"మాట", vigraha:"సరసమైన మాట" },
  "విద్యాధనము":  { id:2, subtype:"రూపక కర్మధారయ", purva:"విద్య", uttara:"ధనము", vigraha:"విద్యయనెడి ధనము" },
  "కోపాగ్ని":    { id:2, subtype:"రూపక కర్మధారయ", purva:"కోపం", uttara:"అగ్ని", vigraha:"కోపమనెడి అగ్ని" },
  "ముఖారవిందము": { id:2, subtype:"ఉపమాన ఉత్తరపద కర్మధారయ", purva:"ముఖ", uttara:"అరవిందము", vigraha:"అరవిందము వంటి ముఖము" },
  "చరణకమలము":   { id:2, subtype:"ఉపమాన ఉత్తరపద కర్మధారయ", purva:"చరణ", uttara:"కమలము", vigraha:"కమలము వంటి చరణము" },
  "చిగురుకేలు":  { id:2, subtype:"ఉపమాన పూర్వపద కర్మధారయ", purva:"చిగురు", uttara:"కేలు", vigraha:"చిగురువంటి కేలు" },
  "బింబోష్ఠము":  { id:2, subtype:"ఉపమాన పూర్వపద కర్మధారయ", purva:"బింబ", uttara:"ఓష్ఠము", vigraha:"బింబమువంటి ఓష్ఠము" },
  "గంగానది":     { id:2, subtype:"సంభావనా పూర్వపద కర్మధారయ", purva:"గంగ", uttara:"నది", vigraha:"గంగ అను పేరుగల నది" },
  "మధురానగరము":  { id:2, subtype:"సంభావనా పూర్వపద కర్మధారయ", purva:"మధుర", uttara:"నగరము", vigraha:"మధుర అను పేరుగల నగరము" },
  "మంచిబాలుడు":  { id:2, subtype:"విశేషణ పూర్వపద కర్మధారయ", purva:"మంచి", uttara:"బాలుడు", vigraha:"మంచిదైన బాలుడు" },
  "తెల్లపద్మము":  { id:2, subtype:"విశేషణ పూర్వపద కర్మధారయ", purva:"తెల్ల", uttara:"పద్మము", vigraha:"తెల్లదైన పద్మము" },

  // ద్విగు
  "త్రిలోకి":     { id:3, subtype:"సమాహార ద్విగువు", purva:"త్రి", uttara:"లోకి", vigraha:"మూడు లోకముల సమాహారము" },
  "పంచభూతాలు":  { id:3, subtype:"సమాహార ద్విగువు", purva:"పంచ", uttara:"భూతాలు", vigraha:"ఐదు భూతముల సమాహారము" },
  "సప్తర్షులు":   { id:3, subtype:"సమాహార ద్విగువు", purva:"సప్త", uttara:"ఋషులు", vigraha:"ఏడుగురు ఋషుల సమాహారము" },
  "అష్టదిక్కులు": { id:3, subtype:"సమాహార ద్విగువు", purva:"అష్ట", uttara:"దిక్కులు", vigraha:"ఎనిమిది దిక్కుల సమాహారము" },
  "నవరత్నాలు":   { id:3, subtype:"సమాహార ద్విగువు", purva:"నవ", uttara:"రత్నాలు", vigraha:"తొమ్మిది రత్నముల సమాహారము" },
  "దశావతారాలు":  { id:3, subtype:"సమాహార ద్విగువు", purva:"దశ", uttara:"అవతారాలు", vigraha:"పది అవతారముల సమాహారము" },
  "చతుర్వేదాలు":  { id:3, subtype:"సమాహార ద్విగువు", purva:"చతుర్", uttara:"వేదాలు", vigraha:"నాలుగు వేదముల సమాహారము" },
  "షడ్రసాలు":    { id:3, subtype:"సమాహార ద్విగువు", purva:"షట్", uttara:"రసాలు", vigraha:"ఆరు రసముల సమాహారము" },
  "త్రిమూర్తులు": { id:3, subtype:"సమాహార ద్విగువు", purva:"త్రి", uttara:"మూర్తులు", vigraha:"మూడు మూర్తుల సమాహారము" },
  "ద్విభాష":      { id:3, subtype:"సమాహార ద్విగువు", purva:"ద్వి", uttara:"భాష", vigraha:"రెండు భాషల సమాహారము" },
  "చతుర్భుజుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"చతుర్", uttara:"భుజుడు", vigraha:"నాలుగు భుజములు కలవాడు" },

  // ద్వంద్వ
  "రామకృష్ణులు":    { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"రాముడు", uttara:"కృష్ణుడు", vigraha:"రాముడును కృష్ణుడును" },
  "తల్లిదండ్రులు":  { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"తల్లి", uttara:"తండ్రి", vigraha:"తల్లి యును తండ్రి యును" },
  "అన్నదమ్ములు":   { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"అన్న", uttara:"తమ్ముడు", vigraha:"అన్న యును తమ్ముడును" },
  "రాధాకృష్ణులు":   { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"రాధ", uttara:"కృష్ణుడు", vigraha:"రాధ యును కృష్ణుడును" },
  "శివకేశవులు":     { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"శివుడు", uttara:"కేశవుడు", vigraha:"శివుడును కేశవుడును" },
  "సీతారాములు":     { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"సీత", uttara:"రాముడు", vigraha:"సీత యును రాముడును" },
  "లక్ష్మీనారాయణులు":{ id:4, subtype:"ద్విపద ద్వంద్వము", purva:"లక్ష్మి", uttara:"నారాయణుడు", vigraha:"లక్ష్మి యును నారాయణుడును" },
  "ధర్మార్థకామమోక్షాలు":{ id:4, subtype:"బహుపద ద్వంద్వము", purva:"ధర్మ", uttara:"మోక్షాలు", vigraha:"ధర్మము అర్థము కామము మోక్షము" },
  "సత్త్వరజస్తమోగుణాలు":{ id:4, subtype:"బహుపద ద్వంద్వము", purva:"సత్త్వ", uttara:"గుణాలు", vigraha:"సత్త్వము రజస్సు తమస్సు" },
  "రాత్రింబవళ్ళు":  { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"రాత్రి", uttara:"పగలు", vigraha:"రాత్రి యును పగలును" },
  "అమ్మానాన్నలు":   { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"అమ్మ", uttara:"నాన్న", vigraha:"అమ్మ యును నాన్న యును" },
  "అన్నాచెల్లెలు":  { id:4, subtype:"ద్విపద ద్వంద్వము", purva:"అన్న", uttara:"చెల్లెలు", vigraha:"అన్న యును చెల్లెలు యును" },

  // బహువ్రీహి
  "పీతాంబరుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"పీత", uttara:"అంబరుడు", vigraha:"పచ్చని వస్త్రము కలవాడు (విష్ణువు)" },
  "కమలాక్షుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"కమల", uttara:"అక్షుడు", vigraha:"కమలముల వంటి కన్నులు కలవాడు" },
  "గజాననుడు":    { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"గజ", uttara:"ఆననుడు", vigraha:"గజము వంటి ముఖము కలవాడు" },
  "చంద్రశేఖరుడు": { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"చంద్ర", uttara:"శేఖరుడు", vigraha:"చంద్రుని శిరసున ధరించినవాడు" },
  "నీలకంఠుడు":   { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"నీల", uttara:"కంఠుడు", vigraha:"నీలమైన కంఠము కలవాడు" },
  "త్రిలోచనుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"త్రి", uttara:"లోచనుడు", vigraha:"మూడు కన్నులు కలవాడు" },
  "పద్మాలయ":     { id:5, subtype:"స్త్రీ వాచ్య బహువ్రీహి", purva:"పద్మ", uttara:"ఆలయ", vigraha:"పద్మము నిలయముగా కలది (లక్ష్మి)" },
  "విశ్వంభరుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"విశ్వ", uttara:"భరుడు", vigraha:"విశ్వమును భరించువాడు" },
  "దశముఖుడు":    { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"దశ", uttara:"ముఖుడు", vigraha:"పది ముఖాలు కలవాడు (రావణుడు)" },
  "శూలపాణి":     { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"శూల", uttara:"పాణి", vigraha:"శూలమును చేతిలో కలవాడు" },
  "పద్మహస్తుడు":  { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"పద్మ", uttara:"హస్తుడు", vigraha:"పద్మము చేతిలో కలవాడు" },
  "మేఘనాదుడు":   { id:5, subtype:"సామాన్య బహువ్రీహి", purva:"మేఘ", uttara:"నాదుడు", vigraha:"మేఘము వంటి శబ్దము కలవాడు" },

  // అవ్యయీభావ
  "యథావిధి":    { id:6, subtype:"యథా అవ్యయీభావ", purva:"యథా", uttara:"విధి", vigraha:"విధి ప్రకారం" },
  "ప్రతిదినము":  { id:6, subtype:"ప్రతి అవ్యయీభావ", purva:"ప్రతి", uttara:"దినము", vigraha:"దినము దినము" },
  "ప్రత్యహము":   { id:6, subtype:"ప్రతి అవ్యయీభావ", purva:"ప్రత్య", uttara:"అహము", vigraha:"ప్రతి రోజు" },
  "యథాశక్తి":   { id:6, subtype:"యథా అవ్యయీభావ", purva:"యథా", uttara:"శక్తి", vigraha:"శక్తిని అనుసరించి" },
  "యథాకాలం":    { id:6, subtype:"యథా అవ్యయీభావ", purva:"యథా", uttara:"కాలం", vigraha:"కాలమును అనుసరించి" },
  "అనుదినం":    { id:6, subtype:"అను అవ్యయీభావ", purva:"అను", uttara:"దినం", vigraha:"ప్రతి దినం" },
  "ప్రతిక్షణం":  { id:6, subtype:"ప్రతి అవ్యయీభావ", purva:"ప్రతి", uttara:"క్షణం", vigraha:"క్షణము క్షణము" },
};

/* ═══════════════════════════════════════════
   SAMASA DEFINITIONS
═══════════════════════════════════════════ */
const SAMASA_DEFS: Record<number, { name: string; definition: string; pradhanyam: string; examples: { samasa: string; vigraha: string }[] }> = {
  1: {
    name: "తత్పురుష సమాసము",
    definition: "ఉత్తర పదార్థము ప్రధానముగా గలది తత్పురుష సమాసము. మొదటి పదము లోపించిన విభక్తి పేరు సమాసమునకు వచ్చును.",
    pradhanyam: "ఉత్తరపద ప్రాధాన్యము",
    examples: [
      { samasa: "రాజభటుడు", vigraha: "రాజుయొక్క భటుడు" },
      { samasa: "చెట్టుకొమ్మ", vigraha: "చెట్టు యొక్క కొమ్మ" },
      { samasa: "అజ్ఞానము", vigraha: "జ్ఞానము లేనిది" },
    ],
  },
  2: {
    name: "కర్మధారయ సమాసము",
    definition: "విశేషణ విశేష్యముల తో ఏర్పడు సమాసము కర్మధారయ సమాసము. ఇది సమానాధికరణ సమాసము.",
    pradhanyam: "విశేషణ-విశేష్య సంబంధం",
    examples: [
      { samasa: "పెద్ద గుఱ్ఱము", vigraha: "పెద్దదైన గుఱ్ఱము" },
      { samasa: "ముఖారవిందము", vigraha: "అరవిందము వంటి ముఖము" },
      { samasa: "కోపాగ్ని", vigraha: "కోపమనెడి అగ్ని" },
    ],
  },
  3: {
    name: "ద్విగు సమాసము",
    definition: "సంఖ్యా వాచకపదము పూర్వమున కలది ద్విగు సమాసము.",
    pradhanyam: "పూర్వపద ప్రాధాన్యము (సంఖ్య)",
    examples: [
      { samasa: "త్రిలోకి", vigraha: "మూడు లోకముల సమాహారము" },
      { samasa: "పంచభూతాలు", vigraha: "ఐదు భూతముల సమాహారము" },
      { samasa: "సప్తర్షులు", vigraha: "ఏడుగురు ఋషుల సమాహారము" },
    ],
  },
  4: {
    name: "ద్వంద్వ సమాసము",
    definition: "ఉభయ పదముల అర్థము ప్రధానముగా గలది ద్వంద్వ సమాసము. విగ్రహ వాక్యమున 'ను' అను సంయోజకం చేర్చబడును.",
    pradhanyam: "ఉభయ పద ప్రాధాన్యము",
    examples: [
      { samasa: "రామకృష్ణులు", vigraha: "రాముడును కృష్ణుడును" },
      { samasa: "తల్లిదండ్రులు", vigraha: "తల్లి యును తండ్రి యును" },
      { samasa: "సీతారాములు", vigraha: "సీత యును రాముడును" },
    ],
  },
  5: {
    name: "బహువ్రీహి సమాసము",
    definition: "రెండు పదముల అర్థము కాకుండా వేరైన మరొక అర్థము ప్రధానమైన సమాసము.",
    pradhanyam: "అన్యపదార్థ ప్రాధాన్యము",
    examples: [
      { samasa: "పీతాంబరుడు", vigraha: "పచ్చని వస్త్రము కలవాడు" },
      { samasa: "కమలాక్షుడు", vigraha: "కమలముల వంటి కన్నులు కలవాడు" },
      { samasa: "గజాననుడు", vigraha: "గజము వంటి ముఖము కలవాడు" },
    ],
  },
  6: {
    name: "అవ్యయీభావ సమాసము",
    definition: "అవ్యయము పూర్వపదముగా కలది అవ్యయీభావ సమాసము. లింగ వచన విభక్తులు లేని అవ్యయములు.",
    pradhanyam: "అవ్యయ పూర్వపదం",
    examples: [
      { samasa: "యథావిధి", vigraha: "విధి ప్రకారం" },
      { samasa: "ప్రతిదినము", vigraha: "దినము దినము" },
      { samasa: "యథాశక్తి", vigraha: "శక్తిని అనుసరించి" },
    ],
  },
};

/* ═══════════════════════════════════════════
   HELPER: split input words
═══════════════════════════════════════════ */
function words(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

function makeResult(id: number, subtype: string, purva: string, uttara: string, vigraha: string): DetectResult {
  const def = SAMASA_DEFS[id];
  return {
    detected: true, samasaId: id,
    samasaName: def.name, subtype,
    purvapadam: purva, uttarapadam: uttara,
    vigraha, definition: def.definition,
    pradhanyam: def.pradhanyam, examples: def.examples,
  };
}

/* ═══════════════════════════════════════════
   MAIN DETECT FUNCTION
═══════════════════════════════════════════ */
export function detectSamasa(input: string): DetectResult {
  const NOT_FOUND: DetectResult = {
    detected: false, samasaId: 0, samasaName: "", subtype: "",
    purvapadam: "", uttarapadam: "", vigraha: "", definition: "",
    pradhanyam: "", examples: [],
  };

  const w       = input.trim();
  const wLower  = w.replace(/\s+/g, "");
  const ws      = words(w);
  const first   = ws[0] || "";
  const rest    = ws.slice(1).join(" ") || first;
  const last    = ws[ws.length - 1] || "";

  if (!w) return NOT_FOUND;

  /* ── Step 1: Dictionary exact match ── */
  const noSpace = w.replace(/\s+/g, "");
  if (KNOWN_SAMASA_DICT[noSpace]) {
    const d = KNOWN_SAMASA_DICT[noSpace];
    return makeResult(d.id, d.subtype, d.purva, d.uttara, d.vigraha);
  }
  // also try with spaces removed differently
  if (KNOWN_SAMASA_DICT[w]) {
    const d = KNOWN_SAMASA_DICT[w];
    return makeResult(d.id, d.subtype, d.purva, d.uttara, d.vigraha);
  }

  /* ── Step 2: ద్వంద్వ — known pairs ── */
  for (const [a, b] of DVANDVA_PAIRS) {
    if (w.includes(a) && w.includes(b)) {
      return makeResult(4, "ద్విపద ద్వంద్వము", a, b, `${a} యును ${b} యును`);
    }
  }
  // ద్వంద్వ — ends with లు/ళు and has two components
  if (ws.length === 2 && (w.endsWith("లు") || w.endsWith("ళు"))) {
    return makeResult(4, "ద్విపద ద్వంద్వము", first, last, `${first} యును ${last} యును`);
  }

  /* ── Step 3: ద్విగు — starts with number ── */
  for (const num of SANKHYA) {
    if (first.startsWith(num) || noSpace.startsWith(num)) {
      const uttara = first.replace(num, "") || rest;
      return makeResult(3, "సమాహార ద్విగువు", num, uttara || last, `${num}... ${uttara || last} సమాహారము`);
    }
  }

  /* ── Step 4: అవ్యయీభావ — starts with avyaya ── */
  for (const av of AVYAYALU) {
    if (first.startsWith(av) || noSpace.startsWith(av)) {
      const uttara = first.replace(av, "") || rest;
      return makeResult(6, "అవ్యయీభావ సమాసము", av, uttara || last, `${av}... = ${uttara || last} ప్రకారం / పదే పదే`);
    }
  }

  /* ── Step 5: నఞ్ తత్పురుష — నఞ్ prefix ── */
  for (const pre of NAJ_PREFIXES) {
    if (ws.length === 1 && first.startsWith(pre) && first.length > pre.length + 2) {
      const moolam = first.slice(pre.length);
      if (moolam.length > 2) {
        return makeResult(1, "నఞ్ తత్పురుష సమాసము", pre, moolam, `${moolam} లేనిది / కానిది`);
      }
    }
  }

  /* ── Step 6: బహువ్రీహి — body part / attribute endings ── */
  for (const bt of BAHUVRIHI_UTTARA) {
    if (noSpace.endsWith(bt) || noSpace.includes(bt)) {
      const purva = noSpace.replace(bt, "").slice(0, 6) || first;
      return makeResult(5, "సామాన్య బహువ్రీహి", purva, bt, `${w} = __ కలవాడు / కలది`);
    }
  }

  /* ── Step 7: కర్మధారయ — విశేషణ పూర్వపద (phrase) ── */
  if (ws.length >= 2 && VISESHANALU.includes(first)) {
    return makeResult(2, "విశేషణ పూర్వపద కర్మధారయ సమాసము", first, rest, `${first}దైన ${rest}`);
  }

  /* ── Step 8: కర్మధారయ — ఉపమాన పూర్వపద ── */
  if (ws.length >= 2 && UPAMANA_PURVA.some(u => first.startsWith(u))) {
    return makeResult(2, "ఉపమాన పూర్వపద కర్మధారయ సమాసము", first, rest, `${first}వంటి ${rest}`);
  }

  /* ── Step 9: కర్మధారయ — ఉపమాన ఉత్తరపద ── */
  if (ws.length >= 2 && UPAMANA_UTTARA.some(u => last.includes(u.slice(0, 3)))) {
    return makeResult(2, "ఉపమాన ఉత్తరపద కర్మధారయ సమాసము", first, last, `${last}వంటి ${first}`);
  }

  /* ── Step 10: కర్మధారయ — రూపక (metaphor: X = Y) ── */
  if (noSpace.endsWith("అగ్ని") || noSpace.endsWith("సాగరం") || noSpace.endsWith("ధనము") || noSpace.endsWith("రాజు")) {
    return makeResult(2, "రూపక కర్మధారయ సమాసము", first, last, `${first}అనెడి ${last}`);
  }

  /* ── Step 11: షష్ఠీ తత్పురుష — ends with known uttara ── */
  for (const ut of SHASHTI_UTTARA) {
    if (noSpace.endsWith(ut)) {
      const purva = noSpace.replace(ut, "");
      if (purva.length > 1) {
        return makeResult(1, "షష్ఠీ తత్పురుష సమాసము", purva, ut, `${purva} యొక్క ${ut}`);
      }
    }
  }

  /* ── Step 12: phrase of 2 words → తత్పురుష (default) ── */
  if (ws.length === 2) {
    return makeResult(1, "షష్ఠీ తత్పురుష సమాసము", first, last, `${first} యొక్క ${last}`);
  }

  /* ── Step 13: compound single word → తత్పురుష (fallback) ── */
  if (ws.length === 1 && w.length > 5) {
    const mid   = Math.ceil(w.length / 2);
    const purva = w.slice(0, mid);
    const uttara= w.slice(mid);
    return makeResult(1, "షష్ఠీ తత్పురుష సమాసము", purva, uttara, `${purva} యొక్క ${uttara}`);
  }

  return NOT_FOUND;
}