import React from "react";

export const TeluguOcrExplanation: React.FC = () => {
  return (
    <section className="p-6 bg-gray-50 dark:bg-gray-900 rounded-md shadow-md max-w-4xl mx-auto">
      
      {/* TITLE */}
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        లిపిమాల – తెలుగు OCR
      </h2>

      {/* INTRO */}
      <p
        className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300"
        style={{ whiteSpace: "pre-line" }}
      >
        {`లిపిమాల అనేది తెలుగు భాషకు రూపొందించిన OCR (Optical Character Recognition) ఆధారిత సాధనం. 
ఇది చిత్రాలు లేదా పత్రాలలో ఉన్న తెలుగు అక్షరాలను స్వయంచాలకంగా గుర్తించి, చదవదగిన డిజిటల్ టెక్స్ట్‌గా మార్చుతుంది.

టైపింగ్ చేయాల్సిన అవసరం లేకుండా, నేరుగా చిత్రం నుంచి తెలుగు పాఠ్యాన్ని పొందవచ్చు.`}
      </p>

      {/* WHY */}
      <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
        లిపిమాల ఎందుకు ఉపయోగపడుతుంది?
      </h3>

      <ul className="list-disc list-inside text-gray-800 dark:text-gray-300 leading-relaxed mb-4">
        <li>📚 పాత పుస్తకాలు, పత్రాలను డిజిటల్‌గా మార్చడానికి</li>
        <li>✍️ చేతిరాత లేదా ముద్రిత తెలుగు పాఠ్యాన్ని టెక్స్ట్‌గా పొందడానికి</li>
        <li>🎓 విద్యార్థులు, రచయితలు, పరిశోధకులకు సహాయంగా</li>
        <li>💻 టైపింగ్ కష్టం లేకుండా వేగంగా పని చేయడానికి</li>
      </ul>

      {/* EXAMPLE */}
      <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
        ఒక ఉదాహరణ
      </h3>

      <p
        className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300"
        style={{ whiteSpace: "pre-line" }}
      >
        {`మీ వద్ద ఒక పాత తెలుగు పుస్తకం పేజీ ఫోటో ఉంది అనుకోండి.
ఆ చిత్రాన్ని లిపిమాలలో అప్‌లోడ్ చేస్తే, అందులోని పద్యాలు లేదా వాక్యాలు వెంటనే డిజిటల్ టెక్స్ట్‌గా మారతాయి.

ఆ టెక్స్ట్‌ను మీరు:
• సవరించవచ్చు
• ఫాంట్ మార్చవచ్చు
• చిత్రంగా మార్చవచ్చు
• భవిష్యత్తులో ఉపయోగించేందుకు భద్రపరచుకోవచ్చు`}
      </p>

      {/* HOW TO USE */}
      <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
        ఎలా ఉపయోగించాలి? (How to use it)
      </h3>

      <ul className="list-disc list-inside text-gray-800 dark:text-gray-300 leading-relaxed">
        <li>📸 ముందుగా చిత్రం లేదా పత్రాన్ని అప్‌లోడ్ చేయండి.</li>
        <li>🔍 “OCR విశ్లేషణ” బటన్‌ను నొక్కండి.</li>
        <li>✍️ చిత్రంలోని తెలుగు అక్షరాలు టెక్స్ట్‌గా మారతాయి.</li>
        <li>🛠️ అవసరమైతే టెక్స్ట్‌ను స్వయంగా సవరించండి.</li>
        <li>🎨 అక్షర శైలి, పరిమాణం, వరుస అంతరం మార్చుకోండి.</li>
        <li>🖼️ సరిచేసిన టెక్స్ట్‌ను చిత్రంగా డౌన్‌లోడ్ చేసుకోండి.</li>
      </ul>

      {/* FOOTER */}
      <p className="text-sm mt-6 text-gray-700 dark:text-gray-400">
        ✨ లిపిమాల ద్వారా తెలుగు పాఠ్యాన్ని సులభంగా, వేగంగా, ఖచ్చితంగా డిజిటల్ రూపంలోకి మార్చవచ్చు.
      </p>
    </section>
  );
};
