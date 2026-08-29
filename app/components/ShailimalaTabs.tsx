'use client';

import React, { useState, useEffect } from 'react';

interface ShailimalaTabsProps {
  initialFonts: string[];
  initialBooks: string[];
}

export default function ShailimalaTabs({ initialFonts, initialBooks }: ShailimalaTabsProps) {
  const [activeTab, setActiveTab] = useState<'Fonts' | 'books'>('Fonts');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    setIsDesktop(!/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua));
  }, []);

  const formatToMalaName = (filename: string) => {
    const dot = filename.lastIndexOf('.');
    if (dot === -1) return `${filename}Mala`;
    const name = filename.substring(0, dot);
    const ext = filename.substring(dot);
    return name.toLowerCase().endsWith('mala') ? filename : `${name}Mala${ext}`;
  };

  const getBaseName = (filename: string) => {
    const dot = filename.lastIndexOf('.');
    return dot === -1 ? filename : filename.substring(0, dot);
  };

  const getExt = (filename: string) => {
    const dot = filename.lastIndexOf('.');
    return dot === -1 ? '' : filename.substring(dot + 1).toLowerCase();
  };

  /* Downloading the raw file works fine on mobile browsers — this used
     to bail out entirely on mobile (`if (!isDesktop) return`), which
     was blocking something that actually works. What genuinely differs
     by platform is INSTALLING the downloaded file as a system font
     afterwards, which is an OS-level step outside any website's
     control — desktop makes that a double-click, stock Android/iOS
     don't offer an equivalent. The note below the tabs explains that
     honestly instead of the download button silently doing nothing. */
  const handleSingleDownload = (originalName: string, folder: 'Fonts' | 'books') => {
    const finalName = folder === 'Fonts' ? formatToMalaName(originalName) : originalName;
    const link = document.createElement('a');
    link.href = `/${folder}/${originalName}`;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* Rebuilt to produce an actual ZIP (via the same jszip library the
     rest of the app's bulk-download components already use), instead
     of the previous version which concatenated every file's raw bytes
     into one Blob and gzipped THAT — producing a ".tar.gz" that was
     not a real tar archive and could not be extracted back into
     individual usable fonts, on any platform. */
  const handleBulkDownload = async (files: string[], folder: 'Fonts' | 'books', archiveName: string) => {
    setIsDownloadingAll(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      await Promise.all(
        files.map(async (f) => {
          const res = await fetch(`/${folder}/${f}`);
          if (!res.ok) throw new Error(`Failed to fetch ${f}`);
          const blob = await res.blob();
          const entryName = folder === 'Fonts' ? formatToMalaName(f) : f;
          zip.file(entryName, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${archiveName}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Bulk download error:', err);
      alert('డౌన్‌లోడ్ లో లోపం వచ్చింది. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (isDesktop === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--muted-text)', fontSize: 14 }}>
        <svg className="animate-spin" style={{ width: 16, height: 16, marginRight: 8 }} viewBox="0 0 24 24" fill="none">
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        పరిశీలిస్తోంది...
      </div>
    );
  }

  const files = activeTab === 'Fonts' ? initialFonts : initialBooks;
  const archiveName = activeTab === 'Fonts' ? 'Shailimala_Fonts' : 'Gnyanamala_Books';

  const DownloadIcon = () => (
    <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );

  const SpinnerIcon = () => (
    <svg style={{ width: 14, height: 14 }} className="animate-spin" viewBox="0 0 24 24" fill="none">
      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  return (
    <div>
      {/* Informational note, not a hard block — downloading works on
          every device; only the "install as a system font" step after
          downloading is desktop-only, and that's a genuine OS
          limitation this code can't remove. */}
      {!isDesktop && activeTab === 'Fonts' && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            background: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <svg
            style={{ width: 20, height: 20, color: 'var(--accent-text)', flexShrink: 0, marginTop: 2 }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: 14, margin: 0 }}>
              ఫాంట్ ఫైల్ డౌన్‌లోడ్ అవుతుంది
            </p>
            <p style={{ color: 'var(--muted-text)', fontSize: 12, marginTop: 4, lineHeight: 1.5, marginBottom: 0 }}>
              మీ ఫోన్‌లో ఫైల్ డౌన్‌లోడ్ అవుతుంది, కానీ దాన్ని సిస్టమ్ ఫాంట్‌గా వాడుకోవడానికి
              మీ ఫోన్‌లో ఒక ఫాంట్ ఇన్‌స్టాలర్ యాప్ అవసరం కావచ్చు — ఇది ఫోన్ తయారీదారుని బట్టి
              మారుతుంది. కంప్యూటర్‌లో అయితే డౌన్‌లోడ్ అయిన ఫైల్‌ను తెరిచి నేరుగా ఇన్‌స్టాల్ చేసుకోవచ్చు.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {(['Fonts', 'books'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'Fonts' ? 'తెలుగు ఖతులు' : 'సాహిత్య గ్రంథాలు';
          const count = tab === 'Fonts' ? initialFonts.length : initialBooks.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 500,
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: -1,
                background: 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--muted-text)',
                cursor: 'pointer',
                transition: 'color 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {tab === 'Fonts' ? (
                <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 20V4l8 16V4" /><line x1="6" y1="12" x2="14" y2="12" />
                  <path d="M19 7v13M16 7h6" />
                </svg>
              ) : (
                <svg style={{ width: 16, height: 16, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              )}
              {label}
              <span
                style={{
                  fontSize: 12,
                  padding: '1px 8px',
                  borderRadius: 20,
                  fontWeight: 500,
                  background: isActive ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'var(--surface)',
                  color: isActive ? 'var(--primary)' : 'var(--muted-text)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
            {activeTab === 'Fonts' ? 'శైలిమాల కలెక్షన్' : 'జ్ఞానమాల గ్రంథాలు'}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted-text)', marginTop: 2, marginBottom: 0 }}>
            {activeTab === 'Fonts'
              ? 'విడిగా లేదా అన్నింటినీ ఒకే ప్యాకేజీగా డౌన్‌లోడ్ చేసుకోవచ్చు.'
              : 'సాహిత్య గ్రంథాల సంకలనాన్ని వీక్షించవచ్చు లేదా డౌన్‌లోడ్ చేసుకోవచ్చు.'}
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => handleBulkDownload(files, activeTab, archiveName)}
            disabled={isDownloadingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: isDownloadingAll ? 'var(--surface)' : 'var(--primary)',
              color: isDownloadingAll ? 'var(--muted-text)' : 'var(--background)',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDownloadingAll ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {isDownloadingAll ? <SpinnerIcon /> : <DownloadIcon />}
            {isDownloadingAll ? 'సిద్ధమవుతోంది...' : 'అన్నీ డౌన్‌లోడ్ చేయి'}
          </button>
        )}
      </div>

      {/* Table */}
      {files.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '56px 24px',
            color: 'var(--muted-text)',
            fontSize: 14,
            border: '2px dashed var(--border)',
            borderRadius: 12,
          }}
        >
          {activeTab === 'Fonts' ? 'ఫోల్డర్‌లో ఫాంట్ ఫైళ్లు ఏవీ లభించలేదు.' : 'ఫోల్డర్‌లో గ్రంథాల ప్రతులు ఏవీ లభించలేదు.'}
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border-strong)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table head */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 60px',
              background: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              padding: '8px 12px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--muted-text)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            <div>#</div>
            <div>{activeTab === 'Fonts' ? 'ఖతువు పేరు' : 'గ్రంథం పేరు'}</div>
            <div style={{ textAlign: 'center' }}>డౌన్‌లోడ్</div>
          </div>

          {files.map((file, index) => {
            const displayName = activeTab === 'Fonts' ? formatToMalaName(file) : file;
            const base = getBaseName(displayName);
            const ext = getExt(displayName);
            return (
              <div
                key={file}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 60px',
                  alignItems: 'center',
                  padding: '10px 12px',
                  fontSize: 14,
                  borderBottom: index < files.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--muted-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {index + 1}
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                    color: 'var(--foreground)',
                  }}
                >
                  {base}
                  <span style={{ color: 'var(--muted-text)', fontFamily: 'monospace', fontSize: 12, marginLeft: 2 }}>
                    .{ext}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleSingleDownload(file, activeTab)}
                    title={`Download ${displayName}`}
                    aria-label={`Download ${displayName}`}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border-strong)',
                      background: 'transparent',
                      color: 'var(--muted-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'color-mix(in srgb, var(--primary) 10%, transparent)';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-text)';
                    }}
                  >
                    <DownloadIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}