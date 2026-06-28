from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Field, Session, SQLModel, create_engine, text
from typing import Annotated
from pydantic import BaseModel
from io import BytesIO


class WordData(BaseModel):
    pl_spelling: str
    ru_spelling: str

class Word_DB(SQLModel, table = True):
    id: int = Field(primary_key = True)
    pl_spelling: str = Field(index = True)
    ru_spelling: str = Field(index = True)

class WordForTrainingPLtoRU(BaseModel):
    id: int
    fixedWordSpelling: str
    draggableWordSpelling: str
    
class WordForTrainingRUtoPL(BaseModel):
    id: int
    draggableWordSpelling: str
    fixedWordSpelling: str

postgre_url = "postgresql://postgres:postgres@postgres:5432/application"
engine = create_engine(postgre_url)

def create_db_and_tables():
    # Используем явный контекстный менеджер (with engine.begin())
    # Это гарантирует, что соединение откроется, создаст таблицы, 
    # закоммитит транзакцию и СРАЗУ ЖЕ жестко закроется, освободив базу.
    with engine.begin() as connection:
        SQLModel.metadata.create_all(connection)


def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def read_root():
    return {"message":"Hello World"}

@app.get("/vocabulary")
def show_words(session: SessionDep) -> list[Word_DB]:
    query = text("SELECT * FROM Word_DB ORDER BY id")
    result = session.exec(query)
    return result.all()

@app.get("/get_words")
def get_words(session: SessionDep, mode: str) -> list[WordForTrainingRUtoPL]:
    query = text("SELECT * FROM Word_DB")
    result = session.exec(query)
    if mode == 'ru-to-pl':
        return [WordForTrainingRUtoPL(
                id=item[0],
                fixedWordSpelling=item[1],
                draggableWordSpelling=item[2]
            )
        for item in result.all()
        ]
    elif mode == 'pl-to-ru':
        return [WordForTrainingPLtoRU(
            id=item[0],
            draggableWordSpelling=item[1],
            fixedWordSpelling=item[2]
            )
        for item in result.all()]
    else:
        raise HTTPException(status_code=404, detail="Incorrect training mode")

@app.post("/vocabulary/add")
def add_word(word_data: Word_DB, session: SessionDep):    
    word = Word_DB(
        pl_spelling=word_data.pl_spelling,
        ru_spelling=word_data.ru_spelling
    )
    session.add(word)
    session.commit()
    session.refresh(word)
    return {"message": "Word added", "word":word}

@app.post("/vocabulary/delete/{word_id}")
def delete_word(word_id: int, session: SessionDep):
    word = session.get(Word_DB, word_id)
    if not word: 
        raise HTTPException(status_code=404, detail="No such word")
    session.delete(word)
    session.commit()
    
    return {"message": "Word deleted successfully"}

@app.put("/vocabulary/edit/{word_id}")
def edit_word(word_id: int, word_data: WordData, session: SessionDep):
    word = session.get(Word_DB, word_id)
    if not word:
        raise HTTPException(status_code=404, detail="No such word")

    word.pl_spelling = word_data.pl_spelling
    word.ru_spelling = word_data.ru_spelling

    session.commit()
    session.refresh(word)

    return {"message": "Word updated", "word": word}

@app.get("/get_vocabulary")
def get_vocabulary(session: SessionDep):
    query = text("SELECT * FROM Word_DB")
    result = session.exec(query)
    content = ''
    for record in result.all():
        content += f"{record[1].strip()} - {record[2].strip()}\n"
    buffer = BytesIO(content[:-1].encode('utf-8'))
    return StreamingResponse(
        buffer,
        media_type='text/plain',
        headers={
            'Content-Disposition':'attachment; filename="vocabulary.txt"'
        }
    )