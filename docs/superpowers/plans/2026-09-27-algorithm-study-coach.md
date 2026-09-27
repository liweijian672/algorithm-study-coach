# Algorithm Study Coach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local algorithm study coach that records a user's Niuke C++ submissions through a browser extension and shows weak-point diagnosis, recommendations, and per-problem coaching in a web dashboard.

**Architecture:** A Manifest V3 browser extension captures Niuke problem pages and posts structured events to a local FastAPI backend. The backend stores problems and submission records in SQLite, uses an OpenAI-compatible model for tagging and coaching content, and computes mastery per algorithm tag. A React dashboard reads those results and displays them.

**Tech Stack:** Python, FastAPI, SQLAlchemy, SQLite, pytest, TypeScript, Chrome Manifest V3, Vitest, React, Vite, Tailwind, Recharts, lucide-react.

**Spec:** [2026-09-27-algorithm-study-coach-design.md](../specs/2026-09-27-algorithm-study-coach-design.md)

## Global Constraints

- Platform identifier is `niuke`; no other platform is implemented.
- Generated solutions use language `cpp` only.
- Backend listens on `localhost`; extension and dashboard connect only to localhost.
- Extension never reads or sends Niuke account cookies.
- Difficulty values are exactly `easy`, `medium`, `hard`.
- Record status values are exactly `accepted`, `wrong`, `time_limit`, `compile_error`, `runtime_error`.
- Mastery formula: difficulty weight is `0.8` for easy, `1.0` for medium, `1.3` for hard; time weight is `0.5 + 0.5 * exp(-days_since / 30)`; smoothing is `0.5`.
- LLM access is behind an OpenAI-compatible client with replaceable API key and model name.

## Review Focus

- Duplicate submission events must not inflate statistics: pinned by Task 1 idempotency test.
- A failed attempt that happens before a later accepted attempt must not drag mastery down: pinned by Task 6 superseded-failure test.
- Niuke DOM changes or missing fields must not crash the extension: pinned by Task 2 missing-field parser test.
- Malformed LLM JSON must not crash tagging or coaching: pinned by Task 5 malformed-response test.
- An empty account must still produce a demonstrable dashboard: pinned by Task 7 demo-import test.

---

## Task 1: Backend Foundation And Persistence

**Files:**
- Create: `backend/pyproject.toml`
- Create: `.gitignore`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/db.py`
- Create: `backend/app/models.py`
- Create: `backend/app/schemas.py`
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/problems.py`
- Create: `backend/app/routers/records.py`
- Test: `backend/tests/conftest.py`
- Test: `backend/tests/test_problems.py`
- Test: `backend/tests/test_records.py`

**Interfaces:**
- Produces FastAPI `app` with SQLAlchemy models and Pydantic schemas.
- `POST /problems` accepts `ProblemIn` and returns `ProblemOut`.
- `POST /records` accepts `RecordIn` and returns `RecordOut`.
- `GET /problems/{problem_id}` returns `ProblemOut`.
- `ProblemOut` fields: `id: int`, `platform: str`, `source_id: str`, `title: str`, `difficulty: str`, `url: str`, `description: str | None`.
- `RecordIn` fields: `problem_id: int`, `status: str`, `language: str`, `code: str`, `time_cost_ms: int | None`, `memory_cost_kb: int | None`, `submitted_at: datetime`, `event_key: str`.
- `RecordOut` adds `id: int`.
- `LLMCache` model fields: `id: int`, `cache_key: str` unique, `provider: str`, `model: str`, `output: str`, `created_at: datetime`.

- [ ] **Step 1: Write the failing test**

In `backend/tests/test_problems.py`:

```python
def test_create_and_get_problem(client):
    payload = {
        "platform": "niuke",
        "source_id": "NC1",
        "title": "Two Sum",
        "difficulty": "easy",
        "url": "https://www.nowcoder.com/practice/1",
        "description": None,
    }
    created = client.post("/problems", json=payload)
    assert created.status_code == 200
    data = created.json()
    assert data["id"] == 1
    fetched = client.get(f"/problems/{data['id']}")
    assert fetched.status_code == 200
    assert fetched.json()["source_id"] == "NC1"
```

In `backend/tests/test_records.py`:

```python
def test_duplicate_event_key_is_idempotent(client):
    problem = client.post("/problems", json={
        "platform": "niuke", "source_id": "NC2", "title": "Reverse",
        "difficulty": "easy", "url": "https://example.com/2",
        "description": None,
    }).json()
    record = {
        "problem_id": problem["id"], "status": "accepted", "language": "cpp",
        "code": "int main(){}", "time_cost_ms": None, "memory_cost_kb": None,
        "submitted_at": "2026-09-27T10:00:00", "event_key": "niuke:NC2:1",
    }
    first = client.post("/records", json=record)
    second = client.post("/records", json=record)
    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
```

In `backend/tests/test_problems.py`:

```python
def test_llm_cache_roundtrip(session):
    row = LLMCache(cache_key="k", provider="fake", model="fake", output="ok")
    session.add(row)
    session.commit()
    loaded = session.query(LLMCache).filter_by(cache_key="k").one()
    assert loaded.output == "ok"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_problems.py backend/tests/test_records.py -v`
Expected: FAIL with missing app or endpoint errors.

- [ ] **Step 3: Implement models, schemas, database session, and routers**

Create SQLAlchemy `Problem`, `SolutionRecord`, and `LLMCache` models with the
fields above. Make `SolutionRecord.event_key` and `LLMCache.cache_key` unique.
Configure SQLite via an in-memory or file database and test fixtures `client`
and `session` that create tables for each test. Add `.gitignore` rules for
Python bytecode, virtual environments, and Node `node_modules`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_problems.py backend/tests/test_records.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat: add backend problem and record persistence"
```

---

## Task 2: Niuke Page Parser

**Files:**
- Create: `extension/package.json`
- Create: `extension/tsconfig.json`
- Create: `extension/vitest.config.ts`
- Create: `extension/src/types.ts`
- Create: `extension/src/parser/niuke.ts`
- Test: `extension/src/parser/niuke.test.ts`

**Interfaces:**
- `parseProblemPage(doc: Document): ParsedProblem | null`
- `parseSolvedList(doc: Document): SolvedProblem[]`
- `ParsedProblem` fields: `platform: "niuke"`, `source_id: string`, `title: string`, `difficulty: "easy" | "medium" | "hard"`, `tags: string[]`, `url: string`.
- `SolvedProblem` fields: `source_id: string`, `title: string`, `difficulty: "easy" | "medium" | "hard"`, `tags: string[]`, `url: string`.

Configure Vitest with `environment: "jsdom"` and a `test` script.

- [ ] **Step 1: Write the failing test**

In `extension/src/parser/niuke.test.ts`:

```ts
test("parses a problem page", () => {
  const doc = new DOMParser().parseFromString(
    `<h1 class="subject-title">Two Sum</h1>
     <span class="tag">数组</span><span class="tag">哈希</span>
     <a data-difficulty="1">简单</a>`,
    "text/html",
  );
  const result = parseProblemPage(doc);
  expect(result).not.toBeNull();
  expect(result?.title).toBe("Two Sum");
  expect(result?.difficulty).toBe("easy");
});

test("returns null when required fields are missing", () => {
  const doc = new DOMParser().parseFromString("<div>empty</div>", "text/html");
  expect(parseProblemPage(doc)).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run extension/src/parser/niuke.test.ts`
Expected: FAIL with `parseProblemPage` not exported.

- [ ] **Step 3: Implement parser with selectors and graceful degradation**

Implement `parseProblemPage` and `parseSolvedList` using multiple candidate
selectors for title, difficulty, tags, source id, and URL. Map difficulty text
to the three canonical values. Return `null` or skip entries when required
fields are missing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run extension/src/parser/niuke.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add extension
git commit -m "feat: add niuke page parser"
```

---

## Task 3: Extension Event Queue And Sending

**Files:**
- Create: `extension/src/queue.ts`
- Create: `extension/src/content/niuke.ts`
- Create: `extension/src/background.ts`
- Create: `extension/src/popup.html`
- Create: `extension/src/popup.ts`
- Create: `extension/manifest.json`
- Test: `extension/src/queue.test.ts`

**Interfaces:**
- `eventKey(problem: ParsedProblem, code: string, status: string, submittedAt: string): string`
- `class EventQueue { constructor(read: () => SubmitEvent[], write: (items: SubmitEvent[]) => void); push(event: SubmitEvent): void; async flush(send: (event: SubmitEvent) => Promise<void>): Promise<void> }`
- `SubmitEvent` extends `ParsedProblem` with `code: string`, `status: string`, `submitted_at: string`.

- [ ] **Step 1: Write the failing test**

In `extension/src/queue.test.ts`:

```ts
test("flushes queued events and removes them on success", async () => {
  const store: SubmitEvent[] = [];
  const queue = new EventQueue(
    () => store,
    (items) => { store.length = 0; store.push(...items); },
  );
  const event: SubmitEvent = {
    platform: "niuke", source_id: "NC1", title: "Two Sum",
    difficulty: "easy", tags: ["数组"], url: "https://example.com/1",
    code: "int main(){}", status: "accepted", submitted_at: "2026-09-27T10:00:00",
  };
  queue.push(event);
  const sent: SubmitEvent[] = [];
  await queue.flush(async (e) => { sent.push(e); });
  expect(sent).toHaveLength(1);
  expect(store).toHaveLength(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run extension/src/queue.test.ts`
Expected: FAIL with `EventQueue` not defined.

- [ ] **Step 3: Implement queue, content script, background, and popup**

Implement `eventKey` as a stable hash of platform, source id, status, code, and
submitted time. `EventQueue.flush` retries a failed send by leaving the event in
the store. The content script parses the page and pushes an event; the background
service worker flushes the queue to the configured localhost backend. Keep
`chrome.storage` behind small adapter functions so the queue stays testable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run extension/src/queue.test.ts`
Expected: PASS.

- [ ] **Step 5: Build and commit**

Run: `npm run build`
Expected: build completes without errors.

```bash
git add extension
git commit -m "feat: add extension queue and capture flow"
```

---

## Task 4: Dashboard Scaffold And API Client

**Files:**
- Create: `dashboard/package.json`
- Create: `dashboard/vite.config.ts`
- Create: `dashboard/tsconfig.json`
- Create: `dashboard/vitest.config.ts`
- Create: `dashboard/index.html`
- Create: `dashboard/src/main.tsx`
- Create: `dashboard/src/App.tsx`
- Create: `dashboard/src/api.ts`
- Create: `dashboard/src/types.ts`
- Create: `dashboard/src/utils.ts`
- Test: `dashboard/src/utils.test.ts`

**Interfaces:**
- `api.listProblems(): Promise<ProblemOut[]>`
- `api.listRecords(problemId?: number): Promise<RecordOut[]>`
- `api.getDiagnosis(): Promise<DiagnosisOut>`
- `api.getCoach(problemId: number): Promise<CoachOut>`
- `api.importDemo(): Promise<{ imported: number }>`
- `formatMastery(score: number): string`
- `sortTopics(items: TopicMastery[]): TopicMastery[]`

Configure Vitest and a `test` script in `dashboard/package.json`.

- [ ] **Step 1: Write the failing test**

In `dashboard/src/utils.test.ts`:

```ts
test("formats mastery as an integer percentage", () => {
  expect(formatMastery(61.538)).toBe("62%");
});

test("sorts topics by mastery ascending", () => {
  const items = [
    { tag_id: 1, name: "dp", display_name: "动态规划", mastery: 80 },
    { tag_id: 2, name: "greedy", display_name: "贪心", mastery: 20 },
  ];
  expect(sortTopics(items)[0].name).toBe("greedy");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/utils.test.ts`
Expected: FAIL with `formatMastery` not defined.

- [ ] **Step 3: Implement dashboard shell, API client, and utility functions**

Create a Vite React app with `App` routing between overview, topic, and problem
views. Define TypeScript types matching backend response schemas. Point
`api` at `http://localhost:8000`.

- [ ] **Step 4: Run test and build**

Run: `npm test -- --run src/utils.test.ts`
Expected: PASS.

Run: `npm run build`
Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add dashboard
git commit -m "feat: scaffold dashboard and api client"
```

---

## Task 5: LLM Client, Tagging, And Coaching Content

**Files:**
- Create: `backend/app/services/llm_client.py`
- Create: `backend/app/services/tagging.py`
- Create: `backend/app/services/coaching.py`
- Create: `backend/app/services/cache.py`
- Create: `backend/app/routers/coach.py`
- Modify: `backend/tests/conftest.py`
- Test: `backend/tests/test_tagging.py`
- Test: `backend/tests/test_coaching.py`

**Interfaces:**
- `class LLMClient: def complete(self, prompt: str) -> str`
- `class OpenAICompatibleLLMClient(LLMClient): def __init__(self, config) -> None`
- `assign_tags(problem: Problem, taxonomy: list[Tag], client: LLMClient) -> list[TagAssignment]`
- `generate_explanation(problem: Problem, client: LLMClient) -> str`
- `generate_hints(problem: Problem, client: LLMClient) -> list[str]`
- `generate_solutions(problem: Problem, client: LLMClient) -> list[Solution]`
- `get_or_create(cache_key: str, generate: Callable[[], str]) -> str`
- `GET /problems/{problem_id}/coach` returns `CoachOut`.
- `TagAssignment` fields: `tag_id: int`, `confidence: float`.
- `Solution` fields: `language: str`, `code: str`, `complexity: str`.
- `CoachOut` fields: `explanation: str`, `hints: list[str]`, `solutions: list[Solution]`.

- [ ] **Step 1: Write the failing test**

In `backend/tests/test_tagging.py`:

```python
def test_assign_tags_keeps_only_known_tags(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    tags = [Tag(id=1, name="array"), Tag(id=2, name="hash")]
    result = assign_tags(problem, tags, fake_client)
    assert {a.tag_id for a in result} == {1, 2}

def test_assign_tags_handles_malformed_response(fake_malformed_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    tags = [Tag(id=1, name="array")]
    assert assign_tags(problem, tags, fake_malformed_client) == []
```

In `backend/tests/test_coaching.py`:

```python
def test_coaching_generation_is_cached(fake_client):
    problem = Problem(id=1, platform="niuke", source_id="NC1", title="Two Sum",
                      difficulty="easy", url="u", description=None)
    first = generate_explanation(problem, fake_client)
    second = generate_explanation(problem, fake_client)
    assert first == second
    assert fake_client.calls == 1
```

Add `fake_client` and `fake_malformed_client` fixtures to `backend/tests/conftest.py`.
`fake_client.complete` returns fixed JSON that maps to known tags and counts calls.
`fake_malformed_client.complete` returns text that is not valid JSON.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_tagging.py backend/tests/test_coaching.py -v`
Expected: FAIL with missing modules.

- [ ] **Step 3: Implement LLM client, tagging, coaching, and cache**

Build `OpenAICompatibleLLMClient` around the configured base URL, key, and
model. Prompt the model to return JSON and parse defensively. Map returned tag
names to known `Tag` records. `generate_solutions` returns at least two entries,
each with `language="cpp"` and non-empty `code`. Back `get_or_create` with the
`LLMCache` table from Task 1.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_tagging.py backend/tests/test_coaching.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat: add llm tagging and coaching endpoints"
```

---

## Task 6: Mastery, Diagnosis, And Recommendation

**Files:**
- Create: `backend/app/services/mastery.py`
- Create: `backend/app/services/recommendation.py`
- Create: `backend/app/routers/diagnosis.py`
- Test: `backend/tests/test_mastery.py`
- Test: `backend/tests/test_recommendation.py`

**Interfaces:**
- `compute_tag_mastery(records: Sequence[RecordWithProblem], now: datetime) -> float`
- `build_tag_mastery(records: Sequence[RecordWithProblem], now: datetime) -> dict[int, float]`
- `recommend_problems(mastery: dict[int, float], problems: Sequence[ProblemWithTags]) -> list[int]`
- `RecordWithProblem` fields: `problem_id: int`, `status: str`, `difficulty: str`, `submitted_at: datetime`.
- `ProblemWithTags` fields: `id: int`, `difficulty: str`, `tag_ids: list[int]`, `last_status: str | None`.
- `GET /diagnosis` returns `DiagnosisOut` with tag mastery, weak tags, and recommended problem ids.
- `DiagnosisOut` fields: `tag_mastery: list[TopicMastery]`, `weak_tags: list[TopicMastery]`, `recommendations: list[int]`.
- `TopicMastery` fields: `tag_id: int`, `name: str`, `display_name: str`, `mastery: float`.

- [ ] **Step 1: Write the failing test**

In `backend/tests/test_mastery.py`:

```python
def test_single_easy_acceptance():
    records = [RecordWithProblem(problem_id=1, status="accepted",
                                 difficulty="easy", submitted_at=datetime(2026, 9, 27))]
    assert compute_tag_mastery(records, datetime(2026, 9, 27)) == pytest.approx(61.538, abs=0.001)

def test_later_acceptance_suppresses_earlier_failure():
    records = [
        RecordWithProblem(problem_id=1, status="wrong", difficulty="easy",
                          submitted_at=datetime(2026, 9, 27, 9)),
        RecordWithProblem(problem_id=1, status="accepted", difficulty="easy",
                          submitted_at=datetime(2026, 9, 27, 10)),
    ]
    assert compute_tag_mastery(records, datetime(2026, 9, 27)) == pytest.approx(61.538, abs=0.001)
```

In `backend/tests/test_recommendation.py`:

```python
def test_recommends_unsolved_problem_from_weak_tag():
    mastery = {1: 20.0, 2: 90.0}
    problems = [
        ProblemWithTags(id=10, difficulty="medium", tag_ids=[1], last_status=None),
        ProblemWithTags(id=11, difficulty="medium", tag_ids=[2], last_status=None),
    ]
    assert recommend_problems(mastery, problems)[0] == 10
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_mastery.py backend/tests/test_recommendation.py -v`
Expected: FAIL with missing modules.

- [ ] **Step 3: Implement mastery and recommendation**

Use the Global Constraints formula. Filter out failed records on a problem that
later has an accepted record. Group by tag via the problem-to-tag mapping and
sort weak topics ascending. Rank unsolved problems by weakest tag first, then
difficulty, and deprioritize problems whose last status was a recent failure.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_mastery.py backend/tests/test_recommendation.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat: add mastery diagnosis and recommendation"
```

---

## Task 7: Demo Import And Dashboard Wiring

**Files:**
- Create: `backend/app/routers/demo.py`
- Create: `backend/app/demo_data.py`
- Modify: `backend/app/main.py`
- Create: `dashboard/src/pages/Overview.tsx`
- Create: `dashboard/src/pages/Topic.tsx`
- Create: `dashboard/src/pages/Problem.tsx`
- Create: `dashboard/src/components/MasteryChart.tsx`
- Create: `dashboard/src/components/TopicList.tsx`
- Create: `dashboard/src/components/CoachPanel.tsx`
- Test: `backend/tests/test_demo.py`

**Interfaces:**
- `POST /demo/import` imports the bundled demo dataset and returns `{ "imported": int }`.
- `GET /diagnosis` and `GET /problems/{id}/coach` are consumed by the dashboard pages.

- [ ] **Step 1: Write the failing test**

In `backend/tests/test_demo.py`:

```python
def test_demo_import_populates_dashboard(client):
    response = client.post("/demo/import")
    assert response.status_code == 200
    assert response.json()["imported"] > 0
    diagnosis = client.get("/diagnosis")
    assert diagnosis.status_code == 200
    assert len(diagnosis.json()["tag_mastery"]) > 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_demo.py -v`
Expected: FAIL with missing demo route.

- [ ] **Step 3: Implement demo import and dashboard views**

Bundle a small demo dataset with problems, tags, and submission records. Build
the overview page with a mastery chart, the topic drill-down, and the problem
coach panel. Wire each page to the corresponding API endpoint.

- [ ] **Step 4: Run test and build**

Run: `pytest backend/tests/test_demo.py -v`
Expected: PASS.

Run: `cd dashboard && npm run build`
Expected: build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add backend dashboard
git commit -m "feat: add demo import and dashboard views"
```

---

## Task 8: End-To-End Smoke Test And Documentation

**Files:**
- Create: `backend/tests/test_smoke.py`
- Create: `README.md`

**Interfaces:**
- `POST /demo/import` followed by `GET /diagnosis` and `GET /problems/{id}/coach` must succeed against a running test app.

- [ ] **Step 1: Write the failing smoke test**

In `backend/tests/test_smoke.py`:

```python
def test_end_to_end_smoke(client):
    imported = client.post("/demo/import").json()["imported"]
    assert imported > 0
    diagnosis = client.get("/diagnosis").json()
    assert diagnosis["tag_mastery"]
    first_recommended = diagnosis["recommendations"][0]
    coach = client.get(f"/problems/{first_recommended}/coach")
    assert coach.status_code == 200
    assert coach.json()["solutions"][0]["language"] == "cpp"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_smoke.py -v`
Expected: FAIL if any step in the chain is not yet wired.

- [ ] **Step 3: Fix integration gaps and write README**

Document local setup, backend and dashboard start commands, extension loading
steps, API key configuration, and the demo flow.

- [ ] **Step 4: Run full test suite and build**

Run: `pytest backend/tests -v`
Expected: PASS.

Run: `cd extension && npm test -- --run && npm run build`
Expected: PASS and build completes.

Run: `cd dashboard && npm test -- --run && npm run build`
Expected: PASS and build completes.

- [ ] **Step 5: Commit**

```bash
git add backend README.md
git commit -m "test: add end-to-end smoke test and docs"
```
