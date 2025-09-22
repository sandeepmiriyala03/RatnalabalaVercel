"use client";

import React from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import { Calendar, User, Home, Book, Award, MapPin, FileText } from "react-feather";

const personalDetails = [
  {
    icon: <User size={20} />,
    label: "పేరు",
    value: "డాక్టర్ మిరియాల రామకృష్ణ",
  },
  {
    icon: <Calendar size={20} />,
    label: "పుట్టిన తేదీ",
    value: "ఏప్రిల్ 7, 1934",
  },
  {
    icon: <Home size={20} />,
    label: "జన్మస్థానం",
    value: "తోలేరు, నరసాపురం దగ్గర, ప.గో. జిల్లా",
  },
  {
    icon: <MapPin size={20} />,
    label: "స్వంత ఊరు",
    value: "విరవాడ, పిఠాపురం దగ్గర, తూ.గో.జిల్లా",
  },
  {
    icon: <FileText size={20} />,
    label: "తల్లితండ్రులు",
    value: "మిరియాల వెంకటరత్నం, శ్రీమతి భ్రమరాంబ",
  },
  {
    icon: <Home size={20} />,
    label: "హైస్కూలు",
    value: "రాజారావ్ భావయమ్మారావ్ బహద్దూర్ హైస్కూల్, పిఠాపురం",
  },
   {
    icon: <Home size={20} />,
    label: "భాషాప్రవీణ-1956",
    value: "మహరాజా సంస్కృత పాఠశాల, విజయనగరం.",
  },
];

const lifeEvents = [
  "1956: పి.ఆర్. హైస్కూల్లో 6 నెలలు తెలుగు పండిట్ తాత్కాలిక ఉద్యోగం.",
  "1957: రాజమండ్రిలో పండిట్ ట్రైనింగ్.",
  "1957-58: కూనవరం ప్రభుత్వ ఉన్నత పాఠశాలలో తెలుగు పండిట్ ఉద్యోగం. శ్రీ సోమసుందర్, శ్రీ రాంషాలతో అనుబంధం మొదలైంది.",
  "1958-61: తరంగిణి పత్రిక నిర్వహణ, సంవత్సారానికి ఒక విడుదల.",
  "1960: హైదరాబాద్ అ.భా.తె. రచయితల సభలో కృష్ణశాస్త్రి, సి.నారాయణరెడ్డిగారి పరిచయం.",
  "1962: ఆంధ్ర విశ్వ కళాపరిషత్తు (ఆంధ్రాయూనివర్శిటీ) వైజాగ్లో 'ఏం.ఏ' చదువు. డా. యస్వీ జోగారావుగారి ప్రోత్సాహం.",
  "1964: అనంతపురంలో ఎం.ఏ తర్వాత తెలుగు పండిట్  ఉద్యోగం.",
  "1965 ఆగష్టు 17:న జోశ్యుల నరసింహారావు, సీతాదేవిల ప్రథమ కుమార్తె 'లక్ష్మీదేవి'తో వివాహం.",
  "1966: ‘బాలాభిరామం’ ప్రచురణ, శ్రీ తిలక్ తో పరిచయం.",
  "1966 జూన్ 27: కుమార్తె రమణీయ సుధారాణి జననం.",
  "1968 జూన్: తణుకు ట్రాన్స్ఫర్.",
  "1970: చిట్టూరి ఇంద్రయ్య కళాశాలలో ఉద్యోగం.",
  "1970 ఏప్రిల్ 23: కుమార్తె కమనీయ సుధాఫణి జననం.",
  "1970 మే 8: హైదరాబాద్ తెలుగు అకాడమీలో ఉద్యోగం.",
  "1973: డా.కె.వి.రావు, డా.పి.యన్.ఆర్. అప్పారావుతో ఆత్మీయత.",
  "1973: రాజోలులో ఉద్యోగం.",
  "1974 మార్చి: శ్రీశ్రీ కవిత్వం పై పరిశోధన ప్రారంభం.",
  "1974 అక్టోబర్: అఖిల భారత తెలుగు బాలల మహోత్సవాలలో పాల్గొనడం.",
  "1975 ఏప్రిల్: ప్రపంచ తెలుగు మహాసభలకు ఆహ్వాన సంఘసభ్యుడిగా చేరడం.",
  "1975: కాకినాడ పి.ఆర్. ప్రభుత్వ కళాశాలకు ట్రాన్స్ఫర్.",
  "1976 ఏప్రిల్ 4: ఆంధ్రప్రదేశ్ బాలల అకాడమీలో సభ్యుడిగా ఎన్నిక.",
  "1977 మార్చి 26: కుమారుడు శ్రీధర్ జననం.",
  "1977 డిసెంబర్20: థీసిస్ సబ్మిట్.",
  "1978 జూన్: మొదటి హార్ట్ టాక్.",
  "1984: కాకినాడ పోస్టల్ కాలనీలో స్వగృహ నిర్మాణం.",
  "1985 మే 30:ప్రముఖ రచయిత, అభిసారిక సంపాదకులు శ్రీ రాంషాగారి ద్వితీయ కుమారుడు అంబరీషతో ప్రథమ కుమార్తె డా॥ సుధారాణి వివాహం",
  "1985 డిసెంబర్: తణుకు  ట్రాన్స్ఫర్.",
  "1986 అక్టోబర్ 22: మనుమడు చి. రాంషా జననం.",
  "1989: రెండోసారి హార్ట్ అటాక్, కాకినాడ నుంచి రాజమంద్రి పి.జి. సెంటర్ ట్రాన్స్ఫర్.",
  "1992 ఏప్రిల్:  రిటైర్ అయ్యి కాకినాడ స్వగృహానికి మరలి వచ్చారు",
  "1994 ఫిబ్రవరి 27:ప్రముఖ రచయిత కందుకూరి రామభద్రరావుగారి మనుమడు, శ్రీ కందుకూరి పుండరీకాక్షుడుగారి తృతీయ కుమారుడు రాధామనోహర్ ద్వితీయ కుమార్తె చి॥ సుధాఫణి వివాహం.",
  "1995: మనుమరాలు నవ్యశృతి జననం.",
  "1995: శ్రీగొడవర్తి సత్యమూర్తి పక్షపత్రిక ‘గీతాంజలి’ సంపాదకత్వ బాధ్యతలు.",
  "1999: మూడో హార్ట్ అటాక్, హైద్రాబాద్ చికిత్స.",
  "2002 మే: హైదరాబాదు మోతీనగర్ కి నివాసం మార్చడం.",
  "2004 జనవరి 29: మధ్యాహ్నం 1:15 స్వర్గస్థులయ్యారు.",
];
const writings = [
  "1965 - బాలాభిరామం",
  "1970 - రంగురంగుల రత్నదీపాలు",
  "1972 - స్నేహదేహళి",
  "1978 - ముత్యాలగొడుగు",
  "1981 - విద్యుద్వీణలు-వెన్నెలతీగలు",
  "1989 - దేశంమేలుకొంది",
  "1997 - సువర్ణస్వప్నం",
  "1998 - వివేకపట్టణం - కవిత్వం",
  "1980 - శ్రీశ్రీ కవిత్వం - వస్తువు, సంవిధానం",
  "1980 - శ్రీశ్రీ కవితావైభవం",
  "1996 - భావయిత్రి- కారయిత్రి",
  "1996 - సోమసుందర్ కవితా పరిణామం",
  "2002 - సినారె కవితా బింబం - విమర్శ",
  "1976 - సాహిత్య పదకోశం (తెలుగు అకాడెమీ ప్రచురణ)",
  "1984 - తెలుగు వాచకం (2వ తరగతి)",
  "1984 - దీపస్థంబాలు (10వ తరగతి తెలుగు ఉపవాచకం)",
  "1986 - శ్రీశ్రీగారితో నా అనుబంధం",
  "1993 - పర్యాటకుడి డైరీ (ఉదయం సప్లిమెంట్)",
  "2002 - ఆరుద్రాక్షరం (ఎపిగ్రామ్‌లు)",
  "1989 - శ్రీశ్రీ ప్రపంచం క్విజ్ (స్వాతి వీక్లీ)",
  "2002 - రచన-రసన ఫీచర్ (నానాగాథలు - ప్రజాశక్తి)",
];

const awards = [
  "1965 - దక్షిణ భాషా పుస్తక సమితి అవార్డు",
  "1970 - జాతీయ అవార్డు",
  "1978 - బెస్ట్ థీసీస్ అవార్డు, ఆంధ్రాయూనివర్శిటీ",
  "1989 - ఉత్తమ టీచర్ అవార్డు",
  "1995 - శ్రీ ఎన్.టి. రామారావు జన్మదినోత్సవ జిల్లా కళానీరాజనం పురస్కారం",
  "2002 - సోమసుందర్ సాహిత్య ట్రస్ట్ అవార్డ్",
];

// సాహిత్య విమర్శలు, పరిశోధనలు & తెలుగు భాష గురించి డేటా
const literaryResearch = [
  `మిరియాల రామకృష్ణ శ్రీశ్రీ సాహిత్యంపై పరిశోధన చేసి డాక్టరేట్ సాధించాడు. ఈ పుస్తకంపై ఆంధ్రజ్యోతి పత్రికలో పురాణం సుబ్రహ్మణ్య శర్మ "శ్రీశ్రీకి మిరియాల కషాయం" పేరుతో ఏడు వారాల సీరియల్ విమర్శలు రాశాడు. మహాప్రస్థానంలోని పదాలకు సరిపడని వ్యాఖ్యానాలు, లేని సారస్వాలు లాగుతూ రాశాడని విమర్శ. రామకృష్ణకు ఈ రచనకు డాక్టరేట్ వచ్చినప్పుడు శ్రీశ్రీ "డియర్ డాక్టర్ రామకృష్ణా! హార్టీ కంగ్రాచ్యులేషన్స్. యువర్స్ పేషెంట్లీ శ్రీశ్రీ" అంటూ సందేశం పంపి చమత్కరించాడు.`,
];

const teluguLanguagePoem = [
  `సంస్కృతంబులోని చక్కెర పాకంబు  
అరవ భాషలోని అమృత రాశి  
కన్నడంబులోని కస్తూరి వాసన  
కలిసిపోయె తేట తెలుగునందు ! 

ఉగ్గుపాలనుండి ఉయ్యాలలోననుండి  
అమ్మ పాట పాడినట్టి భాష  
తేనెవంటి మందు వీనులకును విందు  
దేశభాషలందు తెలుగులెస్స!  

వేనవేల కవుల వెలుగులో రూపొంది  
దేశదేశములను వాసిగాంచి  
వేయి యేండ్లనుండి విలసిల్లు నా “భాష”  
దేశ భాషలందు తెలుగు లెస్స!`,
];


const authorInfo = [
  `మిరియాల రామకృష్ణ తెలుగు రచయిత, పరిశోధకుడు. ఇతను సుమారు 36 సంవత్సరాలు విద్యాశాఖలో తెలుగు భాషా సాహిత్యాలు బోధిస్తూ, మహాకవి శ్రీశ్రీ రచనలపై పరిశోధన చేశాడు. కొంతమంది పరిశోధన అతిగా సాగిందని విమర్శించారు.`,
  `ఇతను రచించిన కథల్లో ఆకుపచ్చని కుక్కపిల్ల, ఆశ్చర్య చూడామణి, చెరసాలలో సరస్వతి, ఉంగరం వంటి గొప్ప కథలు ఉన్నాయి.`,
  `కథలతో పాటు పద్యాలు, వచన కవితలు, గేయాలు, వ్యాసాలు, బాలసాహిత్యం విస్తృతంగా వ్రాసాడు.`,
  `సుధాకిరణ్, ఆనందవర్ధన్ వంటి పత్రికలతో కలసి రచనలు ప్రచురణలో ఉన్నాయి.`,
  `1995-96లో గీతాంజలి పత్రికకి సంపాదకుడు గా పని చేశాడు.`,
  `హిమబిందు అకాడమీ ఆఫ్ ఆర్ట్స్ అండ్ లిటరేచర్ సంస్థను స్థాపించి, మంచి రచనల కోసం అవార్డులు ఇచ్చుతూ రచయితలను ప్రోత్సహిస్తున్నాడు.`,
];

export default function MiryalaLifeJourney() {
  const formatShareText = () => {
    let text = "మిరియాల రామకృష్ణ గారి జీవిత ప్రస్థానం\n\n";
    text += "*వ్యక్తిగత వివరాలు*:\n";
    personalDetails.forEach(({ label, value }) => {
      text += `${label}: ${value}\n`;
    });
    text += `\n*రచయిత, పరిశోధకుడు వివరాలు*:\n`;
    authorInfo.forEach(line => {
      text += `${line}\n`;
    
    });
    text += `\n*సాహిత్య విమర్శలు,పరిశోధనలు*:\n`;
    literaryResearch.forEach(line => {
      text += `${line}\n`;
    
    });
    text += `\n *తెలుగు భాష గురించి*:\n`;
    teluguLanguagePoem.forEach(line => {
      text += `${line}\n`;
    });
    
text += `\n *రచనలు*:\n`;
    writings.forEach(line => {
      text += `${line}\n`;
    });
    text += `\n *పురస్కారాలు *:\n`;
    awards.forEach(line => {
      text += `${line}\n`;
    });
    return text;
  };

  const handleWhatsAppShare = async () => {
  try {
    const shareText = formatShareText();
    alert(shareText.length);
    await navigator.clipboard.writeText(shareText);
    const encodedText = encodeURIComponent(shareText);
    // వెంటనే విండో ఓపెన్ చేయండి
    window.open(`https://wa.me/?text=${encodedText}`, "_blank");
  } catch (error) {
    alert("పంచుకునే విషయం ప్రతిలిపి చేయడంలో విఫలమైంది.");
    console.error(error);
  }
};


  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: "bold" }}>
        మిరా ప్రస్థానం
      </Typography>

      {/* Personal Details */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            వ్యక్తిగత వివరాలు
          </Typography>
          <List>
            {personalDetails.map(({ icon, label, value }) => (
              <ListItem key={label}>
                <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: "semibold" }}>{label}:</Typography>}
                  secondary={value}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
{/* Author Info Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            రచయిత & పరిశోధకుడు
          </Typography>
          {authorInfo.map((info, idx) => (
            <Typography key={idx} variant="body1" paragraph>{info}</Typography>
          ))}
        </CardContent>
      </Card>
    

     {/* Literary Research Section */}
<Card sx={{ mb: 4 }}>
  <CardContent>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
      సాహిత్య విమర్శలు, పరిశోధనలు
    </Typography>
    <Typography variant="body1" paragraph>
      {literaryResearch[0]}
    </Typography>
  </CardContent>
</Card>

{/* Telugu Language Section */}
<Card sx={{ mb: 4 }}>
  <CardContent>
    <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
      తెలుగు భాష గురించి
    </Typography>
    <Typography component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
      {teluguLanguagePoem[0]}
    </Typography>
  </CardContent>
</Card>

      {/* Writings */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            రచనలు: {writings.length}
          </Typography>
          <List>
            {writings.map((work, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <Book size={16} />
                </ListItemIcon>
                <ListItemText primary={work} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Awards */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            పురస్కారాలు: {awards.length}
          </Typography>
          <List>
            {awards.map((award, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <Award size={16} />
                </ListItemIcon>
                <ListItemText primary={award} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
  {/* Life Events */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            జీవితం ముఖ్య సంఘటనలు
          </Typography>
          <List>
            {lifeEvents.map((event, i) => (
              <ListItem key={i}>
                <ListItemIcon>
                  <Calendar size={16} />
                </ListItemIcon>
                <ListItemText primary={event} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
      {/* WhatsApp Share Button */}
      <Box textAlign="center" sx={{ mt: 4 }}>
        <Button variant="contained" color="success" onClick={handleWhatsAppShare}>
          వాట్సాప్ ద్వారా పంచుకోండి
        </Button>
      </Box>
    </Container>
  );
}
