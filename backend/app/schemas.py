from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProblemIn(BaseModel):
    platform: str
    source_id: str
    title: str
    difficulty: str
    url: str
    description: str | None = None


class ProblemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    platform: str
    source_id: str
    title: str
    difficulty: str
    url: str
    description: str | None


class RecordIn(BaseModel):
    problem_id: int
    status: str
    language: str
    code: str
    time_cost_ms: int | None = None
    memory_cost_kb: int | None = None
    submitted_at: datetime
    event_key: str


class RecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    problem_id: int
    status: str
    language: str
    code: str
    time_cost_ms: int | None
    memory_cost_kb: int | None
    submitted_at: datetime
    event_key: str


class SolutionOut(BaseModel):
    language: str
    code: str
    complexity: str


class CoachOut(BaseModel):
    explanation: str
    hints: list[str]
    solutions: list[SolutionOut]


class TopicMasteryOut(BaseModel):
    tag_id: int
    name: str
    display_name: str
    mastery: float


class DiagnosisOut(BaseModel):
    tag_mastery: list[TopicMasteryOut]
    weak_tags: list[TopicMasteryOut]
    recommendations: list[int]

