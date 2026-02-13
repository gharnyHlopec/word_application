import '../styles/Delete.css'

function Delete({word, onClose, onDelete}){

    return (
        <div className='backgroundModal' onClick={onClose}>
            <div className='deleteModal' onClick={(e) => e.stopPropagation()}>
                <h2 className='title'>Вы действительно хотите удалить данное слово?</h2>
                <p className='wordToDelete'>{word.pl_spelling} - {word.ru_spelling}</p>
                <div className='buttons'>
                    <button onClick={onClose}>Отмена</button>
                    <button onClick={onDelete} className='deleteWordButton'>Удалить</button>    
                </div>
            </div>
        </div>
    )
}

export default Delete;