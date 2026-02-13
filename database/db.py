from sqlmodel import create_engine, Session, SQLModel, Field

class WordDB(SQLModel, table = True):
    id: int = Field(primary_key = True)
    pl_spelling: str = Field(index = True)
    ru_spelling: str = Field(index = True)

postgre_url = "postgresql://postgres:postgres@localhost:5432/application"
engine = create_engine(postgre_url)
with Session(engine) as session:
    with open("edited_words.txt", "r") as file:
        for line in file:
            pl_word, ru_word = line.replace('\n', '').split(' - ')
            word = WordDB(
                pl_spelling=pl_word.strip(" "),
                ru_spelling=ru_word.strip(" ")
            )
            print(word)    
            session.add(word)
            session.commit()