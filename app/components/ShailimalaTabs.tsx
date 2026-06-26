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

  const handleSingleDownload = (originalName: string, folder: 'Fonts' | 'books') => {
    if (!isDesktop) return;
    const finalName = folder === 'Fonts' ? formatToMalaName(originalName) : originalName;
    const link = document.createElement('a');
    link.href = `/${folder}/${originalName}`;
    link.setAttribute('download', finalName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = async (files: string[], folder: 'Fonts' | 'books', archiveName: string) => {
    if (!isDesktop) return;
    setIsDownloadingAll(true);
    try {
      const blobs = await Promise.all(
        files.map(async (f) => {
          const res = await fetch(`/${folder}/${f}`);
          if (!res.ok) throw new Error(`Failed to fetch ${f}`);
          return res.blob();
        })
      );
      const combined = new Blob(blobs, { type: 'application/octet-stream' });
      const cs = new CompressionStream('gzip');
      const compressed = new Response(combined.stream().pipeThrough(cs));
      const blob = await compressed.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${archiveName}.tar.gz`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Bulk download error:', err);
      alert('డౌన్‌లోడ్ లో లోపం వచ్చింది. మళ్ళీ ప్రయత్నించండి.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (isDesktop === null) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
        <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );

  return (
    <div>
      {/* Mobile restriction banner */}
      {!isDesktop && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <svg style={{ width: 20, height: 20, color: '#ef4444', flexShrink: 0, marginTop: 2 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div>
            <p style={{ fontWeight: 600, color: '#991b1b', Fontsize: 14, margin: 0 }}>Desktop required</p>
            <p style={{ color: '#b91c1c', Fontsize: 12, marginTop: 4, lineHeight: 1.5, marginBottom: 0 }}>
              Downloads only work in desktop browsers. Please open this page on a computer.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
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
                Fontsize: 14,
                fontWeight: 500,
                border: 'none',
                borderBottom: isActive ? '2px solid #4f46e5' : '2px solid transparent',
                marginBottom: -1,
                background: 'transparent',
                color: isActive ? '#4f46e5' : '#64748b',
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
                  Fontsize: 12,
                  padding: '1px 8px',
                  borderRadius: 20,
                  fontWeight: 500,
                  background: isActive ? '#e0e7ff' : '#f1f5f9',
                  color: isActive ? '#4338ca' : '#94a3b8',
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
          <h3 style={{ Fontsize: 15, fontWeight: 600, color: '#0f172a', margin: 0 }}>
            {activeTab === 'Fonts' ? 'శైలిమాల కలెక్షన్' : 'జ్ఞానమాల గ్రంథాలు'}
          </h3>
          <p style={{ Fontsize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 0 }}>
            {activeTab === 'Fonts'
              ? 'విడిగా లేదా అన్నింటినీ ఒకే ప్యాకేజీగా డౌన్‌లోడ్ చేసుకోవచ్చు.'
              : 'సాహిత్య గ్రంథాల సంకలనాన్ని వీక్షించవచ్చు లేదా డౌన్‌లోడ్ చేసుకోవచ్చు.'}
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => handleBulkDownload(files, activeTab, archiveName)}
            disabled={!isDesktop || isDownloadingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: (!isDesktop || isDownloadingAll) ? '#e2e8f0' : '#4f46e5',
              color: (!isDesktop || isDownloadingAll) ? '#94a3b8' : '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              Fontsize: 13,
              fontWeight: 500,
              cursor: (!isDesktop || isDownloadingAll) ? 'not-allowed' : 'pointer',
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
            color: '#94a3b8',
            Fontsize: 14,
            border: '2px dashed #e2e8f0',
            borderRadius: 12,
          }}
        >
          {activeTab === 'Fonts' ? 'ఫోల్డర్‌లో ఫాంట్ ఫైళ్లు ఏవీ లభించలేదు.' : 'ఫోల్డర్‌లో గ్రంథాల ప్రతులు ఏవీ లభించలేదు.'}
        </div>
      ) : (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Table head */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 60px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              padding: '8px 12px',
              Fontsize: 11,
              fontWeight: 600,
              color: '#94a3b8',
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
                  Fontsize: 14,
                  borderBottom: index < files.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
              >
                <div style={{ Fontsize: 12, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                  {index + 1}
                </div>
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: 8,
                    color: '#1e293b',
                  }}
                >
                  {base}
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace', Fontsize: 12, marginLeft: 2 }}>
                    .{ext}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={() => handleSingleDownload(file, activeTab)}
                    disabled={!isDesktop}
                    title={`Download ${displayName}`}
                    aria-label={`Download ${displayName}`}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: isDesktop ? 'pointer' : 'not-allowed',
                      opacity: isDesktop ? 1 : 0.35,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDesktop) return;
                      (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#c7d2fe';
                      (e.currentTarget as HTMLButtonElement).style.color = '#4f46e5';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                      (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
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