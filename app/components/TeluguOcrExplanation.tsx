import React from "react";

export const TeluguOcrExplanation: React.FC = () => {
  return (
    <section className="telugu-explanation p-6 bg-gray-50 dark:bg-gray-900 rounded-md shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        పఠనం
      </h2>

      <p
        className="mb-4 leading-relaxed text-gray-800 dark:text-gray-300"
        style={{ whiteSpace: "pre-line" }}
      >
        {`పఠనం అనగా చదివిన విషయాన్ని అర్థంతో గ్రహించడం. ఇది కేవలం అక్షరాలను గుర్తించడం మాత్రమే కాక, వాటి అర్థాన్ని తెలుసుకోవడమే ప్రధాన ఉద్దేశ్యం. అక్షరానుసారంగా చదవడం అనేది కేవలం పదాల ఉచ్చారణ కాదు; వాటి ద్వారా వచ్చే జ్ఞానాన్ని అవగాహన చేయడమే నిజమైన పఠనం.

నిజమైన పఠనం అనగా అక్షరసూత్రాన్ని పాటిస్తూ, అర్థపూర్వకంగా చదవడం. అందుకే శాస్త్రాలు, గ్రంథాలు వంటి వాటిలో అక్షరానుసారంగా జరిగే పఠనం మూలార్థాన్ని కాపాడుతుంది.

ఆధునిక కాలంలో డిజిటల్ పఠనానికి ఆప్టికల్ క్యారెక్టర్ రికగ్నిషన్ (OCR) సాంకేతికత ఎంతో ఉపయుక్తంగా మారింది. OCR ద్వారా అక్షరాలను ఖచ్చితంగా గుర్తించి, పఠనీయమైన టెక్స్ట్‌గా మార్చవచ్చు. ఇది యథాక్షర పఠనానికి ఆధునిక సాధనం.`}
      </p>

      {/* HOW TO USE */}
      <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-white">
        ఎలా ఉపయోగించాలి? (How to use it)
      </h3>

      <ul
        className="list-disc list-inside text-gray-800 dark:text-gray-300 leading-relaxed"
        style={{ whiteSpace: "pre-line" }}
      >
        <li>📸 ముందుగా చిత్రం లేదా పత్రాన్ని అప్‌లోడ్ చేయండి.</li>
        <li>🔍 “OCR విశ్లేషణ” బటన్‌ను నొక్కండి.</li>
        <li>✍️ చిత్రంలోని తెలుగు అక్షరాలు వెంటనే టెక్స్ట్‌గా మారతాయి.</li>
        <li>🛠️ అవసరమైతే OCR చేసిన టెక్స్ట్‌ను మీరు స్వయంగా సవరించండి.</li>
        <li>🎨 అక్షర శైలి, పరిమాణం, వరుస అంతరం మార్చుకోండి.</li>
        <li>🖼️ సరిచేసిన టెక్స్ట్‌ను చిత్రంగా డౌన్‌లోడ్ చేసుకోండి.</li>
      </ul>

      <p
        className="text-sm mt-4 text-gray-700 dark:text-gray-400"
      >
        ✨ లిపిమాల ద్వారా టైపింగ్ అవసరం లేకుండా తెలుగు పాఠ్యాన్ని సులభంగా డిజిటల్ రూపంలోకి మార్చవచ్చు.
      </p>
    </section>
  );
};
