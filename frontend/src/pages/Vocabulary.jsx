import {useEffect, useState, useRef, useMemo} from 'react';
import {useNavigate} from 'react-router-dom'
import "../styles/Vocabulary.css"
import Delete from './Delete';

function Vocabulary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState([]);
  const [modalData, setModalData] = useState(null);
  
  const polishAddInputRef = useRef();
  const russianAddInputRef = useRef();

  const polishEditInputRef = useRef();
  const russianEditInputRef = useRef();

  const [idToEdit, setIdToEdit] = useState(-1);

  let navigate = useNavigate();

  const searchedData = useMemo(() => {
    if (searchQuery){
      return data.filter(word => word.pl_spelling.toLowerCase().includes(searchQuery) || 
                         word.ru_spelling.toLowerCase().includes(searchQuery))
    }
    return data
  }, [data, searchQuery])

  useEffect(() => {
    if (idToEdit !== -1){
      const record = data.find(item => item.id === idToEdit)
      polishEditInputRef.current.value = record.pl_spelling;
      russianEditInputRef.current.value = record.ru_spelling;
    }
  },[idToEdit]);

  function openWordAddForm(){
    const button = document.querySelector(".openWordAddFormButton");
    const form = document.querySelector(".wordAddForm");

    if (button && form) {
      button.style.display = 'none';
      form.style.display = 'flex';
    }
  }

  async function deleteWord(id){
    try{
      const response = await fetch(`http://localhost:8000/vocabulary/delete/${id}`,
        {
          method:'POST',
        });
      
        if (response.ok){
          setData(prevData => prevData.filter(word => word.id !== id));
        }
      } catch (error){
        console.error(error);
      }
    }

  async function editWord(event,id){
    event.preventDefault();
    let formData = new FormData(event.target);
    formData = Object.fromEntries(formData);
    try{
      const response = await fetch(`http://localhost:8000/vocabulary/edit/${id}`,
        {
          method:'PUT',
          headers:{
            'Content-Type':'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok){
          const responseData = await response.json()
          setData(prevData =>[
            ...prevData.filter(word => word.id < id),
            responseData.word,
            ...prevData.filter(word => word.id > id)
          ])
          setIdToEdit(-1);
        }
      } catch (error){
        console.error(error);
      }
    }

async function submitNewWord(e){
    e.preventDefault()
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData); 

    try{
      const response = await fetch('http://localhost:8000/vocabulary/add',{
        method: 'POST',
        headers:{
          'Content-Type':'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok){
        polishAddInputRef.current.value = '';
        russianAddInputRef.current.value = '';
        const data = await response.json();
        setData(prevData => [...prevData, data.word])
      }
    } 
    catch(error) {
      console.log(error);
    }
  }


  async function fetchWords() {
    try{
      const response = await fetch("http://localhost:8000/vocabulary");
      const data = await response.json();
      setData(data)
    } catch (error){
      console.log(error)
    }
  }
  
  useEffect(() => {
    fetchWords()
  },[]);
  
  return (
    <div className="vocabulary">
      <button className="button trainingButton" onClick={() => navigate("/training?mode=pl-to-ru")}>Тренеровка PL → RU</button>
      <button className="button trainingButton" onClick={() => navigate("/training?mode=ru-to-pl")}>Тренеровка RU → PL</button>
      <input
        className='searchInput'
        placeholder='&#128269;Поиск...'
        value = {searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <form className="wordAddForm" onSubmit={submitNewWord}>
        <input
          ref={polishAddInputRef}
          placeholder="Слово на польском"
          name="pl_spelling"
        />
        <input
          ref={russianAddInputRef}
          placeholder="Перевод на русский"
          name="ru_spelling"
        />
        <button className='button'>Добавить слово</button>
      </form>
      <button className="button openWordAddFormButton" onClick={openWordAddForm}>Добавить слово</button>
      {modalData && <Delete 
                      word={modalData} 
                      onClose={() => {setModalData(null)}} 
                      onDelete={() => {
                        deleteWord(modalData.id);
                        setModalData(null);
                      }}
                    />}
      <div>
        {searchedData ? (
          <div>
            {searchedData.map((elem) => (
              <div key={elem.id} id={elem.id} className="record">
                {elem.id === idToEdit ? (
                  <form className="editRecordForm" onSubmit={(event) => {editWord(event, elem.id)}}>
                    <input
                      placeholder="Слово на польском"
                      name="pl_spelling"
                      ref={polishEditInputRef}
                    />
                    <input
                      placeholder="Перевод на русский"
                      name="ru_spelling"
                      ref={russianEditInputRef}
                    />
                    <span className="cancelButton" onClick={() => setIdToEdit(-1)}>
                      &#10005;
                    </span>
                    <button type="submit" style={{all: 'unset'}}>
                      <span className="applyButton">
                        &#10003;
                      </span>
                    </button>
                  </form>
                ) : (
                  <p className="vocabularyWord">
                    {elem.pl_spelling} - {elem.ru_spelling} 
                    <span className="deleteButton" onClick={() => setModalData(elem)}>
                      &#128465;
                    </span>
                    <span className="editButton" onClick={() => setIdToEdit(elem.id)}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
          ): (
            <p>Загрузка...</p>
        )}
      </div>
    </div>
  );
}

export default Vocabulary;
