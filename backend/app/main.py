from fastapi import FastAPI

from .routers import coach, demo, diagnosis, problems, records

app = FastAPI()
app.include_router(problems.router)
app.include_router(records.router)
app.include_router(coach.router)
app.include_router(diagnosis.router)
app.include_router(demo.router)
