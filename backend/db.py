from sqlmodel import create_engine, Session
from main import Word_DB

postgre_url = "postgresql://postgres:postgres@localhost:5432/application"

engine = create_engine(postgre_url)
with Session(engine) as session:
    with open("./data/words.txt", "r") as file:
        for line in file:
            pl_word, ru_word = line.replace('\n', '').split(' - ')
            word = Word_DB(
                pl_spelling=pl_word.strip(" "),
                ru_spelling=ru_word.strip(" ")
            )
            print(word)    
            session.add(word)
            session.commit()