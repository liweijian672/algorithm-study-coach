from fastapi import FastAPI

from .routers import problems, records

app = FastAPI()
app.include_router(problems.router)
app.include_router(records.router)
