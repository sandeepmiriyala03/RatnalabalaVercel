-- ============================================================
-- YuktishaalaaAI - Ratnalabala
-- PostgreSQL Database Script
-- ============================================================

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
-- 5. INSERT POETS
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
-- 6. INSERT POEMS
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
-- 7. VERIFY POETS
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
-- 8. VERIFY POEMS WITH POET
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