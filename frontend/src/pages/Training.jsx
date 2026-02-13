import { useState, useEffect, useRef, useCallback } from "react";
import { CSSTransition } from "react-transition-group";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Training.css"

function Training() {
  const [data, setData] = useState([]);
  const [wordsToGuessFrom, setWordsToGuessFrom] = useState([]);
  const [wordToMatch, setWordToMatch] = useState("");
  const [toShowResult, setToShowResult] = useState(false);
  const [toShowWords, setToShowWords] = useState(true);
  const [result, setResult] = useState("");

  const navigate = useNavigate();

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get("mode");

  const nodeRef = useRef(null);
  const wordsNodeRef = useRef(null);
  const wordToMatchRef = useRef("");
  const wordsToGuessFromRef = useRef([]);
  const isDraggingRef = useRef(false);
  const draggableDivRef = useRef(null);
  const offsetRef = useRef({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    fetchWords();
  }, []);


  useEffect(() => {
    if (data.length > 0) getRandomWords();
  }, [data, setData]);

  useEffect(() => {
    wordToMatchRef.current = wordToMatch;
  }, [wordToMatch]);

  useEffect(() => {
    wordsToGuessFromRef.current = wordsToGuessFrom;
  }, [wordsToGuessFrom]);

  const handleMouseDown = useCallback((e) => {
    const rect = draggableDivRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  });

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    draggableDivRef.current.style.transform = "translate(0, 0)";

    draggableDivRef.current.style.left = e.clientX - offsetRef.current.x + "px";
    draggableDivRef.current.style.top = e.clientY - offsetRef.current.y + "px";
  });

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    offsetRef.current = {
      x: 0,
      y: 0,
    };
    const fixedWords = document.querySelectorAll(".fixedWord"); // массив фиксированных слов
    const draggableDivRect = draggableDivRef.current.getBoundingClientRect(); // координаты перетаскиваемого слова
    const draggableDivCenterX =
      (draggableDivRect.left + draggableDivRect.right) / 2; // центр по X перетаскиваемого слова
    const draggableDivCenterY =
      (draggableDivRect.bottom + draggableDivRect.top) / 2; // центр по Y перетаскиваемого слова
    for (const word of fixedWords) {
      const fixedWordRect = word.getBoundingClientRect(); // координаты каждого фиксированного слова
      const fixedWordText = document.getElementById(
        // текст каждого фиксированного слова
        word.id
      ).innerText;

      if (
        fixedWordRect.top < draggableDivCenterY &&
        fixedWordRect.bottom > draggableDivCenterY &&
        fixedWordRect.left < draggableDivCenterX &&
        fixedWordRect.right > draggableDivCenterX
      ) {
        if (
          wordToMatchRef.current ===
          wordsToGuessFromRef.current.find(
            (item) => item.fixedWordSpelling === fixedWordText
          ).draggableWordSpelling
        ) {
          setResult("Правильно!");
        } else {
          const correctWord = wordsToGuessFromRef.current.find(
            (item) => item.draggableWordSpelling === wordToMatchRef.current
          );
          setResult(
            "Неправильно. Правильный вариант: " +
              correctWord.draggableWordSpelling +
              " - " +
              correctWord.fixedWordSpelling
          );
        }
        setToShowWords(false);
      }
    }

    draggableDivRef.current.style.transform = "";
    draggableDivRef.current.style.left = "";
    draggableDivRef.current.style.top = "";

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });

  function getRandomWords() {
    const shuffledWords = [...data];
    for (let i = shuffledWords.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
    }
    const selectedWords = shuffledWords.slice(0, 4);
    setWordsToGuessFrom(selectedWords);
    const index = Math.floor(Math.random() * 4);
    setWordToMatch(selectedWords[index].draggableWordSpelling);
  }

  async function fetchWords() {
    try{
      const response = await fetch(`http://localhost:8000/get_words?mode=${mode}`);
      const data = await response.json();
      setData(data)
    } catch (error){
      console.log(error)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setToShowResult(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [wordsToGuessFrom, setWordsToGuessFrom]);

  return (
    <div>
      <button className="backToVocabularyButton"
      onClick={() => {
        navigate('/vocabulary');
      }}> 
        Вернуться к словарю
      </button>
    <div className="training">
      <CSSTransition
        nodeRef={nodeRef}
        classNames="resultTransition"
        in={toShowResult}
        timeout={300}
        unmountOnExit
        onEnter={() => {
          if (result.includes("Правильно")) {
            nodeRef.current.style.backgroundColor = "lightgreen";
          } else {
            nodeRef.current.style.backgroundColor = "#FFCCCB";
          }
        }}
        onExited={() => setToShowWords(true)}
      >
        <div
          ref={nodeRef}
          className="resultDiv"
          onClick={() => {
            setToShowResult(false);
          }}
        >
          {result}
        </div>
      </CSSTransition>
      <CSSTransition
        nodeRef={wordsNodeRef}
        classNames="wordsTransition"
        in={toShowWords}
        timeout={300}
        unmountOnExit
        onExit={() => {
          draggableDivRef.current.style.display = "none";
        }}
        onExited={() => {
          draggableDivRef.current.style.display = "";
          setToShowResult(true);
          getRandomWords();
        }}
      >
        <div className="words" ref={wordsNodeRef} id="words">
          {wordsToGuessFrom.map((elem) => (
            <div
              key={elem.id}
              id={`word-${wordsToGuessFrom.indexOf(elem)}`}
              className="word fixedWord"
            >
              {elem.fixedWordSpelling}
            </div>
          ))}
          <br />
          <br />
          <br />
          <div
            id="draggableWord"
            className="word"
            ref={draggableDivRef}
            onMouseDown={handleMouseDown}
          >
            {wordToMatch}
          </div>
        </div>
      </CSSTransition>
    </div>
    </div>

  );
}

export default Training;
