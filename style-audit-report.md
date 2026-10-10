# 🎨 రత్నాలబాల — Style Audit Report

_10/10/2026, 9:00:46 pm · 194 ఫైళ్ళు చూశాం (node_modules, .next, public తప్ప)_

## 1. సారాంశం

| ఏమిటి | ఎన్ని | అర్థం |
|---|---:|---|
| `sx={{}}` inline styles | 1873 | పదే పదే ఉన్నవి globals.css class లుగా మార్చవచ్చు |
| `style={{}}` inline styles | 149 | వీలైతే sx లేదా class కి |
| Hard-coded రంగులు (#hex / rgb) | 779 (334 వేర్వేరు) | var(--token) కి మార్చాలి |
| font-family ప్రకటనలు | 196 | fonts lib/teluguFonts నుంచే రావాలి |
| `!important` | 77 | MUI theme పెడితే చాలా పోతాయి |
| MUI components (వేర్వేరు) | 66 | |
| MUI icons (వేర్వేరు) | 186 | సాధారణమైనవి icons.tsx కి |
| Tailwind వాడే ఫైళ్ళు | 3 | MUI తో కలిపి 2 పద్ధతులు — ఒకటి ఎంచుకోవాలి |
| CSS ఫైళ్ళు | 6 | |
| 44px కంటే చిన్న minHeight | 21 | 60+ పాఠకులకు నొక్కడం కష్టం |

## 2. ఫైళ్ళ వారీగా (inline styles ఎక్కువ ఉన్నవి ముందు)

| ఫైల్ | గీతలు | sx | style | రంగులు | fonts | !important | MUI | icons | Tailwind |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| app/components/khatimala/themes.ts | 390 | 0 | 0 | 132 | 0 | 0 | 0 | 0 | 0 |
| app/components/TeluguVoice.tsx | 933 | 0 | 45 | 66 | 2 | 0 | 2 | 0 | 0 |
| app/components/Ratnalabala.tsx | 822 | 106 | 0 | 0 | 0 | 0 | 9 | 40 | 0 |
| app/sandhi/page.tsx | 468 | 69 | 0 | 31 | 34 | 4 | 14 | 7 | 0 |
| app/components/Pdfqa.tsx | 897 | 94 | 0 | 0 | 0 | 0 | 10 | 5 | 0 |
| app/components/Aksharamal.tsx | 1502 | 77 | 0 | 1 | 0 | 1 | 24 | 10 | 0 |
| app/components/PoemCard.tsx | 1305 | 54 | 3 | 14 | 2 | 1 | 20 | 13 | 0 |
| app/smruthimala/page.tsx | 876 | 62 | 0 | 7 | 9 | 0 | 4 | 6 | 0 |
| app/components/khatimala/BlockEditor.tsx | 539 | 55 | 0 | 11 | 3 | 1 | 14 | 21 | 0 |
| app/components/PoemCardNew.tsx | 1223 | 48 | 3 | 14 | 2 | 1 | 16 | 11 | 0 |
| app/components/SamasaDetectorPanel.tsx | 328 | 45 | 0 | 17 | 24 | 3 | 10 | 0 | 0 |
| app/khatiMala/page.tsx | 647 | 52 | 0 | 10 | 0 | 0 | 17 | 12 | 0 |
| app/components/TeluguDataGrid.tsx | 1552 | 58 | 0 | 3 | 1 | 1 | 17 | 9 | 0 |
| app/padalamala/page.tsx | 413 | 39 | 1 | 21 | 18 | 2 | 14 | 4 | 0 |
| app/rahasyabhasha/page.tsx | 367 | 0 | 22 | 36 | 1 | 0 | 0 | 10 | 0 |
| app/components/YuktaiGridView.tsx | 957 | 42 | 1 | 14 | 2 | 2 | 26 | 8 | 0 |
| app/components/GeetaCard.tsx | 870 | 40 | 2 | 11 | 5 | 0 | 16 | 6 | 0 |
| app/components/Poemradio.tsx | 441 | 21 | 2 | 29 | 0 | 2 | 13 | 6 | 0 |
| app/components/Navbar.tsx | 700 | 39 | 1 | 11 | 0 | 0 | 16 | 8 | 0 |
| app/components/khatimala/ExportDialog.tsx | 363 | 41 | 0 | 7 | 0 | 0 | 15 | 11 | 0 |
| app/components/exportPoems.tsx | 956 | 0 | 0 | 47 | 4 | 0 | 0 | 0 | 0 |
| app/guninta/page.tsx | 331 | 32 | 0 | 15 | 12 | 3 | 10 | 3 | 0 |
| app/components/ShailimalaTabs.tsx | 538 | 42 | 3 | 1 | 1 | 3 | 10 | 2 | 0 |
| app/samasa/page.tsx | 197 | 35 | 0 | 10 | 16 | 1 | 14 | 7 | 0 |
| app/components/ChitramalaCanvaEditor.tsx | 647 | 23 | 2 | 18 | 10 | 0 | 13 | 10 | 0 |
| app/components/WebMCP.tsx | 959 | 43 | 0 | 0 | 4 | 0 | 12 | 9 | 0 |
| app/components/FontSelection.tsx | 710 | 24 | 0 | 17 | 6 | 0 | 13 | 4 | 0 |
| app/components/TeluguNewsReader.tsx | 998 | 28 | 2 | 8 | 0 | 0 | 17 | 10 | 0 |
| app/components/Familyvoicerecorder.tsx | 735 | 32 | 0 | 5 | 0 | 0 | 11 | 9 | 0 |
| app/RootClientLayout.tsx | 516 | 35 | 0 | 2 | 0 | 0 | 9 | 5 | 0 |
| app/components/khatimala/DesignPanel.tsx | 298 | 35 | 0 | 0 | 0 | 0 | 12 | 2 | 0 |
| app/components/AksharaMalaPoster.tsx | 574 | 26 | 0 | 6 | 0 | 0 | 11 | 7 | 0 |
| app/components/MyFontsDialog.tsx | 348 | 32 | 0 | 0 | 2 | 0 | 12 | 5 | 0 |
| app/components/TeluguocrPage.tsx | 637 | 10 | 8 | 13 | 4 | 0 | 12 | 1 | 0 |
| app/components/miraLifeJounery.tsx | 424 | 27 | 1 | 2 | 0 | 0 | 12 | 0 | 0 |
| app/poems/page.tsx | 648 | 28 | 0 | 2 | 0 | 0 | 12 | 11 | 0 |
| app/components/khatimala/Help.tsx | 229 | 20 | 0 | 9 | 0 | 0 | 10 | 1 | 0 |
| app/components/ChatbotWindow.tsx | 397 | 28 | 0 | 0 | 0 | 0 | 12 | 2 | 0 |
| app/shatakamu/page.tsx | 344 | 24 | 0 | 4 | 0 | 0 | 12 | 7 | 0 |
| app/components/KhatiMala.tsx | 382 | 22 | 1 | 4 | 2 | 0 | 14 | 3 | 0 |
| app/components/khatimala/SlidesBar.tsx | 241 | 25 | 0 | 1 | 0 | 0 | 12 | 7 | 0 |
| app/components/khatimala/Slideshow.tsx | 317 | 11 | 0 | 13 | 0 | 1 | 5 | 7 | 0 |
| app/components/Geetacardversesections.tsx | 151 | 11 | 0 | 12 | 0 | 0 | 4 | 4 | 0 |
| app/components/PoemBrowser.tsx | 467 | 21 | 0 | 2 | 0 | 0 | 14 | 5 | 0 |
| app/components/swaramala.tsx | 352 | 7 | 0 | 15 | 0 | 0 | 11 | 8 | 0 |
| app/components/AksharaTraceBoard.tsx | 437 | 11 | 2 | 7 | 2 | 0 | 7 | 4 | 0 |
| app/components/RatnalabalaBackground.tsx | 144 | 20 | 0 | 0 | 0 | 0 | 6 | 3 | 0 |
| app/aksharamala/page.tsx | 247 | 16 | 0 | 2 | 0 | 0 | 8 | 8 | 0 |
| app/gnanamala/page.tsx | 610 | 16 | 0 | 2 | 0 | 0 | 6 | 2 | 0 |
| app/components/AccordionChunk.tsx | 115 | 0 | 12 | 3 | 0 | 0 | 0 | 0 | 0 |
| app/components/MiraIntro.tsx | 104 | 15 | 0 | 0 | 0 | 0 | 5 | 1 | 0 |
| app/components/StoryCard.tsx | 238 | 13 | 0 | 2 | 0 | 0 | 10 | 5 | 0 |
| app/my-reading/page.tsx | 212 | 15 | 0 | 0 | 0 | 0 | 14 | 4 | 0 |
| app/components/AgentPoemButton.tsx | 136 | 11 | 1 | 2 | 0 | 0 | 8 | 1 | 0 |
| app/components/DownloadRingtones.tsx | 149 | 14 | 0 | 0 | 2 | 0 | 4 | 3 | 0 |
| app/components/khatimala/exporters.ts | 1022 | 0 | 0 | 14 | 2 | 1 | 0 | 0 | 0 |
| rag-env/Lib/site-packages/tokenizers/tools/visualizer-styles.css | 171 | 0 | 0 | 14 | 1 | 0 | 0 | 0 | 0 |
| app/components/khatimala/FontPicker.tsx | 131 | 11 | 2 | 0 | 2 | 0 | 7 | 1 | 0 |
| app/test-lab/page.tsx | 292 | 13 | 0 | 0 | 0 | 0 | 9 | 0 | 0 |
| app/geeta/page.tsx | 160 | 10 | 0 | 2 | 0 | 0 | 9 | 0 | 0 |
| app/kathamala/page.tsx | 163 | 10 | 0 | 2 | 0 | 0 | 9 | 0 | 0 |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/estimator.css | 425 | 0 | 0 | 12 | 4 | 6 | 0 | 0 | 0 |
| app/components/PageLoadTime.tsx | 113 | 4 | 0 | 7 | 0 | 0 | 4 | 1 | 0 |
| app/components/SametaCard.tsx | 150 | 8 | 0 | 3 | 0 | 0 | 6 | 2 | 0 |
| app/sametalu/page.tsx | 102 | 9 | 0 | 2 | 0 | 0 | 10 | 1 | 0 |
| app/components/GeetaListByChapter.tsx | 321 | 10 | 0 | 0 | 0 | 0 | 10 | 5 | 0 |
| app/components/Offlinebanner.tsx | 143 | 6 | 0 | 4 | 0 | 0 | 3 | 1 | 0 |
| app/chitramala/page.tsx | 115 | 4 | 2 | 3 | 0 | 0 | 2 | 0 | 0 |
| app/components/AnalysisSummary.tsx | 123 | 0 | 6 | 3 | 0 | 0 | 0 | 0 | 0 |
| app/components/FileUploadComponent.tsx | 71 | 0 | 5 | 4 | 0 | 0 | 0 | 0 | 0 |
| app/components/khatimala/Preview.tsx | 130 | 6 | 0 | 3 | 0 | 0 | 2 | 0 | 0 |
| app/components/PoemInput.tsx | 202 | 4 | 4 | 1 | 0 | 0 | 3 | 0 | 0 |
| app/components/DownloadAllVideos.tsx | 472 | 7 | 1 | 0 | 0 | 0 | 16 | 1 | 0 |
| app/components/ModuleFavoriteButton.tsx | 143 | 2 | 0 | 6 | 0 | 0 | 4 | 2 | 0 |
| app/components/DownloadAllVoices.tsx | 428 | 7 | 0 | 0 | 0 | 0 | 16 | 1 | 0 |
| app/components/PwaInstallPrompt.tsx | 225 | 6 | 1 | 0 | 0 | 0 | 6 | 2 | 0 |
| app/parabhava/page.tsx | 318 | 3 | 0 | 4 | 0 | 0 | 6 | 1 | 0 |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/params.css | 161 | 0 | 0 | 7 | 1 | 4 | 0 | 0 | 0 |
| app/components/FeaturedContent.tsx | 107 | 6 | 0 | 0 | 0 | 0 | 6 | 1 | 0 |
| app/components/KeywordBadges.tsx | 51 | 0 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| app/swaramala/page.tsx | 71 | 1 | 2 | 3 | 0 | 0 | 2 | 0 | 0 |
| app/components/Footer.tsx | 124 | 4 | 0 | 1 | 0 | 0 | 2 | 0 | 0 |
| app/components/PoemsGridView.tsx | 191 | 5 | 0 | 0 | 0 | 0 | 6 | 2 | 0 |
| app/components/ReadingEntryButton.tsx | 107 | 1 | 0 | 4 | 0 | 0 | 2 | 2 | 0 |
| app/Dedication/page.tsx | 121 | 5 | 0 | 0 | 2 | 0 | 7 | 0 | 0 |
| app/error.tsx | 85 | 5 | 0 | 0 | 1 | 0 | 4 | 3 | 0 |
| app/global-error.tsx | 52 | 0 | 4 | 1 | 1 | 0 | 0 | 0 | 0 |
| app/components/CookieConsentBanner.tsx | 80 | 4 | 0 | 0 | 0 | 0 | 5 | 0 | 0 |
| app/components/DownloadAllPosters.tsx | 264 | 3 | 1 | 0 | 0 | 0 | 9 | 1 | 0 |
| app/components/DownloadAllSametalu.tsx | 197 | 3 | 1 | 0 | 0 | 0 | 4 | 1 | 0 |
| app/components/ErrorMessageComponent.tsx | 29 | 0 | 1 | 3 | 0 | 0 | 0 | 0 | 0 |
| app/components/MusicPlayer.tsx | 87 | 4 | 0 | 0 | 1 | 0 | 3 | 0 | 0 |
| app/components/PythonSametaluChat.tsx | 105 | 4 | 0 | 0 | 0 | 0 | 6 | 1 | 0 |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/features.css | 120 | 0 | 0 | 4 | 1 | 0 | 0 | 0 | 0 |
| app/components/FloatingAIButton.tsx | 72 | 3 | 0 | 0 | 0 | 0 | 6 | 1 | 0 |
| app/components/StreamingChat.tsx | 73 | 3 | 0 | 0 | 0 | 0 | 5 | 1 | 0 |
| app/layout.tsx | 121 | 0 | 0 | 3 | 0 | 0 | 0 | 0 | 0 |
| app/components/SametaluList.tsx | 176 | 2 | 0 | 0 | 0 | 0 | 6 | 0 | 0 |
| app/components/TeluguOcrExplanation.tsx | 75 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 9 |
| app/news/page.tsx | 19 | 2 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| app/page.module.css | 237 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| lib/posterExport.ts | 167 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| app/components/GoToTopButton.tsx | 72 | 1 | 0 | 0 | 0 | 0 | 3 | 1 | 0 |
| app/components/khatimala/engine.ts | 740 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| app/components/khatimala/storage.ts | 99 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| app/components/StoryListByAge.tsx | 59 | 1 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |
| app/components/Telugufonts.tsx | 468 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | 0 |
| app/page.tsx | 22 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| app/video/page.tsx | 17 | 1 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| lib/floating.ts | 23 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| lib/teluguFonts.ts | 468 | 0 | 1 | 0 | 2 | 0 | 0 | 0 | 0 |
| app/components/AksharaPdfDownload.tsx | 152 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| app/components/AudioPlayer.tsx | 38 | 0 | 0 | 0 | 0 | 0 | 1 | 2 | 0 |
| app/components/ShareBar.tsx | 108 | 0 | 0 | 0 | 0 | 0 | 3 | 2 | 0 |
| app/globals.css | 1265 | 0 | 0 | 0 | 2 | 40 | 0 | 0 | 0 |
| app/lipimala/page.tsx | 23 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 |
| app/shailimala/page.tsx | 210 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 26 |
| rag-env/Lib/site-packages/torch/utils/model_dump/code.js | 690 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 |

## 3. Hard-coded రంగులు (ఎక్కువ వాడినవి ముందు)

globals.css లో ఇప్పటికే ఉన్న token తో సరిపోతే → `var(--…)` పెట్టండి. కొత్తది అయితే → token గా చేర్చండి.
(globals.css లెక్కలో లేదు — tokens అక్కడే నిర్వచిస్తాం. khatimala/themes.ts లోని రంగులు పోస్టర్ రూపాలవి, అవి అలాగే ఉండాలి.)

| రంగు | ఎన్నిసార్లు | ఎక్కడ |
|---|---:|---|
| `#2d6a4f` | 52 | app/components/GeetaCard.tsx:265, app/components/PoemCard.tsx:255, app/components/PoemCard.tsx:293, app/components/PoemCardNew.tsx:283 …+40 |
| `#fff` | 46 | app/components/AccordionChunk.tsx:29, app/components/AksharaMalaPoster.tsx:343, app/components/AksharaTraceBoard.tsx:373, app/components/exportPoems.tsx:773 …+42 |
| `#0f172a` | 29 | app/aksharamala/page.tsx:163, app/chitramala/page.tsx:35, app/components/ChitramalaCanvaEditor.tsx:109, app/components/exportPoems.tsx:292 …+24 |
| `#ffffff` | 28 | app/components/AksharaMalaPoster.tsx:332, app/components/exportPoems.tsx:292, app/components/exportPoems.tsx:295, app/components/khatimala/BlockEditor.tsx:55 …+23 |
| `#2563eb` | 20 | app/aksharamala/page.tsx:163, app/chitramala/page.tsx:35, app/components/AnalysisSummary.tsx:114, app/components/ChitramalaCanvaEditor.tsx:457 …+16 |
| `#8b3a1f` | 15 | app/components/FontSelection.tsx:377, app/components/FontSelection.tsx:405, app/components/FontSelection.tsx:406, app/components/FontSelection.tsx:500 …+11 |
| `#1a3d2b` | 15 | app/components/FontSelection.tsx:662, app/components/GeetaCard.tsx:264, app/components/PoemCard.tsx:292, app/components/PoemCardNew.tsx:296 …+11 |
| `#1a5276` | 10 | app/components/SamasaDetectorPanel.tsx:11, app/guninta/page.tsx:246, app/guninta/page.tsx:308, app/padalamala/page.tsx:25 …+3 |
| `#e4dacb` | 9 | app/components/FontSelection.tsx:387, app/components/GeetaCard.tsx:52, app/components/Geetacardversesections.tsx:70, app/components/Geetacardversesections.tsx:94 …+5 |
| `#cbd5e1` | 7 | app/components/exportPoems.tsx:292, app/components/exportPoems.tsx:779, app/components/Poemradio.tsx:380, app/components/Poemradio.tsx:399 …+3 |
| `#f7f2ea` | 7 | app/components/FontSelection.tsx:388, app/components/GeetaCard.tsx:47, app/components/Geetacardversesections.tsx:113, app/components/Geetacardversesections.tsx:136 …+3 |
| `#2b2620` | 7 | app/components/GeetaCard.tsx:48, app/components/GeetaCard.tsx:50, app/components/PoemCard.tsx:37, app/components/PoemCard.tsx:39 …+3 |
| `#000` | 6 | app/components/AksharaTraceBoard.tsx:112, app/components/khatimala/exporters.ts:768, app/components/khatimala/Slideshow.tsx:213, app/components/ShailimalaTabs.tsx:439 …+2 |
| `#1a1a1a` | 6 | app/components/ChitramalaCanvaEditor.tsx:177, app/components/khatimala/BlockEditor.tsx:55, app/components/khatimala/themes.ts:65, app/components/khatimala/themes.ts:66 …+2 |
| `#64748b` | 6 | app/components/exportPoems.tsx:778, app/components/exportPoems.tsx:788, app/rahasyabhasha/page.tsx:179, app/rahasyabhasha/page.tsx:224 …+2 |
| `#241f1a` | 6 | app/components/khatimala/exporters.ts:771, app/components/khatimala/Slideshow.tsx:253, app/components/ModuleFavoriteButton.tsx:134, app/components/Navbar.tsx:98 …+2 |
| `#d9a400` | 6 | app/components/khatimala/Help.tsx:40, app/components/khatimala/Help.tsx:52, app/components/khatimala/Help.tsx:130, app/components/khatimala/Help.tsx:131 …+2 |
| `#b8860b` | 6 | app/components/khatimala/themes.ts:254, app/components/khatimala/themes.ts:265, app/components/khatimala/themes.ts:266, app/components/khatimala/themes.ts:268 …+2 |
| `#25d366` | 6 | app/components/PoemCard.tsx:1273, app/components/PoemCard.tsx:1274, app/components/PoemCardNew.tsx:1189, app/components/PoemCardNew.tsx:1190 |
| `#f8fafc` | 5 | app/components/AccordionChunk.tsx:53, app/components/YuktaiGridView.tsx:141, app/parabhava/page.tsx:187, app/rahasyabhasha/page.tsx:231 …+1 |
| `#000000` | 5 | app/components/ChitramalaCanvaEditor.tsx:151, app/components/exportPoems.tsx:295, app/components/khatimala/BlockEditor.tsx:213, app/components/YuktaiGridView.tsx:143 |
| `#ef4444` | 5 | app/components/FontSelection.tsx:368, app/components/PageLoadTime.tsx:47, app/components/TeluguVoice.tsx:759, app/components/TeluguVoice.tsx:771 …+1 |
| `#a31515` | 5 | app/components/khatimala/BlockEditor.tsx:55, app/components/khatimala/BlockEditor.tsx:424, app/components/khatimala/ExportDialog.tsx:45, app/components/khatimala/SlidesBar.tsx:166 …+1 |
| `#7a4a1e` | 5 | app/components/khatimala/themes.ts:84, app/components/khatimala/themes.ts:87, app/components/khatimala/themes.ts:95, app/components/khatimala/themes.ts:96 …+1 |
| `rgba(255,255,255,0.4)` | 5 | app/components/ModuleFavoriteButton.tsx:91, app/components/Navbar.tsx:171, app/components/Navbar.tsx:192, app/components/Navbar.tsx:338 …+1 |
| `#784212` | 5 | app/components/SamasaDetectorPanel.tsx:11, app/padalamala/page.tsx:273, app/samasa/page.tsx:24, app/sandhi/page.tsx:30 |
| `#059669` | 5 | app/components/TeluguVoice.tsx:111, app/components/TeluguVoice.tsx:112, app/components/TeluguVoice.tsx:117, app/components/TeluguVoice.tsx:118 …+1 |
| `#e5e7eb` | 4 | app/components/AccordionChunk.tsx:26, app/components/AgentPoemButton.tsx:86, app/components/AnalysisSummary.tsx:38, app/components/TeluguVoice.tsx:810 |
| `#1a237e` | 4 | app/components/Aksharamal.tsx:540, app/components/AksharaMalaPoster.tsx:388, app/components/exportPoems.tsx:786, app/components/exportPoems.tsx:792 |
| `#475569` | 4 | app/components/exportPoems.tsx:292, app/components/exportPoems.tsx:794, app/rahasyabhasha/page.tsx:156, app/rahasyabhasha/page.tsx:200 |

## 4. Fonts (font-family)

| font | ఎన్ని | ఎక్కడ |
|---|---:|---|
| Noto Serif Telugu | 116 | app/components/DownloadRingtones.tsx:41, app/components/DownloadRingtones.tsx:101, app/components/GeetaCard.tsx:450, app/components/GeetaCard.tsx:509 …+112 |
| monospace | 14 | app/components/TeluguocrPage.tsx:583, app/error.tsx:78, rag-env/Lib/site-packages/sklearn/utils/_repr_html/estimator.css:261, rag-env/Lib/site-packages/sklearn/utils/_repr_html/estimator.css:272 …+10 |
| POSTER_FONT | 5 | app/components/ChitramalaCanvaEditor.tsx:164, app/components/ChitramalaCanvaEditor.tsx:179, app/components/ChitramalaCanvaEditor.tsx:194, app/components/ChitramalaCanvaEditor.tsx:209 …+1 |
| ui-monospace | 5 | app/components/WebMCP.tsx:479, app/components/WebMCP.tsx:573, app/components/WebMCP.tsx:712, app/components/WebMCP.tsx:819 …+1 |
| fontStack(POSTER_BODY_FONT) | 4 | app/smruthimala/page.tsx:802, app/smruthimala/page.tsx:807, app/smruthimala/page.tsx:813, app/smruthimala/page.tsx:832 |
| family | 3 | app/components/khatimala/BlockEditor.tsx:440, app/components/khatimala/BlockEditor.tsx:468, app/components/khatimala/FontPicker.tsx:54 |
| ${fontFamily | 3 | app/components/TeluguocrPage.tsx:314, app/components/TeluguocrPage.tsx:365, app/components/TeluguocrPage.tsx:377 |
| display | 3 | app/smruthimala/page.tsx:333, app/smruthimala/page.tsx:507, app/smruthimala/page.tsx:646 |
| string | 2 | app/components/AksharaTraceBoard.tsx:54, app/components/ChitramalaCanvaEditor.tsx:70 |
| fontStack(f.value) | 2 | app/components/ChitramalaCanvaEditor.tsx:585, app/components/MyFontsDialog.tsx:315 |
| ${font.family | 2 | app/components/exportPoems.tsx:198, app/components/exportPoems.tsx:207 |
| TeluguFont | 2 | app/components/FontSelection.tsx:37, app/components/FontSelection.tsx:50 |
| RBShow | 2 | app/components/khatimala/exporters.ts:760, app/components/khatimala/exporters.ts:768 |
| fontStack(value) | 2 | app/components/Telugufonts.tsx:16, lib/teluguFonts.ts:16 |
| ${font.value | 2 | app/components/Telugufonts.tsx:151, lib/teluguFonts.ts:151 |
| system-ui | 2 | app/components/TeluguVoice.tsx:737, app/global-error.tsx:27 |
| isTelugu | 2 | app/Dedication/page.tsx:84, app/Dedication/page.tsx:103 |
| fontStack(DISPLAY_FONT) | 2 | app/smruthimala/page.tsx:805, app/smruthimala/page.tsx:835 |
| string): Uint8Array { | 1 | app/components/AksharaTraceBoard.tsx:110 |
| fontStack(el.fontFamily) | 1 | app/components/ChitramalaCanvaEditor.tsx:451 |

## 5. MUI components

| component | ఎన్ని ఫైళ్ళు | ఎక్కడ |
|---|---:|---|
| Box | 81 | app/aksharamala/page.tsx, app/chitramala/page.tsx, app/components/AgentPoemButton.tsx …+78 |
| Typography | 81 | app/aksharamala/page.tsx, app/chitramala/page.tsx, app/components/AgentPoemButton.tsx …+78 |
| Button | 62 | app/components/AgentPoemButton.tsx, app/components/Aksharamal.tsx, app/components/AksharaMalaPoster.tsx …+59 |
| Stack | 61 | app/aksharamala/page.tsx, app/components/Aksharamal.tsx, app/components/AksharaMalaPoster.tsx …+58 |
| IconButton | 38 | app/components/Aksharamal.tsx, app/components/AksharaMalaPoster.tsx, app/components/AksharaTraceBoard.tsx …+35 |
| Chip | 28 | app/aksharamala/page.tsx, app/components/AgentPoemButton.tsx, app/components/Aksharamal.tsx …+25 |
| TextField | 26 | app/components/Aksharamal.tsx, app/components/ChatbotWindow.tsx, app/components/ChitramalaCanvaEditor.tsx …+23 |
| MenuItem | 25 | app/components/Aksharamal.tsx, app/components/ChitramalaCanvaEditor.tsx, app/components/DownloadAllVideos.tsx …+22 |
| CircularProgress | 22 | app/components/AgentPoemButton.tsx, app/components/Aksharamal.tsx, app/components/AksharaMalaPoster.tsx …+19 |
| Select | 22 | app/components/Aksharamal.tsx, app/components/ChitramalaCanvaEditor.tsx, app/components/DownloadAllVideos.tsx …+19 |
| Collapse | 20 | app/components/Aksharamal.tsx, app/components/GeetaCard.tsx, app/components/Geetacardversesections.tsx …+17 |
| Divider | 18 | app/aksharamala/page.tsx, app/components/Aksharamal.tsx, app/components/AksharaMalaPoster.tsx …+15 |
| Card | 18 | app/components/AgentPoemButton.tsx, app/components/AksharaMalaPoster.tsx, app/components/GeetaCard.tsx …+15 |
| CardContent | 18 | app/components/AgentPoemButton.tsx, app/components/AksharaMalaPoster.tsx, app/components/GeetaCard.tsx …+15 |
| Alert | 18 | app/components/AgentPoemButton.tsx, app/components/Aksharamal.tsx, app/components/ChatbotWindow.tsx …+15 |
| alpha | 18 | app/components/Aksharamal.tsx, app/components/ChatbotWindow.tsx, app/components/GeetaCard.tsx …+15 |
| useTheme | 17 | app/components/Aksharamal.tsx, app/components/AksharaTraceBoard.tsx, app/components/Familyvoicerecorder.tsx …+14 |
| Tooltip | 16 | app/components/AksharaMalaPoster.tsx, app/components/ChitramalaCanvaEditor.tsx, app/components/FloatingAIButton.tsx …+13 |
| LinearProgress | 15 | app/components/Aksharamal.tsx, app/components/DownloadAllPosters.tsx, app/components/DownloadAllSametalu.tsx …+12 |
| Slider | 12 | app/components/ChitramalaCanvaEditor.tsx, app/components/FontSelection.tsx, app/components/GeetaCard.tsx …+9 |
| FormControl | 12 | app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx, app/components/GeetaCard.tsx …+9 |
| Paper | 11 | app/components/ChatbotWindow.tsx, app/components/CookieConsentBanner.tsx, app/components/FeaturedContent.tsx …+8 |
| useMediaQuery | 10 | app/components/Aksharamal.tsx, app/components/Familyvoicerecorder.tsx, app/components/FloatingAIButton.tsx …+7 |
| Dialog | 10 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx …+7 |
| ToggleButtonGroup | 9 | app/components/Aksharamal.tsx, app/components/khatimala/BlockEditor.tsx, app/components/khatimala/DesignPanel.tsx …+6 |
| ToggleButton | 9 | app/components/Aksharamal.tsx, app/components/khatimala/BlockEditor.tsx, app/components/khatimala/DesignPanel.tsx …+6 |
| DialogContent | 9 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx …+6 |
| DialogTitle | 9 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx …+6 |
| Tabs | 8 | app/components/ChitramalaCanvaEditor.tsx, app/components/Ratnalabala.tsx, app/components/ShailimalaTabs.tsx …+5 |
| Tab | 8 | app/components/ChitramalaCanvaEditor.tsx, app/components/Ratnalabala.tsx, app/components/ShailimalaTabs.tsx …+5 |
| InputLabel | 8 | app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx, app/components/GeetaCard.tsx …+5 |
| FormControlLabel | 7 | app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx, app/components/khatimala/BlockEditor.tsx …+4 |
| Switch | 7 | app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx, app/components/khatimala/BlockEditor.tsx …+4 |
| InputAdornment | 6 | app/components/Aksharamal.tsx, app/components/GeetaListByChapter.tsx, app/components/PoemBrowser.tsx …+3 |
| Container | 5 | app/components/Aksharamal.tsx, app/components/miraLifeJounery.tsx, app/components/Ratnalabala.tsx …+2 |
| Skeleton | 5 | app/components/Aksharamal.tsx, app/components/FeaturedContent.tsx, app/components/PoemBrowser.tsx …+2 |
| DialogActions | 5 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx …+2 |
| Fab | 4 | app/components/FloatingAIButton.tsx, app/components/GoToTopButton.tsx, app/components/PwaInstallPrompt.tsx …+1 |
| Snackbar | 4 | app/components/FontSelection.tsx, app/components/ModuleFavoriteButton.tsx, app/components/PwaInstallPrompt.tsx …+1 |
| Accordion | 3 | app/aksharamala/page.tsx, app/components/ShailimalaTabs.tsx, app/components/TeluguocrPage.tsx |
| AccordionSummary | 3 | app/aksharamala/page.tsx, app/components/ShailimalaTabs.tsx, app/components/TeluguocrPage.tsx |
| AccordionDetails | 3 | app/aksharamala/page.tsx, app/components/ShailimalaTabs.tsx, app/components/TeluguocrPage.tsx |
| Pagination | 3 | app/components/Aksharamal.tsx, app/components/GeetaListByChapter.tsx, app/parabhava/page.tsx |
| Drawer | 3 | app/components/Aksharamal.tsx, app/components/ChatbotWindow.tsx, app/components/Navbar.tsx |
| DialogContentText | 3 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllVideos.tsx, app/components/DownloadAllVoices.tsx |
| List | 3 | app/components/miraLifeJounery.tsx, app/components/Navbar.tsx, app/my-reading/page.tsx |
| ListItem | 3 | app/components/miraLifeJounery.tsx, app/components/Navbar.tsx, app/my-reading/page.tsx |
| ListItemText | 3 | app/components/miraLifeJounery.tsx, app/components/Navbar.tsx, app/my-reading/page.tsx |
| Fade | 2 | app/components/FeaturedContent.tsx, app/components/PageLoadTime.tsx |
| Menu | 2 | app/components/khatimala/SlidesBar.tsx, app/components/Navbar.tsx |
| ListItemButton | 2 | app/components/Navbar.tsx, app/my-reading/page.tsx |
| ButtonGroup | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Popover | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Autocomplete | 1 | app/components/FontSelection.tsx |
| Link | 1 | app/components/FontSelection.tsx |
| GlobalStyles | 1 | app/components/Footer.tsx |
| Zoom | 1 | app/components/GoToTopButton.tsx |
| ListSubheader | 1 | app/components/khatimala/FontPicker.tsx |
| ListItemIcon | 1 | app/components/miraLifeJounery.tsx |
| AppBar | 1 | app/components/Navbar.tsx |

## 6. Icons

**MUI icons:** 186 వేర్వేరు, 383 సార్లు import

| icon | ఎన్ని ఫైళ్ళు | ఎక్కడ |
|---|---:|---|
| ExpandMoreRounded | 17 | app/components/GeetaCard.tsx, app/components/Geetacardversesections.tsx, app/components/GeetaListByChapter.tsx …+14 |
| ExpandLessRounded | 16 | app/components/GeetaCard.tsx, app/components/Geetacardversesections.tsx, app/components/GeetaListByChapter.tsx …+13 |
| AutoAwesomeRounded | 12 | app/components/AgentPoemButton.tsx, app/components/Aksharamal.tsx, app/components/FeaturedContent.tsx …+9 |
| CloseRounded | 10 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/ExportDialog.tsx, app/components/khatimala/Help.tsx …+7 |
| MenuBookRounded | 9 | app/components/GeetaCard.tsx, app/components/Geetacardversesections.tsx, app/components/Pdfqa.tsx …+6 |
| VolumeUpRounded | 8 | app/components/GeetaCard.tsx, app/components/PoemCard.tsx, app/components/PoemCardNew.tsx …+5 |
| VolumeUp | 7 | app/aksharamala/page.tsx, app/components/AksharaMalaPoster.tsx, app/components/AudioPlayer.tsx …+4 |
| DownloadRounded | 7 | app/components/DownloadRingtones.tsx, app/components/khatimala/ExportDialog.tsx, app/components/PoemBrowser.tsx …+4 |
| DeleteOutlineRounded | 7 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/BlockEditor.tsx, app/components/khatimala/DesignPanel.tsx …+4 |
| PictureAsPdfRounded | 6 | app/components/Aksharamal.tsx, app/components/khatimala/ExportDialog.tsx, app/components/KhatiMala.tsx …+3 |
| SendRounded | 6 | app/components/ChatbotWindow.tsx, app/components/Pdfqa.tsx, app/components/PoemCard.tsx …+3 |
| DownloadForOfflineRounded | 6 | app/components/DownloadAllPosters.tsx, app/components/DownloadAllSametalu.tsx, app/components/DownloadAllVideos.tsx …+3 |
| PlayArrowRounded | 6 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/Slideshow.tsx, app/components/Poemradio.tsx …+3 |
| AutoStoriesRounded | 6 | app/components/GeetaCard.tsx, app/components/Geetacardversesections.tsx, app/guninta/page.tsx …+3 |
| TableRowsRounded | 5 | app/aksharamala/page.tsx, app/components/TeluguDataGrid.tsx, app/poems/page.tsx …+2 |
| StopRounded | 5 | app/components/Familyvoicerecorder.tsx, app/components/TeluguDataGrid.tsx, app/guninta/page.tsx …+2 |
| PauseRounded | 5 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/Slideshow.tsx, app/components/Poemradio.tsx …+2 |
| StopCircle | 4 | app/components/AksharaMalaPoster.tsx, app/components/SametaCard.tsx, app/components/StoryCard.tsx …+1 |
| CheckCircleRounded | 4 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/ExportDialog.tsx, app/components/Pdfqa.tsx …+1 |
| AddRounded | 4 | app/components/FontSelection.tsx, app/components/khatimala/BlockEditor.tsx, app/components/khatimala/FontPicker.tsx …+1 |
| ContentCopyRounded | 4 | app/components/khatimala/BlockEditor.tsx, app/components/khatimala/SlidesBar.tsx, app/components/PoemCard.tsx …+1 |
| CheckRounded | 4 | app/components/MyFontsDialog.tsx, app/components/PoemCard.tsx, app/components/PoemCardNew.tsx …+1 |
| SearchRounded | 4 | app/components/Navbar.tsx, app/padalamala/page.tsx, app/samasa/page.tsx …+1 |
| WhatsApp | 4 | app/components/PoemCard.tsx, app/components/PoemCardNew.tsx, app/components/ShareBar.tsx …+1 |
| SmartToyRounded | 4 | app/components/PoemsGridView.tsx, app/components/WebMCP.tsx, app/components/YuktaiGridView.tsx …+1 |
| ExpandMore | 3 | app/aksharamala/page.tsx, app/components/Navbar.tsx, app/components/TeluguocrPage.tsx |
| Mic | 3 | app/aksharamala/page.tsx, app/components/AksharaMalaPoster.tsx, app/components/swaramala.tsx |
| HelpOutlineRounded | 3 | app/components/Aksharamal.tsx, app/components/TeluguNewsReader.tsx, app/poems/page.tsx |
| ContrastRounded | 3 | app/components/Aksharamal.tsx, app/components/TeluguDataGrid.tsx, app/components/YuktaiGridView.tsx |
| GridOnRounded | 3 | app/components/Aksharamal.tsx, app/components/TeluguDataGrid.tsx, app/components/YuktaiGridView.tsx |
| Download | 3 | app/components/ChitramalaCanvaEditor.tsx, app/components/ShareBar.tsx, app/components/swaramala.tsx |
| MusicNoteRounded | 3 | app/components/DownloadRingtones.tsx, app/components/khatimala/DesignPanel.tsx, app/components/khatimala/Slideshow.tsx |
| ChevronLeftRounded | 3 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/SlidesBar.tsx, app/smruthimala/page.tsx |
| ChevronRightRounded | 3 | app/components/Familyvoicerecorder.tsx, app/components/khatimala/SlidesBar.tsx, app/smruthimala/page.tsx |
| ImageRounded | 3 | app/components/khatimala/BlockEditor.tsx, app/components/khatimala/ExportDialog.tsx, app/components/KhatiMala.tsx |
| ArrowForwardRounded | 3 | app/components/MiraIntro.tsx, app/components/Ratnalabala.tsx, app/components/RatnalabalaBackground.tsx |
| FavoriteRounded | 3 | app/components/ModuleFavoriteButton.tsx, app/components/ReadingEntryButton.tsx, app/my-reading/page.tsx |
| FavoriteBorderRounded | 3 | app/components/ModuleFavoriteButton.tsx, app/components/ReadingEntryButton.tsx, app/my-reading/page.tsx |
| ChatBubbleOutlineRounded | 3 | app/components/Navbar.tsx, app/components/Ratnalabala.tsx, app/sametalu/page.tsx |
| QuestionAnswerRounded | 3 | app/components/PoemCard.tsx, app/components/PoemCardNew.tsx, app/poems/page.tsx |
| HubRounded | 3 | app/components/PoemsGridView.tsx, app/components/WebMCP.tsx, app/components/YuktaiGridView.tsx |
| Edit | 2 | app/aksharamala/page.tsx, app/components/AksharaMalaPoster.tsx |
| MenuBook | 2 | app/aksharamala/page.tsx, app/rahasyabhasha/page.tsx |
| CodeRounded | 2 | app/aksharamala/page.tsx, app/components/Aksharamal.tsx |
| RecordVoiceOverRounded | 2 | app/components/Aksharamal.tsx, app/shatakamu/page.tsx |
| Close | 2 | app/components/AksharaMalaPoster.tsx, app/components/ChatbotWindow.tsx |
| CheckCircle | 2 | app/components/AksharaMalaPoster.tsx, app/components/AksharaTraceBoard.tsx |
| Cancel | 2 | app/components/AksharaMalaPoster.tsx, app/components/AksharaTraceBoard.tsx |
| DeleteOutline | 2 | app/components/ChitramalaCanvaEditor.tsx, app/rahasyabhasha/page.tsx |
| SmartToy | 2 | app/components/FloatingAIButton.tsx, app/components/FontSelection.tsx |
| Bolt | 2 | app/components/FontSelection.tsx, app/components/PageLoadTime.tsx |
| RestartAlt | 2 | app/components/FontSelection.tsx, app/components/swaramala.tsx |
| ClearRounded | 2 | app/components/GeetaListByChapter.tsx, app/components/PoemBrowser.tsx |
| RemoveRounded | 2 | app/components/khatimala/BlockEditor.tsx, app/components/khatimala/SlidesBar.tsx |
| DescriptionRounded | 2 | app/components/khatimala/ExportDialog.tsx, app/components/KhatiMala.tsx |
| ShareRounded | 2 | app/components/khatimala/ExportDialog.tsx, app/components/TeluguNewsReader.tsx |
| HeadphonesRounded | 2 | app/components/PoemBrowser.tsx, app/poems/page.tsx |
| VolumeDownRounded | 2 | app/components/PoemCard.tsx, app/components/PoemCardNew.tsx |
| TuneRounded | 2 | app/components/PoemCard.tsx, app/components/PoemCardNew.tsx |
| PaletteRounded | 2 | app/components/TeluguDataGrid.tsx, app/khatiMala/page.tsx |
| FindInPageRounded | 2 | app/samasa/page.tsx, app/sandhi/page.tsx |
| TouchApp | 1 | app/aksharamala/page.tsx |
| TimerOutlined | 1 | app/components/Aksharamal.tsx |
| CloudOutlined | 1 | app/components/Aksharamal.tsx |
| TouchAppRounded | 1 | app/components/Aksharamal.tsx |
| Delete | 1 | app/components/AksharaTraceBoard.tsx |
| Send | 1 | app/components/AksharaTraceBoard.tsx |
| Pause | 1 | app/components/AudioPlayer.tsx |
| Undo | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Redo | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Image | 1 | app/components/ChitramalaCanvaEditor.tsx |
| FormatColorFill | 1 | app/components/ChitramalaCanvaEditor.tsx |
| TextFields | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Visibility | 1 | app/components/ChitramalaCanvaEditor.tsx |
| VisibilityOff | 1 | app/components/ChitramalaCanvaEditor.tsx |
| Add | 1 | app/components/ChitramalaCanvaEditor.tsx |
| AndroidRounded | 1 | app/components/DownloadRingtones.tsx |
| MicRounded | 1 | app/components/Familyvoicerecorder.tsx |
| SearchOffRounded | 1 | app/components/GeetaListByChapter.tsx |
| KeyboardArrowUpRounded | 1 | app/components/GoToTopButton.tsx |

**మన icons.tsx (Yuktai శైలి):** ఇంకా ఎక్కడా వాడలేదు

💡 ExpandMore / ArrowForward / Close / Search / Download / Check లాంటి సాధారణ MUI icons → `app/components/icons.tsx` లోని వాటితో మార్చవచ్చు (bundle తేలిక, ఒకే శైలి).

## 7. CSS ఫైళ్ళు — ఎవరు వాడుతున్నారు?

| CSS ఫైల్ | import చేసినవి |
|---|---|
| app/globals.css | app/layout.tsx |
| app/page.module.css | ⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు** |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/estimator.css | ⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు** |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/features.css | ⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు** |
| rag-env/Lib/site-packages/sklearn/utils/_repr_html/params.css | ⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు** |
| rag-env/Lib/site-packages/tokenizers/tools/visualizer-styles.css | ⚠️ **ఎవరూ import చేయడం లేదు — తీసేయవచ్చు** |

## 8. పదే పదే వచ్చే విలువలు → globals.css token / class అభ్యర్థులు

**borderRadius**

| విలువ | ఎన్నిసార్లు |
|---|---:|
| `12px` | 51 |
| `10px` | 50 |
| `8px` | 37 |
| `999px` | 29 |
| `2` | 26 |
| `var(--radius-sm)` | 26 |
| `50%` | 25 |
| `14px` | 22 |
| `var(--radius)` | 15 |
| `12` | 11 |
| `3` | 11 |
| `4` | 10 |

**minHeight / height**

| విలువ | ఎన్నిసార్లు |
|---|---:|
| `minHeight: 44` | 43 |
| `minHeight: 48` | 24 |
| `minHeight: 52` | 22 |
| `minHeight: 56` | 18 |
| `height: 100%` | 15 |
| `height: 44` | 14 |
| `minHeight: 40` | 13 |
| `height: 36` | 11 |
| `height: 48` | 10 |
| `height: 56` | 9 |
| `height: 6` | 6 |
| `height: 100` | 6 |

**fontSize**

| విలువ | ఎన్నిసార్లు |
|---|---:|
| `1rem` | 46 |
| `0.95rem` | 43 |
| `13` | 43 |
| `1.05rem` | 37 |
| `12` | 36 |
| `1.1rem` | 21 |
| `15` | 19 |
| `0.85rem` | 18 |
| `0.9rem` | 17 |
| `14` | 17 |
| `1.15rem` | 16 |
| `18` | 16 |

**fontWeight**

| విలువ | ఎన్నిసార్లు |
|---|---:|
| `700` | 249 |
| `800` | 167 |
| `600` | 48 |
| `500` | 12 |
| `medium` | 8 |
| `900` | 6 |
| `400` | 2 |
| `semibold` | 1 |
| `bold` | 1 |

**boxShadow**

| విలువ | ఎన్నిసార్లు |
|---|---:|
| `0 2px 16px ${alpha(theme.palette.common.black, 0.05)}` | 3 |
| `none` | 3 |
| `0 6px 24px color-mix(in srgb, var(--foreground) 10%, transparent)` | 2 |
| `inset 0 -1px 0 ${border}` | 2 |
| `0 4px 20px ${alpha(color, 0.12)}` | 2 |
| `inset 0 -1px 0 ${gridBorder}` | 1 |
| `0 10px 30px rgba(0,0,0,0.1)` | 1 |
| `0 3px 10px rgba(0,0,0,0.05)` | 1 |
| `0 0 0 0 rgba(211,47,47,0.45)` | 1 |
| `0 0 0 14px rgba(211,47,47,0)` | 1 |
| `0 -2px 8px rgba(0,0,0,0.15)` | 1 |
| `0 2px 6px rgba(0,0,0,0.12)` | 1 |

## 9. 44px కంటే చిన్న నొక్కే చోట్లు

- app/components/Aksharamal.tsx:1090 → minHeight: 40
- app/components/Aksharamal.tsx:1280 → minHeight: 40
- app/components/Aksharamal.tsx:1295 → minHeight: 40
- app/components/Aksharamal.tsx:1306 → minHeight: 40
- app/components/Familyvoicerecorder.tsx:695 → minHeight: 24
- app/components/PoemCard.tsx:1239 → minHeight: 36
- app/components/PoemCard.tsx:1258 → minHeight: 36
- app/components/PoemCard.tsx:1271 → minHeight: 36
- app/components/PoemCardNew.tsx:1154 → minHeight: 36
- app/components/PoemCardNew.tsx:1174 → minHeight: 36
- app/components/PoemCardNew.tsx:1187 → minHeight: 36
- app/components/TeluguDataGrid.tsx:765 → minHeight: 40
- app/components/TeluguDataGrid.tsx:793 → minHeight: 40
- app/components/TeluguDataGrid.tsx:848 → minHeight: 40
- app/components/TeluguDataGrid.tsx:863 → minHeight: 40
- app/components/TeluguVoice.tsx:595 → minHeight: 42
- app/components/YuktaiGridView.tsx:405 → minHeight: 40
- app/components/YuktaiGridView.tsx:461 → minHeight: 40
- app/components/YuktaiGridView.tsx:489 → minHeight: 40
- app/gnanamala/page.tsx:403 → minHeight: 40
- app/gnanamala/page.tsx:413 → minHeight: 40

## 10. ఎక్కువ వాడే CSS tokens

| token | ఎన్నిసార్లు |
|---|---:|
| `--muted-text` | 90 |
| `--border-strong` | 86 |
| `--secondary` | 74 |
| `--primary` | 63 |
| `--surface` | 53 |
| `--foreground` | 52 |
| `--background` | 46 |
| `--surface-elevated` | 43 |
| `--radius-sm` | 35 |
| `--accent-light` | 35 |
| `--focus-ring` | 32 |
| `--radius` | 27 |
| `--border` | 22 |
| `--telugu-font-size` | 16 |
| `--accent-text` | 16 |
| `--sklearn-color-fitted-level-0` | 12 |
| `--shadow-md` | 11 |
| `--error` | 10 |
| `--sklearn-color-text` | 10 |
| `--sklearn-color-unfitted-level-0` | 10 |
| `--telugu-font-family` | 9 |
| `--accent` | 8 |
| `--tap-target` | 6 |
| `--transition-fast` | 6 |
| `--sklearn-color-unfitted-level-2` | 6 |
| `--sklearn-color-fitted-level-2` | 6 |
| `--sklearn-color-unfitted-level-3` | 6 |
| `--sklearn-color-fitted-level-3` | 6 |
| `--app-header-height` | 5 |
| `--shadow-lg` | 5 |

---
**తర్వాత:** ఈ ఫైల్ (`style-audit-report.md`) పంపితే, దాని ఆధారంగా globals.css లో tokens / classes చేర్చి, ఏ ఫైళ్ళలో ఏది మార్చాలో జాబితా ఇస్తాను.