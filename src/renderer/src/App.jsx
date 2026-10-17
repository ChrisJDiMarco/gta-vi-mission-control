import { useEffect, useMemo, useState } from 'react';
import appIcon from './assets/app-icon.png';
import { guardrails, lanes, seedOpportunities, seedTasks, stages } from './data.js';
import { daysUntilLaunch, nextTasksFor, opportunityScore, weightedPipelineValue } from './opportunity.mjs';

const STORAGE_OPPS = 'gta-vi-mission-control-opportunities-v1';
const STORAGE_TASKS = 'gta-vi-mission-control-tasks-v1';

const emptyForm = {
  title: '',
  lane: 'Creator Ops',
  stage: 'Backlog',
  status: 'Raw idea',
  playMode: 'No gameplay required',
  angle: '',
  estRevenue: 1000,
  effort: 2,
  confidence: 3,
  urgency: 3,
  nextAction: '',
  notes: '',
};

function uid(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_) {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function money(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function scoreLabel(score) {
  if (score >= 75) return 'Attack now';
  if (score >= 55) return 'Good bet';
  if (score >= 35) return 'Needs proof';
  return 'Park it';
}

function App() {
  const [meta, setMeta] = useState({ name: 'GTA VI Mission Control', version: '0.1.0' });
  const [tab, setTab] = useState('control');
  const [laneFilter, setLaneFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(seedOpportunities[0].id);
  const [opportunities, setOpportunities] = useStoredState(STORAGE_OPPS, seedOpportunities);
  const [tasks, setTasks] = useStoredState(STORAGE_TASKS, seedTasks);
  const [form, setForm] = useState(emptyForm);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    window.missionControl?.appMeta?.().then(setMeta).catch(() => {});
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const scored = useMemo(() => {
    return opportunities
      .map((opportunity) => ({ ...opportunity, score: opportunityScore(opportunity) }))
      .sort((a, b) => b.score - a.score);
  }, [opportunities]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scored.filter((opportunity) => {
      const matchesLane = laneFilter === 'All' || opportunity.lane === laneFilter;
      const haystack = `${opportunity.title} ${opportunity.angle} ${opportunity.notes}`.toLowerCase();
      return matchesLane && (!q || haystack.includes(q));
    });
  }, [laneFilter, query, scored]);

  const selected = opportunities.find((opportunity) => opportunity.id === selectedId) || visible[0] || scored[0];
  const activeCount = opportunities.filter((opportunity) => opportunity.stage !== 'Parked').length;
  const pipeline = weightedPipelineValue(opportunities.filter((opportunity) => opportunity.stage !== 'Parked'));
  const completedTasks = tasks.filter((task) => task.done).length;
  const launchDays = daysUntilLaunch(now);

  function patchOpportunity(id, patch) {
    setOpportunities((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function addOpportunity(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    const opportunity = {
      ...form,
      id: uid('play'),
      title,
      angle: form.angle.trim() || 'A money experiment to validate before the launch wave peaks.',
      nextAction: form.nextAction.trim() || `Define the first paid pilot for ${title}.`,
      notes: form.notes.trim(),
    };
    setOpportunities((items) => [opportunity, ...items]);
    setSelectedId(opportunity.id);
    setForm(emptyForm);
    setTab('control');
  }

  function cloneTemplate(template) {
    const opportunity = {
      ...template,
      id: uid('template'),
      stage: 'Backlog',
      status: 'Cloned template',
      title: `${template.title} variant`,
    };
    setOpportunities((items) => [opportunity, ...items]);
    setSelectedId(opportunity.id);
    setTab('control');
  }

  function addGeneratedTasks(opportunity) {
    const next = nextTasksFor(opportunity).map((text) => ({ id: uid('task'), text, done: false }));
    setTasks((items) => [...next, ...items]);
  }

  function resetBoard() {
    if (!window.confirm('Reset the board to the starter GTA VI money plays?')) return;
    setOpportunities(seedOpportunities);
    setTasks(seedTasks);
    setSelectedId(seedOpportunities[0].id);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="window-drag" />
        <div className="brand">
          <img className="brand-mark" src={appIcon} alt="" />
          <div>
            <p className="eyebrow">Unofficial operator desk</p>
            <h1>{meta.name}</h1>
          </div>
        </div>

        <div className="countdown">
          <span className="countdown-number tabular">{launchDays}</span>
          <span className="countdown-label">days until launch window</span>
          <span className="countdown-date">Nov 19, 2026</span>
        </div>

        <nav className="nav-list" aria-label="Mission sections">
          {[
            ['control', 'Mission Control'],
            ['plays', 'Money Plays'],
            ['builder', 'Create Play'],
            ['guardrails', 'Legal Lines'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={tab === id ? 'nav-button active' : 'nav-button'}
              type="button"
              onClick={() => setTab(id)}
            >
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Built for one job: turn the attention wave into paid experiments.</p>
          <button className="text-button" type="button" onClick={resetBoard}>Reset starter board</button>
        </div>
      </aside>

      <main className="workspace">
        <section className="hero-band">
          <div>
            <p className="eyebrow">GTA VI launch-market cockpit</p>
            <h2>Track the plays, score the upside, move before the feed gets crowded.</h2>
          </div>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => setTab('builder')}>Add money play</button>
            <button className="secondary-button" type="button" onClick={() => setTab('plays')}>Browse templates</button>
          </div>
        </section>

        <section className="metrics-row" aria-label="Board metrics">
          <Metric label="Weighted pipeline" value={money(pipeline)} note="Revenue times confidence" />
          <Metric label="Active plays" value={activeCount} note={`${opportunities.length} total ideas`} />
          <Metric label="Task heat" value={`${completedTasks}/${tasks.length}`} note="Completed next moves" />
          <Metric label="Top score" value={scored[0]?.score || 0} note={scored[0] ? scored[0].title : 'No plays yet'} />
        </section>

        {tab === 'control' && (
          <section className="control-grid">
            <div className="board-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Prioritized plays</p>
                  <h3>What deserves attention first</h3>
                </div>
                <div className="filters">
                  <label>
                    <span>Search</span>
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="clipper, affiliate, local..." />
                  </label>
                  <label>
                    <span>Lane</span>
                    <select value={laneFilter} onChange={(event) => setLaneFilter(event.target.value)}>
                      <option>All</option>
                      {lanes.map((lane) => <option key={lane}>{lane}</option>)}
                    </select>
                  </label>
                </div>
              </div>

              <div className="opportunity-list">
                {visible.map((opportunity) => (
                  <button
                    key={opportunity.id}
                    className={selected?.id === opportunity.id ? 'opportunity-card selected' : 'opportunity-card'}
                    type="button"
                    onClick={() => setSelectedId(opportunity.id)}
                  >
                    <span className="score-pill tabular">{opportunity.score}</span>
                    <span className="card-copy">
                      <strong>{opportunity.title}</strong>
                      <span>{opportunity.angle}</span>
                    </span>
                    <span className="lane-chip">{opportunity.lane}</span>
                  </button>
                ))}
              </div>
            </div>

            <OpportunityDetail
              opportunity={selected}
              onPatch={patchOpportunity}
              onTasks={addGeneratedTasks}
            />
          </section>
        )}

        {tab === 'plays' && (
          <section className="templates-grid">
            {seedOpportunities.map((template) => (
              <article className="template-card" key={template.id}>
                <p className="eyebrow">{template.lane}</p>
                <h3>{template.title}</h3>
                <p>{template.angle}</p>
                <div className="template-footer">
                  <span>{money(template.estRevenue)} target</span>
                  <button type="button" onClick={() => cloneTemplate(template)}>Add variant</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {tab === 'builder' && (
          <section className="builder-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Create a money play</p>
                <h3>Simple idea in, first action out</h3>
              </div>
            </div>
            <OpportunityForm form={form} setForm={setForm} onSubmit={addOpportunity} />
          </section>
        )}

        {tab === 'guardrails' && (
          <section className="guardrails-panel">
            <div>
              <p className="eyebrow">Legal enough to sleep</p>
              <h3>Stay on the clean side of the hype</h3>
              <p className="section-copy">
                This app is for strategy, creator operations, affiliate funnels, and legal in-game intelligence.
                It is not for leaks, fake merch, account sales, currency sales, boosting, or exploit tutorials.
              </p>
            </div>
            <div className="guardrail-list">
              {guardrails.map((rule) => (
                <div className="guardrail" key={rule}>
                  <span aria-hidden="true">OK</span>
                  <p>{rule}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="task-strip">
          <div className="task-header">
            <div>
              <p className="eyebrow">Next moves</p>
              <h3>Do these before chasing another idea</h3>
            </div>
            <button type="button" onClick={() => selected && addGeneratedTasks(selected)}>Generate from selected play</button>
          </div>
          <div className="tasks">
            {tasks.map((task) => (
              <label className={task.done ? 'task done' : 'task'} key={task.id}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(event) => {
                    setTasks((items) => items.map((item) => (
                      item.id === task.id ? { ...item, done: event.target.checked } : item
                    )));
                  }}
                />
                <span>{task.text}</span>
              </label>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, note }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className="tabular">{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function OpportunityDetail({ opportunity, onPatch, onTasks }) {
  if (!opportunity) {
    return (
      <aside className="detail-panel empty">
        <h3>No play selected</h3>
        <p>Add a money play to start building the board.</p>
      </aside>
    );
  }

  const score = opportunityScore(opportunity);

  return (
    <aside className="detail-panel">
      <div className="detail-top">
        <div>
          <p className="eyebrow">Selected play</p>
          <h3>{opportunity.title}</h3>
        </div>
        <div className="big-score tabular">
          <strong>{score}</strong>
          <span>{scoreLabel(score)}</span>
        </div>
      </div>

      <p className="detail-angle">{opportunity.angle}</p>

      <div className="detail-facts">
        <Fact label="Lane" value={opportunity.lane} />
        <Fact label="Mode" value={opportunity.playMode} />
        <Fact label="Target" value={money(opportunity.estRevenue)} />
        <Fact label="Status" value={opportunity.status} />
      </div>

      <div className="field-grid compact">
        <label>
          <span>Stage</span>
          <select value={opportunity.stage} onChange={(event) => onPatch(opportunity.id, { stage: event.target.value })}>
            {stages.map((stage) => <option key={stage}>{stage}</option>)}
          </select>
        </label>
        <label>
          <span>Revenue target</span>
          <input
            type="number"
            min="0"
            step="100"
            value={opportunity.estRevenue}
            onChange={(event) => onPatch(opportunity.id, { estRevenue: Number(event.target.value) })}
          />
        </label>
        <RangeField label="Confidence" value={opportunity.confidence} onChange={(value) => onPatch(opportunity.id, { confidence: value })} />
        <RangeField label="Urgency" value={opportunity.urgency} onChange={(value) => onPatch(opportunity.id, { urgency: value })} />
        <RangeField label="Effort" value={opportunity.effort} onChange={(value) => onPatch(opportunity.id, { effort: value })} />
      </div>

      <div className="next-action">
        <span>First action</span>
        <p>{opportunity.nextAction}</p>
      </div>

      <button className="primary-button full" type="button" onClick={() => onTasks(opportunity)}>
        Turn this into tasks
      </button>
    </aside>
  );
}

function Fact({ label, value }) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RangeField({ label, value, onChange }) {
  return (
    <label>
      <span>{label}: {value}</span>
      <input
        type="range"
        min="1"
        max="5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function OpportunityForm({ form, setForm, onSubmit }) {
  function patch(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="opportunity-form" onSubmit={onSubmit}>
      <div className="field-grid">
        <label className="span-2">
          <span>Play title</span>
          <input value={form.title} onChange={(event) => patch('title', event.target.value)} placeholder="Example: GTA VI launch clipper desk" />
        </label>
        <label>
          <span>Lane</span>
          <select value={form.lane} onChange={(event) => patch('lane', event.target.value)}>
            {lanes.map((lane) => <option key={lane}>{lane}</option>)}
          </select>
        </label>
        <label>
          <span>Stage</span>
          <select value={form.stage} onChange={(event) => patch('stage', event.target.value)}>
            {stages.map((stage) => <option key={stage}>{stage}</option>)}
          </select>
        </label>
        <label>
          <span>Play mode</span>
          <select value={form.playMode} onChange={(event) => patch('playMode', event.target.value)}>
            <option>No gameplay required</option>
            <option>Delegate gameplay data</option>
            <option>Optional gameplay</option>
            <option>Requires gameplay</option>
          </select>
        </label>
        <label>
          <span>Revenue target</span>
          <input type="number" min="0" step="100" value={form.estRevenue} onChange={(event) => patch('estRevenue', Number(event.target.value))} />
        </label>
        <label className="span-2">
          <span>Angle</span>
          <textarea value={form.angle} onChange={(event) => patch('angle', event.target.value)} placeholder="Who pays, why now, and what makes it easy to sell?" />
        </label>
        <label className="span-2">
          <span>First action</span>
          <textarea value={form.nextAction} onChange={(event) => patch('nextAction', event.target.value)} placeholder="The next move small enough to do today." />
        </label>
        <RangeField label="Confidence" value={form.confidence} onChange={(value) => patch('confidence', value)} />
        <RangeField label="Urgency" value={form.urgency} onChange={(value) => patch('urgency', value)} />
        <RangeField label="Effort" value={form.effort} onChange={(value) => patch('effort', value)} />
      </div>
      <div className="form-footer">
        <p>Score updates from target, confidence, urgency, and effort. High score means sell or test it first.</p>
        <button className="primary-button" type="submit">Create play</button>
      </div>
    </form>
  );
}

export default App;
