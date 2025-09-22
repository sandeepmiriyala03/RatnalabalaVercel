"use client";

import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Calendar,
  User,
  Home,
  Book,
  Award,
  Heart,
  MapPin,
  FileText,
} from "react-feather";

const personalDetails = [
  {
    icon: <User size={20} />,
    label: "పేరు",
    value: "డాక్టర్ మిరియాల రామకృష్ణారావు",
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
    value: "విరవాడ, పిఠాపురం దగ్గిర, తూ.గో.జిల్లా",
  },
];

const lifeEvents = [
  `1956: భాషాప్రవీణ, మహరాజా సంస్కృత పాఠశాల, విజయనగరం.`,
  `1956: పి.ఆర్. హైస్కూల్లో 6 నెలలు తెలుగు పండిట్గా తాత్కాలిక ఉద్యోగం.`,
  `1965 ఆగష్టు 17: వివాహం - జోశ్యుల నరసింహారావు, సీతాదేవిల కుమార్తె లక్ష్మీదేవితో.`,
  `1974 మార్చి: శ్రీశ్రీ కవిత్వం మీద పరిశోధన ప్రారంభం.`,
  `1978: మొదటి హార్ట్ టాక్ అస్వస్థత.`,
  `1992: రిటైర్ అయ్యారు.`,
  `2004 జనవరి 29: స్వర్గస్థులయ్యారు.`,
];

const writings = [
  "బాలాభిరామం (1965)",
  "రంగురంగుల రత్నదీపాలు (1970)",
  "స్నేహదేహళి (1972)",
  "ముత్యాలగొడుగు (1978)",
  "విద్యుద్వీణలు-వెన్నెలతీగలు (1981)",
  "దేశంమేలుకొంది (1989)",
  "సువర్ణస్వప్నం (1997)",
  "వివేకపట్టణం (1998)",
  "శ్రీశ్రీ కవిత్వం - వస్తువు, సంవిధానం (1980)",
  "సాహిత్య పదకోశం (తెలుగు అకాడెమీ ప్రచురణ 1976)",
];

const awards = [
  "దక్షిణ భాషా పుస్తక సమితి అవార్డు 1965",
  "జాతీయ అవార్డు 1970",
  "బెస్ట్ థీసీస్ అవార్డు, ఆంధ్రాయూనివర్శిటీ 1978",
  "ఉత్తమ టీచర్ అవార్డు 1989",
  "శ్రీ ఎన్.టి. రామారావు జన్మదినోత్సవ జిల్లా కళానీరాజనం పురస్కారం 1995",
  "సోమసుందర్ సాహిత్య ట్రస్ట్ అవార్డ్ 2002",
];

export default function MiryalaLifeJourney() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: "bold" }}>
        శ్రీ మిరియాల రామకృష్ణ గారి జీవిత ప్రస్థానం
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
                  primary={
                    <Typography sx={{ fontWeight: "semibold" }}>
                      {label}:
                    </Typography>
                  }
                  secondary={value}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Life Events */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            జీవితం - ముఖ్య సంఘటనలు
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

      {/* Writings */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "medium" }}>
            ప్రముఖ రచనలు
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
            పురస్కారాలు
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
    </Container>
  );
}
