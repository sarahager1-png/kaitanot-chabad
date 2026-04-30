-- טבלת הגדרות רשת (key-value)
CREATE TABLE IF NOT EXISTS network_settings (
  key   text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

-- RLS: רק אדמין/מנהל רשת יכולים לקרוא ולכתוב
ALTER TABLE network_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins can manage network_settings"
  ON network_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('אדמין מערכת', 'מנהל רשת')
    )
  );

-- ערכי ברירת מחדל
INSERT INTO network_settings (key, value) VALUES
  ('cardcom_terminal', ''),
  ('cardcom_api_name', ''),
  ('cardcom_api_password', '')
ON CONFLICT (key) DO NOTHING;
