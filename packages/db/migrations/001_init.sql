-- packages/db/migrations/001_init.sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE institutions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  address TEXT,
  state TEXT,
  lga TEXT,
  mlscn_reg_number TEXT,
  licence_tier TEXT NOT NULL DEFAULT 'free_pilot',
  is_active INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','scientist_l2','scientist_l1','operator','viewer')),
  mlscn_number TEXT,
  mlscn_verified INTEGER NOT NULL DEFAULT 0,
  password_hash TEXT NOT NULL,
  totp_secret TEXT,
  two_fa_enabled INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_institution ON users(institution_id);

CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  patient_code TEXT UNIQUE NOT NULL,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  full_name TEXT NOT NULL,
  dob TEXT,
  gender TEXT,
  nin_encrypted TEXT,
  hospital_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  next_of_kin TEXT,
  consent_given INTEGER NOT NULL DEFAULT 0,
  consent_timestamp TEXT,
  consent_signature_path TEXT,
  chronic_flags_encrypted TEXT,
  family_group_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_patients_institution ON patients(institution_id);
CREATE INDEX idx_patients_name_dob ON patients(full_name, dob);

CREATE TABLE samples (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id),
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  sample_type TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('routine','urgent','stat')) DEFAULT 'routine',
  collection_datetime TEXT,
  requesting_clinician TEXT,
  clinical_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested','collected','processing','analysed','review','released')) DEFAULT 'requested',
  barcode_printed INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_samples_patient ON samples(patient_id);
CREATE INDEX idx_samples_status ON samples(status);

CREATE TABLE test_requests (
  id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL REFERENCES samples(id),
  test_category TEXT NOT NULL CHECK (test_category IN ('haematology','microbiology','parasitology','histopathology','cytology')),
  test_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  assigned_to TEXT REFERENCES users(id),
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TRIGGER trg_mp_category_check
BEFORE INSERT ON test_requests
WHEN NEW.test_name = 'Malaria Parasite' AND NEW.test_category != 'parasitology'
BEGIN
  SELECT RAISE(ABORT, 'Malaria Parasite must be test_category=parasitology');
END;
CREATE INDEX idx_test_requests_sample ON test_requests(sample_id);

CREATE TABLE captures (
  id TEXT PRIMARY KEY,
  test_request_id TEXT NOT NULL REFERENCES test_requests(id),
  device_id TEXT,
  video_local_path TEXT NOT NULL,
  duration_seconds INTEGER,
  capture_datetime TEXT NOT NULL DEFAULT (datetime('now')),
  focus_score_avg REAL,
  frame_count INTEGER,
  transferred_from_device INTEGER NOT NULL DEFAULT 0,
  device_ack_confirmed INTEGER NOT NULL DEFAULT 0,
  capture_metadata TEXT,
  created_by TEXT REFERENCES users(id)
);
CREATE INDEX idx_captures_test_request ON captures(test_request_id);

CREATE TABLE ai_results (
  id TEXT PRIMARY KEY,
  capture_id TEXT NOT NULL REFERENCES captures(id),
  model_version TEXT NOT NULL,
  test_type TEXT NOT NULL,
  findings TEXT NOT NULL,
  confidence_scores TEXT,
  flagged_for_review INTEGER NOT NULL DEFAULT 0,
  uncertain_cells_pct REAL,
  processing_duration_ms INTEGER,
  model_checksum TEXT,
  dataset_version TEXT,
  preprocessing_version TEXT,
  calibration_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ai_results_capture ON ai_results(capture_id);

CREATE TABLE results (
  id TEXT PRIMARY KEY,
  test_request_id TEXT UNIQUE NOT NULL REFERENCES test_requests(id),
  ai_result_id TEXT REFERENCES ai_results(id),
  patient_id TEXT NOT NULL REFERENCES patients(id),
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  status TEXT NOT NULL CHECK (status IN ('draft','processing','ai_result','pending_review','approved','released','amended')) DEFAULT 'draft',
  edited_findings TEXT,
  interpretive_comment TEXT,
  reference_ranges TEXT,
  approved_by TEXT REFERENCES users(id),
  approved_at TEXT,
  digital_signature_path TEXT,
  result_pdf_local_path TEXT,
  verification_code TEXT UNIQUE,
  is_amended INTEGER NOT NULL DEFAULT 0,
  amended_from_id TEXT REFERENCES results(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_results_patient ON results(patient_id);
CREATE INDEX idx_results_status ON results(status);

CREATE TABLE corrections (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES results(id),
  ai_result_id TEXT REFERENCES ai_results(id),
  scientist_id TEXT NOT NULL REFERENCES users(id),
  field_name TEXT NOT NULL,
  original_ai_value TEXT,
  corrected_value TEXT,
  correction_reason TEXT,
  is_used_in_retraining INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_corrections_result ON corrections(result_id);

CREATE TABLE devices (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  serial_number TEXT UNIQUE NOT NULL,
  firmware_version TEXT,
  last_paired_at TEXT,
  battery_level_pct INTEGER,
  storage_used_gb REAL,
  storage_total_gb REAL,
  last_local_ip TEXT,
  calibration_due_at TEXT
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT REFERENCES users(id),
  institution_id TEXT REFERENCES institutions(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  local_ip_or_null TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TRIGGER trg_audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TRIGGER trg_audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN SELECT RAISE(ABORT, 'audit_log is append-only'); END;

CREATE TABLE model_versions (
  id TEXT PRIMARY KEY,
  test_type TEXT NOT NULL,
  version_string TEXT NOT NULL,
  onnx_local_path TEXT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  accuracy_metrics TEXT,
  training_dataset_info TEXT,
  deployed_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  deployed_by TEXT REFERENCES users(id)
);

CREATE TABLE qc_records (
  id TEXT PRIMARY KEY,
  institution_id TEXT NOT NULL REFERENCES institutions(id),
  scientist_id TEXT REFERENCES users(id),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  avg_turnaround_min REAL,
  ai_agreement_pct REAL,
  total_analyses INTEGER,
  total_corrections INTEGER
);

CREATE TABLE licences (
  id TEXT PRIMARY KEY,
  institution_id TEXT UNIQUE NOT NULL REFERENCES institutions(id),
  tier TEXT NOT NULL,
  billing_cycle TEXT,
  price_ngn INTEGER,
  analyses_limit INTEGER NOT NULL DEFAULT -1,
  users_limit INTEGER,
  activated_at TEXT,
  expires_at TEXT,
  activation_signature TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  institution_id TEXT REFERENCES institutions(id),
  type TEXT,
  title TEXT,
  body TEXT,
  related_entity_type TEXT,
  related_entity_id TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);