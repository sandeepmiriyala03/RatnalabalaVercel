"use client";

/* ═══════════════════════════════════════════════════════════════
   మా కవులు — 2. డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు (మిరా)
   RatnalabalaBackground తో ఒకే రూపం; రంగు బంగారు-గోధుమ (.is-gold)
   Inline styles లేవు — globals.css §12
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Button, Chip } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function MiraIntro() {
  return (
    <article className="rb-card rb-card--flex rb-card--top-gold rb-poet is-gold" aria-labelledby="poet-mira">
      <div className="rb-poet__head">
        <span className="rb-avatar" aria-hidden>
          మిరా
        </span>
        <div>
          <h3 id="poet-mira" className="rb-poet__name">
            డాక్టర్ శ్రీ మిరియాల రామకృష్ణ గారు
          </h3>
          <p className="rb-poet__meta">రచయిత · పరిశోధకుడు · ఉపాధ్యాయుడు</p>
        </div>
      </div>

      <blockquote className="rb-pullquote">
        <p className="rb-pullquote__text">36 ఏళ్ళు తెలుగు నేర్పిన గురువు</p>
        <p className="rb-pullquote__by">మహాకవి శ్రీశ్రీ కవిత్వంపై పరిశోధన</p>
      </blockquote>

      <p className="rb-poet__about">ప్రముఖ తెలుగు రచయిత, పండితుడు. కథలు, పద్యాలు, బాలసాహిత్యం ద్వారా తెలుగు సాహిత్యానికి విశేష సేవలందించారు.</p>

      <ul className="rb-chips" aria-label="ముఖ్యాంశాలు">
        {["శ్రీశ్రీ పరిశోధన", "కథలు, పద్యాలు", "బాలసాహిత్యం"].map((t) => (
          <li key={t}>
            <Chip label={t} className="rb-chip" />
          </li>
        ))}
      </ul>

      <span className="rb-spacer" />

      <div className="rb-row rb-row--stack-xs">
        <Button component={Link} href="/mirapoems" endIcon={<ArrowForwardRoundedIcon />} className="rb-btn rb-btn--ink">
          📖 పద్యాలు చదవండి
        </Button>
        <Button component={Link} href="/mira" className="rb-btn rb-btn--outline-gold">
          📜 వారి ప్రస్థానం
        </Button>
      </div>
    </article>
  );
}
