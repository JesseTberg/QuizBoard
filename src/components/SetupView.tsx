import { useState, ChangeEvent } from 'react';
import { GameBoard, Category, Question, FinalQuestion } from '../types';
import { DEFAULT_BOARDS, DEFAULT_FINAL_QUESTION } from '../constants';
import { Plus, Trash2, Play, Monitor, Layers, Star, Upload, Download, FileUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface SetupViewProps {
  onStart: (boards: GameBoard[], finalQuestion: FinalQuestion) => void;
}

export default function SetupView({ onStart }: SetupViewProps) {
  const [boards, setBoards] = useState<GameBoard[]>(DEFAULT_BOARDS);
  const [finalQuestion, setFinalQuestion] = useState<FinalQuestion>(DEFAULT_FINAL_QUESTION);
  const [activeBoardIndex, setActiveBoardIndex] = useState(0);

  const updateCategoryTitle = (boardIdx: number, catId: number, title: string) => {
    setBoards(prev => prev.map((b, i) => i === boardIdx ? {
      ...b,
      categories: b.categories.map(c => c.id === catId ? { ...c, title } : c)
    } : b));
  };

  const updateQuestion = (boardIdx: number, catId: number, qId: number, field: keyof Question, value: any) => {
    setBoards(prev => prev.map((b, i) => i === boardIdx ? {
      ...b,
      categories: b.categories.map(c => c.id === catId ? {
        ...c,
        questions: c.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
      } : c)
    } : b));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDoublePoints = (boardIdx: number) => {
    setBoards(prev => prev.map((b, i) => {
      if (i !== boardIdx) return b;
      const newIsDouble = !b.isDoublePoints;
      return {
        ...b,
        isDoublePoints: newIsDouble,
        categories: b.categories.map(c => ({
          ...c,
          questions: c.questions.map((q, idx) => ({
            ...q,
            points: newIsDouble ? (idx + 1) * 400 : (idx + 1) * 200
          }))
        }))
      };
    }));
  };

  const addBoard = () => {
    const newId = boards.length + 1;
    const newBoard: GameBoard = {
      id: Math.random(),
      name: `Board ${newId}`,
      isDoublePoints: false,
      categories: DEFAULT_BOARDS[0].categories.map(c => ({
        ...c,
        id: Math.random(),
        questions: c.questions.map((q, idx) => ({ 
          ...q, 
          id: Math.random(), 
          isAnswered: false,
          points: (idx + 1) * 200
        }))
      }))
    };
    setBoards([...boards, newBoard]);
    setActiveBoardIndex(boards.length);
  };

  const removeBoard = (index: number) => {
    if (boards.length <= 1) return;
    const newBoards = boards.filter((_, i) => i !== index).map((b, i) => ({
      ...b,
      name: `Board ${i + 1}`
    }));
    setBoards(newBoards);
    setActiveBoardIndex(Math.max(0, activeBoardIndex - 1));
  };

  const updateBoardName = (index: number, name: string) => {
    setBoards(prev => prev.map((b, i) => i === index ? { ...b, name } : b));
  };

  const exportToJSON = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      boards: boards.map(b => ({
        name: b.name,
        isDoublePoints: b.isDoublePoints,
        categories: b.categories.map(c => ({
          title: c.title,
          questions: c.questions.map(q => ({
            text: q.text,
            answer: q.answer,
            imageUrl: q.imageUrl || ""
          }))
        }))
      })),
      finalQuestion: {
        category: finalQuestion.category,
        question: finalQuestion.question,
        answer: finalQuestion.answer,
        imageUrl: finalQuestion.imageUrl || ""
      }
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `trivia_questions_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importFromJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.boards || !Array.isArray(data.boards)) {
          throw new Error("Invalid JSON format: Missing boards array");
        }

        const newBoards: GameBoard[] = data.boards.map((b: any) => ({
          id: Math.random(),
          name: b.name || "Untitled Board",
          isDoublePoints: !!b.isDoublePoints,
          categories: (b.categories || []).slice(0, 5).map((c: any) => ({
            id: Math.random(),
            title: c.title || "Untitled Category",
            questions: (c.questions || []).slice(0, 5).map((q: any, idx: number) => ({
              id: Math.random(),
              points: b.isDoublePoints ? (idx + 1) * 400 : (idx + 1) * 200,
              text: q.text || "",
              answer: q.answer || "",
              imageUrl: q.imageUrl || "",
              isAnswered: false
            }))
          }))
        }));

        // Pad boards to 5x5
        newBoards.forEach(board => {
          while (board.categories.length < 5) {
            board.categories.push({
              id: Math.random(),
              title: "",
              questions: Array.from({ length: 5 }).map((_, idx) => ({
                id: Math.random(),
                points: board.isDoublePoints ? (idx + 1) * 400 : (idx + 1) * 200,
                text: "",
                answer: "",
                imageUrl: "",
                isAnswered: false
              }))
            });
          }
          board.categories.forEach(cat => {
            while (cat.questions.length < 5) {
              cat.questions.push({
                id: Math.random(),
                points: board.isDoublePoints ? (cat.questions.length + 1) * 400 : (cat.questions.length + 1) * 200,
                text: "",
                answer: "",
                imageUrl: "",
                isAnswered: false
              });
            }
          });
        });

        let newFinalQuestion = { ...finalQuestion };
        if (data.finalQuestion) {
          newFinalQuestion = {
            category: data.finalQuestion.category || "",
            question: data.finalQuestion.question || "",
            answer: data.finalQuestion.answer || "",
            imageUrl: data.finalQuestion.imageUrl || ""
          };
        }

        setBoards(newBoards);
        setFinalQuestion(newFinalQuestion);
        setActiveBoardIndex(0);
        alert('Questions imported successfully from JSON!');
      } catch (err) {
        alert('Error parsing JSON: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getValidationErrors = () => {
    const errors: { boardIndex: number; message: string }[] = [];
    boards.forEach((board, bIdx) => {
      board.categories.forEach((category, cIdx) => {
        if (!category.title.trim()) errors.push({ boardIndex: bIdx, message: `${board.name}: Category ${cIdx + 1}` });
        category.questions.forEach((question, qIdx) => {
          if (!question.text.trim()) errors.push({ boardIndex: bIdx, message: `${board.name} - ${category.title || 'Cat ' + (cIdx+1)}: Q${qIdx+1} Text` });
          if (!question.answer.trim()) errors.push({ boardIndex: bIdx, message: `${board.name} - ${category.title || 'Cat ' + (cIdx+1)}: Q${qIdx+1} Answer` });
        });
      });
    });
    if (!finalQuestion.category.trim()) errors.push({ boardIndex: -1, message: "Final: Category" });
    if (!finalQuestion.question.trim()) errors.push({ boardIndex: -1, message: "Final: Question" });
    if (!finalQuestion.answer.trim()) errors.push({ boardIndex: -1, message: "Final: Answer" });
    return errors;
  };

  const validationErrors = getValidationErrors();
  const boardsWithErrors = new Set(validationErrors.filter(e => e.boardIndex !== -1).map(e => e.boardIndex));
  const finalHasErrors = validationErrors.some(e => e.boardIndex === -1);

  return (
    <div className="setup-container">
      <div className="max-width-container section-spacing">
        <div className="text-center-spacing">
          <Monitor className="w-16 h-16 text-brand-accent mx-auto" />
          <h1 className="game-title">GAME SETUP</h1>
          <p className="text-brand-muted">Customize your boards and questions before starting.</p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {boards.map((b, i) => (
              <div key={b.id} className="flex items-center gap-1 relative">
                <button
                  onClick={() => setActiveBoardIndex(i)}
                  className={`px-4 py-2 rounded font-black italic uppercase transition-all relative ${activeBoardIndex === i ? 'bg-brand-accent text-blue-900 scale-105' : 'bg-brand-surface text-brand-muted hover:bg-brand-primary/20'}`}
                >
                  {b.name}
                  {boardsWithErrors.has(i) && (
                    <span className="board-error-dot" />
                  )}
                </button>
                {boards.length > 1 && (
                  <button onClick={() => removeBoard(i)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addBoard} className="px-4 py-2 rounded bg-brand-primary/20 text-brand-primary font-black italic uppercase hover:bg-brand-primary/30 flex items-center gap-2">
              <Plus size={16} /> Add Board
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Board Name</label>
              <input 
                type="text"
                value={boards[activeBoardIndex].name}
                onChange={(e) => updateBoardName(activeBoardIndex, e.target.value)}
                className="bg-transparent border-b border-white/20 focus:border-brand-accent outline-none text-xl font-black italic uppercase tracking-tighter text-brand-accent w-48"
              />
            </div>
            
            <div className="h-10 w-px bg-white/10 mx-2" />

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors">Double Points</span>
                <div 
                  onClick={() => toggleDoublePoints(activeBoardIndex)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${boards[activeBoardIndex].isDoublePoints ? 'bg-brand-accent' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${boards[activeBoardIndex].isDoublePoints ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={exportToJSON}
            className="px-6 py-3 rounded-lg bg-white/5 text-brand-muted font-black italic uppercase hover:bg-white/10 flex items-center gap-2 transition-all border border-white/10 hover:border-white/20"
          >
            <Download size={18} /> Export JSON
          </button>

          <label className="px-6 py-3 rounded-lg bg-white/5 text-brand-muted font-black italic uppercase hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-all border border-white/10 hover:border-white/20">
            <FileUp size={18} /> Import JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={importFromJSON} 
              className="hidden" 
            />
          </label>
        </div>

        <div className="grid-setup mb-12">
          {boards[activeBoardIndex].categories.map(category => (
            <div key={category.id} className="card-surface p-4 space-y-4">
              <input 
                type="text"
                value={category.title}
                onChange={(e) => updateCategoryTitle(activeBoardIndex, category.id, e.target.value)}
                className={`setup-category-input transition-all duration-300 ${!category.title.trim() ? 'validation-error-input' : ''}`}
                placeholder="Category Name"
              />
              <div className="space-y-3">
                {category.questions.map(question => (
                  <div key={question.id} className={`setup-question-box space-y-2 transition-all duration-300 ${(!question.text.trim() || !question.answer.trim()) ? 'validation-error-box' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-brand-accent font-black text-sm">{question.points}</span>
                    </div>
                    <textarea 
                      value={question.text}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'text', e.target.value)}
                      className={`setup-textarea transition-all duration-300 ${!question.text.trim() ? 'validation-error-input' : ''}`}
                      placeholder="Question"
                    />
                    <input 
                      type="text"
                      value={question.answer}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'answer', e.target.value)}
                      className={`setup-input-small transition-all duration-300 ${!question.answer.trim() ? 'validation-error-input' : ''}`}
                      placeholder="Answer"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={question.imageUrl || ''}
                        onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'imageUrl', e.target.value)}
                        className="setup-input-small flex-1"
                        placeholder="Image URL"
                      />
                      <label className="p-2 bg-brand-primary/10 text-brand-primary rounded cursor-pointer hover:bg-brand-primary/20 transition-colors">
                        <Upload size={14} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, (url) => updateQuestion(activeBoardIndex, category.id, question.id, 'imageUrl', url))}
                        />
                      </label>
                    </div>
                    {question.imageUrl && (
                      <div className="mt-2 relative group rounded overflow-hidden border border-white/10 aspect-video bg-black/20">
                        <img src={question.imageUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          onClick={() => updateQuestion(activeBoardIndex, category.id, question.id, 'imageUrl', '')}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={`max-w-2xl mx-auto card-surface p-8 space-y-6 border-t-8 transition-all duration-300 ${finalHasErrors ? 'validation-error-section' : 'border-brand-accent'}`}>
          <div className="flex items-center gap-3">
            <Star className={finalHasErrors ? 'text-red-500 scale-125' : 'text-brand-accent'} fill="currentColor" />
            <h2 className={`text-2xl font-black italic tracking-tighter uppercase ${finalHasErrors ? 'text-red-500' : ''}`}>Final Question</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${finalHasErrors ? 'text-red-400' : 'text-brand-muted'}`}>Category</label>
              <input 
                type="text"
                value={finalQuestion.category}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, category: e.target.value })}
                className={`setup-category-input transition-all duration-300 ${!finalQuestion.category.trim() ? 'validation-error-input' : ''}`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${finalHasErrors ? 'text-red-400' : 'text-brand-muted'}`}>Question</label>
              <textarea 
                value={finalQuestion.question}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, question: e.target.value })}
                className={`setup-textarea transition-all duration-300 ${!finalQuestion.question.trim() ? 'validation-error-input' : ''}`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-black uppercase tracking-widest mb-1 block ${finalHasErrors ? 'text-red-400' : 'text-brand-muted'}`}>Answer</label>
              <input 
                type="text"
                value={finalQuestion.answer}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, answer: e.target.value })}
                className={`setup-input-small transition-all duration-300 ${!finalQuestion.answer.trim() ? 'validation-error-input' : ''}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1 block">Image (URL or Upload)</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={finalQuestion.imageUrl || ''}
                  onChange={(e) => setFinalQuestion({ ...finalQuestion, imageUrl: e.target.value })}
                  className="setup-input-small flex-1"
                  placeholder="https://..."
                />
                <label className="p-2 bg-brand-primary/10 text-brand-primary rounded cursor-pointer hover:bg-brand-primary/20 transition-colors">
                  <Upload size={14} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (url) => setFinalQuestion({ ...finalQuestion, imageUrl: url }))}
                  />
                </label>
              </div>
              {finalQuestion.imageUrl && (
                <div className="mt-4 relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/20">
                  <img src={finalQuestion.imageUrl} alt="Final Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setFinalQuestion({ ...finalQuestion, imageUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="setup-actions mt-8 pb-8 flex flex-col items-center gap-4">
          {validationErrors.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <div className="validation-error-badge">
                <AlertCircle size={20} />
                <span className="text-sm font-black uppercase tracking-widest">
                  {validationErrors.length} Fields need attention
                </span>
              </div>
              <p className="text-[10px] text-red-500/80 font-bold uppercase tracking-widest">
                Issues in: {Array.from(new Set(validationErrors.map(e => e.boardIndex === -1 ? 'Final Question' : boards[e.boardIndex].name))).join(', ')}
              </p>
            </div>
          )}
          <button 
            onClick={() => {
              if (validationErrors.length > 0) {
                alert("Please fill in all red-highlighted fields before starting.");
                return;
              }
              onStart(boards, finalQuestion);
            }}
            className={`btn-accent px-16 py-6 text-2xl italic tracking-tighter ${validationErrors.length > 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          >
            <Play fill="currentColor" /> START GAME SESSION
          </button>
        </div>
      </div>
    </div>
  );
}
