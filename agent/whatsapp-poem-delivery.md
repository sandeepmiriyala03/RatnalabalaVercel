# వాట్సాప్‌లో రోజువారీ పద్యం

## వినియోగదారులకు

1. పద్యం కార్డ్‌లో **వాట్సాప్‌లో పద్యం షెడ్యూల్ చేయండి** నొక్కండి.
2. దేశ కోడ్‌తో మీ WhatsApp నంబర్ ఇవ్వండి. ఉదాహరణ: `+919876543210`.
3. మీ స్థానిక సమయాన్ని ఎంచుకోండి; రోజుకు ఒకసారి లేదా ప్రతి 6 గంటలకు ఎంచుకోండి.
4. **పంపడానికి నా సమ్మతి ఉంది** స్విచ్ ఆన్ చేయండి. షెడ్యూల్ విజయవంతంగా సేవ్ అయిన సందేశం కనిపించాలి.
5. సమయం/వ్యవధి మార్చినప్పుడు **సమయాన్ని సేవ్ చేయండి** నొక్కండి. పంపడం ఆపడానికి స్విచ్ ఆఫ్ చేయండి.

పంపే సమయం మీ బ్రౌజర్ టైమ్‌జోన్ ఆధారంగా ఉంటుంది. ఫోన్ నంబర్, సమయం, టైమ్‌జోన్ సర్వర్‌లోని KVలో నిల్వ అవుతాయి; అదే బ్రౌజర్‌లో సెట్టింగ్‌లను మళ్లీ చూపించడానికి నంబర్ స్థానిక బ్రౌజర్ స్టోరేజ్‌లోనూ ఉంటుంది. బ్రౌజర్ డేటా తొలగిస్తే సెట్టింగ్‌లు కనిపించకపోవచ్చు; పాత షెడ్యూల్‌ను ఆపడానికి పాత బ్రౌజర్/పరికరం అవసరం కావచ్చు.

## నిర్వాహకుడి అమరిక

### 1. Meta WhatsApp Cloud API

Meta Business ఖాతాలో WhatsApp Cloud APIని అమర్చండి. సందేశాలు పంపే ఫోన్ నంబర్ ID, శాశ్వత/దీర్ఘకాలిక access token తీసుకోండి. వినియోగదారుల స్పష్టమైన సమ్మతిని మాత్రమే నమోదు చేయండి; వారి అభ్యర్థన మేరకు పంపడం వెంటనే ఆపండి.

బయటకు పంపే రోజువారీ సందేశానికి WhatsApp ఆమోదించిన message template అవసరం. Templateలో కచ్చితంగా రెండు body variables ఉండాలి:

```text
నమస్కారం! ఈరోజు పద్యం: {{1}}

{{2}}

మరిన్ని తెలుగు పద్యాల కోసం ratnalabala.vercel.app చూడండి.
```

Template ఆమోదించబడిన తర్వాత దాని పేరు, భాష కోడ్‌ను క్రింది environment variablesలో ఇవ్వండి. ఉదాహరణకు `daily_telugu_poem`, `te`; Metaలో templateకి ఎంచుకున్న భాషా కోడ్‌నే ఉపయోగించాలి.

### 2. Environment variables

Vercel Project → **Settings → Environment Variables**లో Production (అవసరమైతే Preview) కోసం అమర్చండి. స్థానిక పరీక్షకు `.env.local`లో ఇవ్వండి. రహస్య tokenలను Gitలో commit చేయవద్దు.

```dotenv
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id
WHATSAPP_TEMPLATE_NAME=daily_telugu_poem
WHATSAPP_TEMPLATE_LANGUAGE=te
WHATSAPP_GRAPH_API_VERSION=v23.0
POEM_CONTENT_BASE_URL=https://ratnalabala.vercel.app
```

ఈ feature సబ్‌స్క్రిప్షన్‌ల కోసం ఇప్పటికే ఉన్న `@vercel/kv` కనెక్షన్‌ను ఉపయోగిస్తుంది. Vercelలో KV credentials సరిగా ఉండాలి. Production buildలో EVE schedule బయటపడిన తర్వాత Vercel **Settings → Cron Jobs**లో `send-scheduled-poems` job కనిపిస్తుందో చూడండి. Hobby ప్లాన్ పరిమితికి అనుగుణంగా ఇది రోజుకు ఒక్కసారి 00:00 UTCకు నడుస్తుంది; అందువల్ల వినియోగదారి స్థానిక సమయానికి సరిపోయే పంపకాన్ని, లేదా ప్రతి 6 గంటల పంపకాన్ని హామీ ఇవ్వదు. ఈ ఖచ్చితమైన సమయాలను ఉపయోగించడానికి Pro cron cadence అవసరం.

`WHATSAPP_TEMPLATE_NAME`లో ఇచ్చిన approved templateకు రెండు text variables ఉన్నాయని నిర్ధారించండి: `{{1}}` పద్యం శీర్షిక, `{{2}}` పద్యం మొదటి 600 అక్షరాలు. API అభ్యర్థనల వైఫల్యాలు Vercel **Observability → Logs**లో కనిపిస్తాయి. వినియోగదారు subscribe చేయడానికి ముందే అవసరమైన మూడు WhatsApp credentials లేకుంటే UIలో అమరిక లోపం చూపబడుతుంది.

### 3. ఖర్చు

ఈ code స్థిరమైన ధరను నిర్ణయించదు. Meta ధరలు పంపే దేశం, template/message category, ప్రస్తుత rate card, అలాగే BSP/provider ఛార్జీలను బట్టి మారవచ్చు. మీ లక్ష్య దేశం, template categoryకి సరిపడే తాజా రేటును Meta యొక్క అధికారిక [WhatsApp Business Platform pricing](https://developers.facebook.com/docs/whatsapp/pricing/) పేజీలో పరిశీలించండి. రోజుకు ఒక్క సందేశం లేదా ప్రతి 6 గంటలకు నాలుగు సందేశాలు పంపితే నెలకు వరుసగా సుమారు 30 లేదా 120 template sends ఒక్క subscriberకు వస్తాయి; వాస్తవ bill మీ ఖాతా rate cardపై ఆధారపడి ఉంటుంది.

## పరిమితులు

- ఇది వ్యక్తిగత opt-in షెడ్యూల్; సాధారణ WhatsApp group/broadcast-list నిర్వహణ కాదు. ప్రతి వినియోగదారు తన నంబర్, సమయం, వ్యవధిని నిర్వహిస్తారు.
- పద్యం ఎంపిక `GET /api/poems`లోని పద్యాల నుంచి యాదృచ్ఛికంగా జరుగుతుంది. షెడ్యూల్ ఆలస్యమైతే పంపకం తదుపరి ఐదు నిమిషాల తనిఖీలో జరుగుతుంది.
- Xలో ఆటోమేటిక్ పోస్టింగ్ ఈ featureలో లేదు. ఈ repoలో X account OAuth/API credentials లేవు; దాన్ని జోడించాలంటే వేరుగా X developer app, user authorization, token storage, posting-limit నిర్వహణ అవసరం.