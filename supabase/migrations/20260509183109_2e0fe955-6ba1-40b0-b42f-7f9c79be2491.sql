-- KPI catalog
CREATE TABLE public.kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  current_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  better TEXT NOT NULL CHECK (better IN ('higher','lower')),
  category TEXT NOT NULL CHECK (category IN ('Financial','Capacity','Throughput','Quality')),
  icon TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Signals
CREATE TABLE public.signals (
  id TEXT PRIMARY KEY,
  metric_slug TEXT NOT NULL REFERENCES public.kpis(slug) ON DELETE CASCADE,
  priority INT NOT NULL CHECK (priority BETWEEN 1 AND 3),
  status TEXT NOT NULL CHECK (status IN ('active','in-progress','resolved','escalated')),
  signal TEXT NOT NULL,
  impact TEXT NOT NULL,
  next_action TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_signals_status ON public.signals(status);
CREATE INDEX idx_signals_metric ON public.signals(metric_slug);

-- Signal history (prior instances)
CREATE TABLE public.signal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id TEXT NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  summary TEXT NOT NULL,
  outcome TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_signal_history_signal ON public.signal_history(signal_id);

-- Action log
CREATE TABLE public.signal_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id TEXT NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  actor TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_action_log_signal ON public.signal_action_log(signal_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_kpis_updated BEFORE UPDATE ON public.kpis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_signals_updated BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signal_action_log ENABLE ROW LEVEL SECURITY;

-- Public read on all
CREATE POLICY "Public read kpis" ON public.kpis FOR SELECT USING (true);
CREATE POLICY "Public read signals" ON public.signals FOR SELECT USING (true);
CREATE POLICY "Public read signal_history" ON public.signal_history FOR SELECT USING (true);
CREATE POLICY "Public read signal_action_log" ON public.signal_action_log FOR SELECT USING (true);

-- Prototype writes: anyone can insert action log entries and update signal status
CREATE POLICY "Public insert action log" ON public.signal_action_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update signal status" ON public.signals FOR UPDATE USING (true) WITH CHECK (true);

-- Seed KPIs
INSERT INTO public.kpis (slug, label, current_value, target_value, unit, better, category, icon, sort_order) VALUES
  ('cost-per-case','Cost per Case',14760,12000,'USD','lower','Financial','DollarSign',1),
  ('bed-utilization','Bed Utilization',78,85,'%','higher','Capacity','BedDouble',2),
  ('or-throughput','OR Throughput',4.1,5.0,'cases/day','higher','Throughput','Gauge',3),
  ('length-of-stay','Length of Stay',4.6,4.2,'days','lower','Quality','Activity',4),
  ('readmission-rate','Readmission Rate',11.2,9.5,'%','lower','Quality','RotateCcw',5),
  ('discharge-before-noon','Discharge Before Noon',31,55,'%','higher','Throughput','Clock',6);

-- Seed signals
INSERT INTO public.signals (id, metric_slug, priority, status, signal, impact, next_action, detected_at) VALUES
  ('sig-001','discharge-before-noon',1,'active',
   'Discharge Before Noon is 43.6% below target and has not improved in 30 days.',
   'Afternoon bed pressure is increasing, raising ED boarding risk across the facility.',
   'Pull late discharge data by attending physician and schedule a review with case management this week.',
   'May 2, 2026 · 8:04 AM'),
  ('sig-002','cost-per-case',2,'in-progress',
   'Cost per Case is 23% above the $12,000 target.',
   'At current volume, this gap represents unplanned spend that compounds each week without intervention.',
   'Pull case-level cost breakdown for the top 3 service lines before the next ops review.',
   'Apr 28, 2026 · 7:12 AM'),
  ('sig-003','or-throughput',3,'in-progress',
   'OR Throughput is down 18% from the prior 30-day period at 4.1 cases per day against a target of 5.',
   'Each case lost per day reduces weekly OR revenue and increases scheduling backlog.',
   'Review first-case start time logs for the past 4 weeks and flag rooms with more than 3 late starts.',
   'Apr 24, 2026 · 6:50 AM'),
  ('sig-r01','readmission-rate',2,'resolved',
   '30-day Readmission Rate exceeded 12% for cardiac patients.',
   'Increased CMS penalty exposure for the next reporting period.',
   'Resolved after rollout of post-discharge call program.',
   'Mar 14, 2026 · 9:30 AM'),
  ('sig-l01','length-of-stay',3,'resolved',
   'Average Length of Stay drifted 0.6 days above target for medical units.',
   'Reduced inpatient capacity during peak admission periods.',
   'Resolved after geriatric consult workflow update.',
   'Feb 8, 2026 · 7:48 AM');

-- Seed history
INSERT INTO public.signal_history (signal_id, date, summary, outcome, sort_order) VALUES
  ('sig-001','Apr 4, 2026','Same signal raised — 39% below target for 14 consecutive days.','Acknowledged. No corrective action logged.',1),
  ('sig-001','Mar 11, 2026','Discharge Before Noon dropped below 35% for the first time in Q1.','Routed to Care Management. Closed without resolution.',2),
  ('sig-001','Feb 17, 2026','First flagged at 41% (target 55%).','Resolved after 9 days following weekend rounding pilot.',3),
  ('sig-002','Mar 30, 2026','Cost per Case crossed 20% above target for the first time in FY26.','Resolved May 1 after orthopedic implant contract renegotiation.',1),
  ('sig-003','Jan 9, 2026','OR Throughput briefly dropped to 4.3 after winter staffing gap.','Resolved within 11 days following block schedule revision.',1),
  ('sig-r01','Nov 3, 2025','Cardiac readmission spike during respiratory season.','Resolved after 18 days.',1),
  ('sig-r01','Mar 14, 2026','Repeat spike, sustained 3 weeks.','Resolved Apr 21 after post-discharge call program rollout.',2),
  ('sig-l01','Feb 8, 2026','ALOS at 4.9 days against 4.2 target.','Resolved Mar 2 after geriatric consult workflow update.',1);

-- Seed action log
INSERT INTO public.signal_action_log (signal_id, timestamp, actor, role, action) VALUES
  ('sig-001','May 2, 2026 · 8:04 AM','Ops Advisor (AI)','System','Signal raised at priority 1.'),
  ('sig-002','Apr 28, 2026 · 7:12 AM','Ops Advisor (AI)','System','Signal raised at priority 2.'),
  ('sig-002','Apr 29, 2026 · 9:40 AM','J. Alvarez','CFO','Acknowledged. Requested service-line cost breakdown.'),
  ('sig-002','May 1, 2026 · 2:15 PM','K. Liu','Finance Analyst','Uploaded service-line breakdown for Cardio, Ortho, Neuro.'),
  ('sig-003','Apr 24, 2026 · 6:50 AM','Ops Advisor (AI)','System','Signal raised at priority 3.'),
  ('sig-003','Apr 25, 2026 · 11:20 AM','S. Patel','VP of Operations','Assigned to OR Director for first-case start audit.'),
  ('sig-r01','Mar 14, 2026 · 9:30 AM','Ops Advisor (AI)','System','Signal raised.'),
  ('sig-r01','Mar 18, 2026 · 1:05 PM','Dr. M. Reynolds','Department Director','Approved post-discharge call program pilot.'),
  ('sig-r01','Apr 21, 2026 · 4:45 PM','Ops Advisor (AI)','System','Signal closed — readmission rate returned to 9.4%.'),
  ('sig-l01','Feb 8, 2026 · 7:48 AM','Ops Advisor (AI)','System','Signal raised.'),
  ('sig-l01','Mar 2, 2026 · 10:10 AM','Ops Advisor (AI)','System','Signal closed.');