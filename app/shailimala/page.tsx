// app/shailimala/page.tsx
import fs from 'fs';
import path from 'path';
import ShailimalaTabs from '@/app/components/ShailimalaTabs';

async function getTeluguFonts(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), 'public', 'Fonts');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((name) => {
      const ext = path.extname(name).toLowerCase();
      return ext === '.ttf' || ext === '.otf';
    });
  } catch (err) {
    console.error('Fonts directory read error:', err);
    return [];
  }
}

async function getMalaBooks(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), 'public', 'books');
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((name) =>
      name.endsWith('.pdf') || name.endsWith('.epub')
    );
  } catch (err) {
    console.error('Books directory read error:', err);
    return [];
  }
}

export default async function ShailimalaPage() {
  const fontFiles = await getTeluguFonts();
  const bookFiles = await getMalaBooks();

  return (
    <main className="min-h-screen bg-[#faf9f5] text-slate-800 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">

        {/* Quote banner */}
        

        {/* Page header */}
        <header className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              శైలిమాల
            </h1>
           
          </div>

          <div className="text-slate-600 text-sm sm:text-base leading-relaxed space-y-2">
            <p>
              డిజిటల్ విప్లవంతో తెలుగు యూనికోడ్ ఫాంట్లు ప్రింట్ మరియు ఆన్‌లైన్‌లో అందుబాటులో ఉన్నాయి.{' '}
              <span className="font-medium text-slate-800">FreeTeluguFonts.com</span> మన తెలుగు ప్రజలకు
              యూనికోడ్ ఫాంట్‌లను అందించడం లక్ష్యంగా పెట్టుకుంది.
            </p>
          </div>

          {/* Thanks note */}
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 leading-relaxed">
           తెలుగు లిపికి ఆధునిక యూనికోడ్ ఓపెన్‌టైప్
            సాంకేతికతను జోడించి ఉచితంగా అందించిన{' '}
            <strong>అప్పాజీ అంబరీష గారికి</strong> మరియు ఇతర ఫాంట్ రూపకర్తలకు 'రత్నాలబాల–జ్ఞానమాల' టీమ్
            తరపున హృదయపూర్వక ధన్యవాదాలు.
          </div>
        </header>

        {/* Tabs + table */}
        <ShailimalaTabs initialFonts={fontFiles} initialBooks={bookFiles} />

      </div>
    </main>
  );
}