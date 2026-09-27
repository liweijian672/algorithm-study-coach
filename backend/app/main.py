from contextlib import asynccontextmanager

from fastapi import FastAPI

from .db import Base, engine
from .routers import coach, demo, diagnosis, problems, records


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(problems.router)
app.include_router(records.router)
app.include_router(coach.router)
app.include_router(diagnosis.router)
app.include_router(demo.router)
