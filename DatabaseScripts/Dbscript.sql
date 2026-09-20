-- ============================================================
-- YuktishaalaaAI - Ratnalabala
-- PostgreSQL FINAL Database Script (drop + recreate + load)
-- Result: 2 poets, 39 poems (poem_id 1..39)
--   poem_id 1-36  : poet_id 1 - Miriyala Venkataratnam - రత్నాల బాల (36 poems, book order)
--   poem_id 37-39 : poet_id 2 - Dr. Miriyala Ramakrishna (తెలుగు భాష, తెలుగులెస్స, తేటతెలుగు)
-- ============================================================

BEGIN;

-- ============================================================
-- 0. DROP OLD TABLES (child tables first) - identity ids reset on recreate
-- ============================================================

DROP TABLE IF EXISTS poems_audit CASCADE;
DROP TABLE IF EXISTS poems CASCADE;
DROP TABLE IF EXISTS poets CASCADE;

-- To wipe the ENTIRE schema (every table, view, function) use this instead:
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;


-- ============================================================
-- 1. POETS MASTER TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS poets (
    poet_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    poet_name VARCHAR(250) NOT NULL,

    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    modified_by VARCHAR(100),
    modified_date TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT uq_poets_poet_name
        UNIQUE (poet_name)
);


-- ============================================================
-- 2. POEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS poems (
    poem_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    title VARCHAR(250) NOT NULL,
    content TEXT NOT NULL,

    poet_id BIGINT NOT NULL,

    created_by VARCHAR(100) NOT NULL,
    created_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    modified_by VARCHAR(100),
    modified_date TIMESTAMPTZ,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_poems_poet
        FOREIGN KEY (poet_id)
        REFERENCES poets(poet_id)
);


-- ============================================================
-- 3. POEMS AUDIT TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS poems_audit (
    audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    poem_id BIGINT NOT NULL,

    operation VARCHAR(20) NOT NULL,

    old_title VARCHAR(250),
    new_title VARCHAR(250),

    old_content TEXT,
    new_content TEXT,

    old_poet_id BIGINT,
    new_poet_id BIGINT,

    changed_by VARCHAR(100) NOT NULL,
    changed_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_poems_audit_poem
        FOREIGN KEY (poem_id)
        REFERENCES poems(poem_id),

    CONSTRAINT chk_poems_audit_operation
        CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);


-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_poems_title
    ON poems(title);

CREATE INDEX IF NOT EXISTS idx_poems_poet_id
    ON poems(poet_id);

CREATE INDEX IF NOT EXISTS idx_poems_created_date
    ON poems(created_date);

CREATE INDEX IF NOT EXISTS idx_poems_audit_poem_id
    ON poems_audit(poem_id);

CREATE INDEX IF NOT EXISTS idx_poems_audit_changed_date
    ON poems_audit(changed_date);


-- ============================================================
-- 5. INSERT POETS  (poet_id 1 = వెంకటరత్నం, poet_id 2 = రామకృష్ణ)
-- ============================================================

INSERT INTO poets
(
    poet_name,
    created_by
)
VALUES
(
    'మిరియాల వెంకటరత్నం',
    'సందీప్'
),
(
    'డాక్టర్ మిరియాల రామకృష్ణ',
    'సందీప్'
)
ON CONFLICT (poet_name) DO NOTHING;


-- ============================================================
-- 6. INSERT POEMS 1-36  (poet_id 1 - రత్నాల బాల - మిరియాల వెంకటరత్నం, 36 poems)
--    poet_id is looked up by name; seq keeps the book order
-- ============================================================

INSERT INTO poems
(
    title,
    content,
    poet_id,
    created_by,
    created_date,
    is_active
)
SELECT
    v.title,
    v.content,
    pt.poet_id,
    'సందీప్',
    CURRENT_TIMESTAMP,
    TRUE
FROM (VALUES
    (1, 'అసహనం', $$గొప్పవారి జూచి క్రూరులు కొందరు
సహనబుద్ధి లేక సణుగుచుంద్రు !
హంస జూచి కాకి హింసించబూనదా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (2, 'ఆకలి', $$ఆకలైన వేళ ఆకులలములైన
మెక్కుచుంద్రు బీదబిక్కి జనులు !
ఆకలుడిగినపుడు ఆకులైనను వద్దు
భావరత్నబాల ! భాగ్యలీల !$$),
    (3, 'ఆనందం', $$ఒకరినొకరు జూచి యోగ్యమౌబుద్ధిని
పొందియున్నయెడల పోరులణగు !
ఆత్మగౌరవమున ఆనందమొనగూరు
భావరత్నబాల ! భాగ్యలీల !$$),
    (4, 'ఋణం', $$ఋణము చేయరాదు గుణశూన్యదగ్గర
వైర మొందరాదు వీరుతోడ
ఋణము, రణము కన్న వ్రణములే నయమగు
భావరత్నబాల ! భాగ్యలీల !$$),
    (5, 'క్రమశిక్షణ', $$గారబమున కంటె క్రమశిక్షణముతోనె
పితరులెల్ల సుతుల బెంచునపుడు
ముసలితనమునందు బుద్ధిగా చూతురు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (6, 'గర్వం', $$సిరులు, వాహనములు జీవనోపాధులు
కలవు తనకటంచు గర్వమేల ?
గర్వమున్నవాడు సర్వనాశనమగు
భావరత్నబాల ! భాగ్యలీల !$$),
    (7, 'గుణం', $$కరచుకుక్క తాను అరువదు తరచుగా
మొరుగుకుక్క తరచు కరవబోదు
కరచి అరుచువారు నరులయందున్నారు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (8, 'గౌరవం', $$తీరు మంచిదైన గౌరవంబొనగూడు !
గౌరవమున తొలగు కష్టములును !
గుణముచెడ్డదైన గణన కెక్కుట యెట్లు ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (9, 'జాప్యం', $$జాగు చేయరాదు సత్కార్య మొనరింప
గోప్యమైన గాని జాప్యమైన
అమృతంబు కూడ అయిపోవు గరళంబు
భావరత్నబాల ! భాగ్యలీల !$$),
    (10, 'జ్ఞానం', $$ఏది తూర్పొ పడమరేది ఉత్తరమేది
ఏది దక్షిణమ్మొ ఎచటనైన
తెలుసుకోనివాడు ధీమంతు డెట్లగు ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (11, 'దయ', $$నారు పోయువాడు నీరుపోయగనెంచు !
బిడ్డగన్నవాడై పెంచనెంచు !
దయ నెరుగనివాడు దైవమెట్లగునురా !
భావరత్నబాల ! భాగ్యలీల !$$),
    (12, 'దానం', $$జ్ఞానులైనవారు దానధర్మాలతో
పేరునొంది బుద్ధి వృద్ధి గాంతు !
దానహీనులెల్ల జ్ఞానహీనులు సుమీ !
భావరత్నబాల ! భాగ్యలీల !$$),
    (13, 'దారిద్య్రం', $$ఉన్నవారు తిన్న అన్నమే అరుగదు !
బీదవారు తినుట కేది కూడు ?
ఇంతకన్న చిత్ర మియుగంబున లేదు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (14, 'దురాశ', $$ఆశ మితమునొంద హర్షంబు కలుగును
తృష్ణ అమితమైన తృప్తి సున్న
ఆశలేనివాడు అధికసంపన్నుడు
భావరత్నబాల ! భాగ్యలీల !$$),
    (15, 'ద్రోహం', $$పాము గాంచినంత భయము నొందిన రీతి
ద్రోహజాతికెల్ల దూరమందె
ఆగితీరవలెను బాగుగా యోచించి
భావరత్నబాల ! భాగ్యలీల !$$),
    (16, 'ధనం', $$ఒక్కపైసయైన ఎక్కడి కేగిన
లేనివారు పొదుపులేనివారు
మాటవరుసకైన మారకుందురు సుమా
భావరత్నబాల ! భాగ్యలీల !$$),
    (17, 'న్యాయం', $$మనసు మంచిదైన మర్యాద కల్గును
చెడదైన యెడల చేటు కలుగు
మంచిచెడ్డ లెంచి మసలుటే న్యాయము
భావరత్నబాల ! భాగ్యలీల !$$),
    (18, 'పెద్దలు', $$బాలబాలికలను బాగుపడమటంచు
పెద్దవాడు పలుకు ముద్దుగాను
పాడుబోధ చేయువాడెట్లు పెద్దరా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (19, 'పొదుపు', $$ఆయమెంతో పద్దులందు లెక్కించుచు
వ్యయము కత్తిరించువారి కెపుడు
ఋణము చేయు బాధ రేపు కూడా రాదు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (20, 'పౌరుషం', $$బాకులట్లు పదునువాక్కులు విసిరిన
విన్నవారు దెబ్బతిన్న వారు
పౌరుషంబు తోడ పడగెత్తి కరువరా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (21, 'బాల్యం', $$బాల్యమందునుంచి బాలబాలికలకు
మంచిచెడ్డ చెప్ప మాను వారు
పెద్దవారలైన పిదప భేధింపరా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (22, 'భారం', $$బరువులెత్తుకొంచు పరుగెత్తగారాదు !
బరువు మించి మోయ బ్రతుకు సున్న !
భారమెక్కువైన బాధలే ఎక్కువ !
భావరత్నబాల ! భాగ్యలీల !$$),
    (23, 'మంచితనం', $$షాకు కొట్టు చుండు చక్కని విద్యుత్తు !
వేడి చిమ్ముచుండు వెలుగు దివ్వె !
మంచియందు వలయు కొంచెము జాగ్రత్త !
భావరత్నబాల ! భాగ్యలీల !$$),
    (24, 'మనసు', $$ఖలుని చూపుపడిన శిలలుకూడ పగులు !
పరుష వాక్కువిన్న ధరణి వణకు !
మనసు మంచిదైన మకరందములు చిమ్ము !
భావరత్నబాల ! భాగ్యలీల !$$),
    (25, 'మనిషి', $$ధనము పెరిగినపుడు ఘనమౌను మదమును
ధనము తరిగినపుడు తగ్గు మదము !
మదము తగ్గినపుడె మానవుడై యొప్పు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (26, 'మాటలు', $$మాటలాడునపుడు మంచిని చెప్పుచు
చెడ్డమాట లెపుడు చెవుల నిడక
మసలుచుండువారె మాననీయులు సుమీ !
భావరత్నబాల ! భాగ్యలీల !$$),
    (27, 'మైత్రి', $$ఖలుల చెలిమిచేసి కష్టాలు నష్టాలు
పొంది కుందు కంటె ముందుగానే
మంచివారినెన్ని మెత్రిచేయుట మేలు
భావరత్నబాల ! భాగ్యలీల !$$),
    (28, 'లోకం', $$మనసునొవ్వరాదు ! మాటలు పడరాదు !
కార్యభంగ మెపుడు కలుగరాదు !
లోకనీతి యింత లోపలే ఉన్నది !
భావరత్నబాల ! భాగ్యలీల !$$),
    (29, 'విషం', $$సుధగ్రహించి సురలు సుకుమారులైనారు !
విషముమ్రింగి శివుడు వీరుడయ్యె !
విషముకున్న మహిమ విరితేనె కున్నదా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (30, 'వైద్యం', $$ఔషధంబులిచ్చు నమృతభిషక్కును
రోగి నమ్మవలయు వాగకుండ
రోగముక్తి కొరకు వాగుడు లేలరా ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (31, 'వ్యసనం', $$ఊరిలోన చదువుకున్న వాడెవ్వడో
ఉండుచోట చేరుచుందు జనులు !
కాలయాపనము కేలరా వ్యసనాలు ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (32, 'శుచి', $$తెల్లదుస్తులందు తేటగా నుండిన
ఆత్మగౌరవంబు అతిశయించు
శుచి నశించువారి చూచుటే చికాకు !
భావరత్నబాల ! భాగ్యలీల !$$),
    (33, 'సాహసం', $$చనువులేని చోట, సందేహమగుచోట,
ఆత్మగౌరవంబు అణగుచోట
మనిషి సాహసించి మసలకూడని బాట !
భావరత్నబాల ! భాగ్యలీల !$$),
    (34, 'సుఖం', $$ఓర్పు మించు సద్గుణోన్నతి ఎక్కడ ?
సుఖము మించునట్టి శోభ ఏది ?
సంతసంబు కంటె సౌఖ్యమేమున్నది ?
భావరత్నబాల ! భాగ్యలీల !$$),
    (35, 'సొగసు', $$వాసనైనలేని వన్నెల మోదుగుల్
తెలివిలేక సొగసుగలుగువారు !
వాదులాడి తుదకు వాడిపోదురు సుమీ !
భావరత్నబాల ! భాగ్యలీల !$$),
    (36, 'సౌజన్యం', $$హానిచేయరాదు హానిపొందగరాదు.
మేలు గోరవలెను మేలుచేసి
మేలుకీడులెంచి కాలుంచవలయును !
భావరత్నబాల ! భాగ్యలీల !$$)
) AS v(seq, title, content)
CROSS JOIN (
    SELECT poet_id
    FROM poets
    WHERE poet_name = 'మిరియాల వెంకటరత్నం'
) AS pt
ORDER BY v.seq;


-- ============================================================
-- 7. INSERT POEMS 37-39  (poet_id 2 - Dr. Miriyala Ramakrishna)
-- ============================================================

INSERT INTO poems
(
    title,
    content,
    poet_id,
    created_by
)
SELECT
    'తెలుగు భాష',
    'వేనవేల కవుల వెలుగులో రూపొంది
దేశదేశములను వాసిగాంచి
వేయి యేండ్లనుండి విలసిల్లు నా “భాష”
దేశ భాషలందు తెలుగు లెస్స!',
    poet_id,
    'సందీప్'
FROM poets
WHERE poet_name = 'డాక్టర్ మిరియాల రామకృష్ణ';


INSERT INTO poems
(
    title,
    content,
    poet_id,
    created_by
)
SELECT
    'తెలుగులెస్స',
    'ఉగ్గుపాలనుండి ఉయ్యాలలోననుండి
అమ్మ పాట పాడినట్టి భాష
తేనెవంటి మందు వీనులకును విందు
దేశభాషలందు తెలుగులెస్స!',
    poet_id,
    'సందీప్'
FROM poets
WHERE poet_name = 'డాక్టర్ మిరియాల రామకృష్ణ';


INSERT INTO poems
(
    title,
    content,
    poet_id,
    created_by
)
SELECT
    'తేటతెలుగు',
    'సంస్కృతంబులోని చక్కెర పాకంబు
అరవ భాషలోని అమృత రాశి
కన్నడంబులోని కస్తూరి వాసన
కలిసిపోయె తేట తెలుగునందు !',
    poet_id,
    'డాక్టర్ మిరియాల రామకృష్ణ'
FROM poets
WHERE poet_name = 'డాక్టర్ మిరియాల రామకృష్ణ';


-- ============================================================
-- 8. SAFETY CHECK - rolls everything back if counts are wrong
-- ============================================================

DO $$
BEGIN
    IF (SELECT COUNT(*) FROM poets) <> 2 THEN
        RAISE EXCEPTION 'Expected 2 poets';
    END IF;
    IF (SELECT COUNT(*) FROM poems) <> 39 THEN
        RAISE EXCEPTION 'Expected 39 poems';
    END IF;
    IF (SELECT COUNT(*) FROM poems p JOIN poets t ON t.poet_id = p.poet_id
        WHERE p.poem_id BETWEEN 1 AND 36
          AND t.poet_name = 'మిరియాల వెంకటరత్నం') <> 36 THEN
        RAISE EXCEPTION 'Expected poem_id 1-36 to belong to Venkataratnam';
    END IF;
    IF (SELECT COUNT(*) FROM poems p JOIN poets t ON t.poet_id = p.poet_id
        WHERE p.poem_id BETWEEN 37 AND 39
          AND t.poet_name = 'డాక్టర్ మిరియాల రామకృష్ణ') <> 3 THEN
        RAISE EXCEPTION 'Expected poem_id 37-39 to belong to Ramakrishna';
    END IF;
END
$$;

COMMIT;


-- ============================================================
-- 9. VERIFY POETS
-- ============================================================

SELECT
    poet_id,
    poet_name,
    created_by,
    created_date,
    is_active
FROM poets
ORDER BY poet_id;


-- ============================================================
-- 10. VERIFY POEMS WITH POET (expect 39 rows, poem_id 1..39)
-- ============================================================

SELECT
    p.poem_id,
    p.title,
    p.content,
    pt.poet_id,
    pt.poet_name,
    p.created_by,
    p.created_date,
    p.is_active
FROM poems p
INNER JOIN poets pt
    ON p.poet_id = pt.poet_id
ORDER BY p.poem_id;


UPDATE poems
SET created_by = 'సందీప్ మిరియాల';

UPDATE poets
SET created_by = 'సందీప్ మిరియాల';

 -- ============================================================
-- 11. CREATE API USAGE LOG TABLE
-- ============================================================

CREATE TABLE api_usage_log (
    usage_id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    api_name          VARCHAR(200) NOT NULL,
    endpoint          VARCHAR(500) NOT NULL,
    http_method       VARCHAR(10) NOT NULL,

    event_type        VARCHAR(30) NOT NULL,
    -- API_CALL / BUTTON_CLICK

    request_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    request_time      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    status_code       INTEGER,
    success           BOOLEAN NOT NULL DEFAULT TRUE,

    response_time_ms  INTEGER,

    metadata          JSONB
);