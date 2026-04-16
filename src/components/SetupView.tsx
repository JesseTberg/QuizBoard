import { useState, ChangeEvent } from 'react';
import { GameBoard, Question, FinalQuestion } from '../types';
import { DEFAULT_BOARDS, DEFAULT_FINAL_QUESTION } from '../constants';
import { Plus, Trash2, Play, Monitor, Star, Upload, Download, FileUp, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/TextArea';
import { Card } from './ui/Card';
import { FormGroup } from './ui/FormGroup';
import { cn } from '../lib/utils';

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

  const updateQuestion = (boardIdx: number, catId: number, qId: number, field: keyof Question, value: unknown) => {
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
    setBoards(prev => [...prev, newBoard]);
    setActiveBoardIndex(boards.length);
  };

  const removeBoard = (index: number) => {
    if (boards.length <= 1) return;
    setBoards(prev => {
      const newBoards = prev.filter((_, i) => i !== index).map((b, i) => ({
        ...b,
        name: `Board ${i + 1}`
      }));
      return newBoards;
    });
    setActiveBoardIndex(prev => Math.max(0, prev - 1));
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

  const currentBoard = boards[activeBoardIndex];

  return (
    <main className="setup-container">
      <div className="max-width-container section-spacing">
        <header className="text-center-spacing">
          <Monitor className="w-16 h-16 text-brand-accent mx-auto" />
          <h1 className="game-title">GAME SETUP</h1>
          <p className="text-brand-muted">Customize your boards and questions before starting.</p>
        </header>

        <section className="flex flex-col items-center gap-6 mb-8 pt-8">
          <nav className="flex flex-wrap gap-2 justify-center">
            {boards.map((b, i) => (
              <div key={b.id} className="flex items-center gap-1 relative">
                <Button
                  variant={activeBoardIndex === i ? 'accent' : 'ghost'}
                  onClick={() => setActiveBoardIndex(i)}
                  className="px-6 py-2 rounded font-black italic uppercase transition-all relative"
                >
                  {b.name}
                  {boardsWithErrors.has(i) && (
                    <span className="board-error-dot" />
                  )}
                </Button>
                {boards.length > 1 && (
                  <Button 
                    variant="danger" 
                    size="icon"
                    onClick={() => removeBoard(i)} 
                    className="p-2"
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" onClick={addBoard} className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary">
              <Plus size={16} /> Add Board
            </Button>
          </nav>

          <Card className="flex items-center gap-6 p-6">
            <FormGroup label="Board Name">
              <Input 
                type="text"
                value={currentBoard.name}
                onChange={(e) => updateBoardName(activeBoardIndex, e.target.value)}
                className="bg-transparent border-b border-white/20 focus:border-brand-accent rounded-none px-0 text-xl font-black italic uppercase tracking-tighter text-brand-accent w-48"
              />
            </FormGroup>
            
            <div className="h-10 w-px bg-white/10" />

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">Double Points</span>
              <button 
                onClick={() => toggleDoublePoints(activeBoardIndex)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors relative flex items-center",
                  currentBoard.isDoublePoints ? 'bg-brand-accent' : 'bg-white/10'
                )}
              >
                <div className={cn(
                  "w-4 h-4 bg-white rounded-full transition-transform",
                  currentBoard.isDoublePoints ? 'translate-x-[1.5rem]' : 'translate-x-0'
                )} />
              </button>
            </div>
          </Card>
        </section>

        <section className="flex justify-center gap-4 mb-12">
          <Button variant="ghost" onClick={exportToJSON} className="card-surface px-8">
            <Download size={18} /> Export JSON
          </Button>

          <label className="btn-base btn-ghost btn-size-md card-surface px-8 cursor-pointer">
            <FileUp size={18} /> Import JSON
            <input 
              type="file" 
              accept=".json" 
              onChange={importFromJSON} 
              className="hidden" 
            />
          </label>
        </section>

        <section className="grid-setup mb-16">
          {currentBoard.categories.map(category => (
            <Card key={category.id} className="p-4 flex flex-col gap-4">
              <Input 
                type="text"
                value={category.title}
                onChange={(e) => updateCategoryTitle(activeBoardIndex, category.id, e.target.value)}
                error={!category.title.trim()}
                className="setup-category-input"
                placeholder="Category Name"
              />
              <div className="flex flex-col gap-3">
                {category.questions.map(question => (
                  <article 
                    key={question.id} 
                    className={cn(
                      "setup-question-box",
                      (!question.text.trim() || !question.answer.trim()) && "validation-error-box"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-brand-accent font-black text-sm">{question.points}</span>
                    </div>
                    <Textarea 
                      value={question.text}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'text', e.target.value)}
                      error={!question.text.trim()}
                      className="setup-textarea"
                      placeholder="Question"
                    />
                    <Input 
                      type="text"
                      value={question.answer}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'answer', e.target.value)}
                      error={!question.answer.trim()}
                      className="setup-input-small mt-2"
                      placeholder="Answer"
                    />
                    <div className="flex gap-2 mt-2">
                      <Input 
                        type="text"
                        value={question.imageUrl || ''}
                        onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'imageUrl', e.target.value)}
                        className="setup-input-small flex-1"
                        placeholder="Image URL"
                      />
                      <label className="btn-base btn-ghost btn-size-icon bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors cursor-pointer">
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
                      <div className="mt-2 relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-black/20">
                        <img src={question.imageUrl} alt="Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <Button 
                          variant="danger"
                          size="icon"
                          onClick={() => updateQuestion(activeBoardIndex, category.id, question.id, 'imageUrl', '')}
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </Card>
          ))}
        </section>

        <section className={cn(
          "max-w-2xl mx-auto card-surface p-10 space-y-8 border-t-8",
          finalHasErrors ? "validation-error-section" : "border-brand-accent"
        )}>
          <div className="flex items-center gap-4">
            <Star className={cn("w-8 h-8", finalHasErrors ? 'text-red-500 scale-110' : 'text-brand-accent')} fill="currentColor" />
            <h2 className={cn("text-3xl font-black italic tracking-tighter uppercase", finalHasErrors ? 'text-red-500' : '')}>Final Question</h2>
          </div>
          <div className="flex flex-col gap-6">
            <FormGroup label="Category">
              <Input 
                type="text"
                value={finalQuestion.category}
                onChange={(e) => setFinalQuestion(prev => ({ ...prev, category: e.target.value }))}
                error={!finalQuestion.category.trim()}
                className="setup-category-input"
              />
            </FormGroup>
            <FormGroup label="Question">
              <Textarea 
                value={finalQuestion.question}
                onChange={(e) => setFinalQuestion(prev => ({ ...prev, question: e.target.value }))}
                error={!finalQuestion.question.trim()}
                className="setup-textarea h-32"
              />
            </FormGroup>
            <FormGroup label="Answer">
              <Input 
                type="text"
                value={finalQuestion.answer}
                onChange={(e) => setFinalQuestion(prev => ({ ...prev, answer: e.target.value }))}
                error={!finalQuestion.answer.trim()}
                className="setup-input-small"
              />
            </FormGroup>
            <FormGroup label="Image (URL or Upload)">
              <div className="flex gap-2">
                <Input 
                  type="text"
                  value={finalQuestion.imageUrl || ''}
                  onChange={(e) => setFinalQuestion(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="setup-input-small flex-1"
                  placeholder="https://..."
                />
                <label className="btn-base btn-ghost btn-size-icon bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors cursor-pointer">
                  <Upload size={14} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, (url) => setFinalQuestion(prev => ({ ...prev, imageUrl: url })))}
                  />
                </label>
              </div>
              {finalQuestion.imageUrl && (
                <div className="mt-4 relative group rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/20">
                  <img src={finalQuestion.imageUrl} alt="Final Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <Button 
                    variant="danger"
                    size="icon"
                    onClick={() => setFinalQuestion(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </FormGroup>
          </div>
        </section>

        <footer className="setup-actions mt-16 pb-16 flex flex-col items-center gap-6">
          {validationErrors.length > 0 && (
            <div className="flex flex-col items-center gap-3">
              <div className="validation-error-badge">
                <AlertCircle size={20} />
                <span className="text-sm font-black uppercase tracking-widest">
                  {validationErrors.length} Fields need attention
                </span>
              </div>
              <p className="text-xs text-red-500/80 font-bold uppercase tracking-widest">
                Issues in: {Array.from(new Set(validationErrors.map(e => e.boardIndex === -1 ? 'Final Question' : boards[e.boardIndex].name))).join(', ')}
              </p>
            </div>
          )}
          <Button 
            variant="accent"
            size="lg"
            onClick={() => {
              if (validationErrors.length > 0) {
                alert("Please fill in all red-highlighted fields before starting.");
                return;
              }
              onStart(boards, finalQuestion);
            }}
            className={cn(
              "px-16 py-8 text-3xl italic tracking-tighter btn-accent",
              validationErrors.length > 0 && "opacity-50 grayscale cursor-not-allowed"
            )}
          >
            <Play fill="currentColor" size={28} /> START GAME SESSION
          </Button>
        </footer>
      </div>
    </main>
  );
}
