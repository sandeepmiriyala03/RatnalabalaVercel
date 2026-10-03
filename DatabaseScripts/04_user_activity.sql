-- ================================================================
-- వినియోగదారుల కార్యకలాపాలు (user activity)
-- api/_activity.py ఇక్కడ నమోదు చేస్తుంది.
-- వ్యక్తిగత వివరాలు (పేరు, email, IP) ఏవీ లేవు.
-- ================================================================

CREATE TABLE IF NOT EXISTS user_activity (
    activity_id  BIGSERIAL     PRIMARY KEY,
    session_id   VARCHAR(64)   NOT NULL,          -- ప్రతి సందర్శనకు యాదృచ్ఛికం
    event_name   VARCHAR(40)   NOT NULL,          -- ఉదా: page_view, speak, pdf_export
    page_path    VARCHAR(300),                    -- ఉదా: /aksharamala
    letter       VARCHAR(20),                     -- ఉదా: క
    detail       VARCHAR(200),                    -- ఉదా: male / server / grid
    success      BOOLEAN,                         -- ఉదా: పలకడం సరైందా
    device       VARCHAR(10),                     -- phone / tablet / desktop
    language     VARCHAR(20),                     -- ఉదా: te-IN
    client_time  TIMESTAMPTZ,                     -- బ్రౌజర్ సమయం
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_user_activity_created ON user_activity (created_at);
CREATE INDEX IF NOT EXISTS ix_user_activity_event   ON user_activity (event_name, created_at);
CREATE INDEX IF NOT EXISTS ix_user_activity_page    ON user_activity (page_path, created_at);

-- పాతవి శుభ్రం (ఐచ్ఛికం — నెలకోసారి): 180 రోజుల కంటే పాతవి తీసేయడం
-- DELETE FROM user_activity WHERE created_at < NOW() - INTERVAL '180 days';

-- త్వరిత సారాంశం (Neon console లో నడపవచ్చు)
-- SELECT event_name, COUNT(*) FROM user_activity
-- WHERE created_at >= NOW() - INTERVAL '7 days'
-- GROUP BY event_name ORDER BY 2 DESC;