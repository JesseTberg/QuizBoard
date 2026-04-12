import { useState } from 'react';
import { GameBoard, Category, Question, FinalQuestion } from '../types';
import { DEFAULT_BOARDS, DEFAULT_FINAL_QUESTION } from '../constants';
import { Plus, Trash2, Play, Monitor, Layers, Star } from 'lucide-react';
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

  return (
    <div className="setup-container">
      <div className="max-width-container section-spacing">
        <div className="text-center-spacing">
          <Monitor className="w-16 h-16 text-brand-accent mx-auto" />
          <h1 className="game-title">GAME SETUP</h1>
          <p className="text-brand-muted">Customize your boards and questions before starting.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {boards.map((b, i) => (
            <div key={b.id} className="flex items-center gap-1">
              <button
                onClick={() => setActiveBoardIndex(i)}
                className={`px-4 py-2 rounded font-black italic uppercase transition-all ${activeBoardIndex === i ? 'bg-brand-accent text-blue-900 scale-105' : 'bg-brand-surface text-brand-muted hover:bg-brand-primary/20'}`}
              >
                {b.name}
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

        <div className="flex justify-center mb-8">
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-xs font-black uppercase tracking-widest text-brand-muted group-hover:text-brand-primary transition-colors">Double Points for {boards[activeBoardIndex].name}</span>
            <div 
              onClick={() => toggleDoublePoints(activeBoardIndex)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${boards[activeBoardIndex].isDoublePoints ? 'bg-brand-accent' : 'bg-white/10'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${boards[activeBoardIndex].isDoublePoints ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>

        <div className="grid-setup mb-12">
          {boards[activeBoardIndex].categories.map(category => (
            <div key={category.id} className="card-surface p-4 space-y-4">
              <input 
                type="text"
                value={category.title}
                onChange={(e) => updateCategoryTitle(activeBoardIndex, category.id, e.target.value)}
                className="setup-category-input"
                placeholder="Category Name"
              />
              <div className="space-y-3">
                {category.questions.map(question => (
                  <div key={question.id} className="setup-question-box space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-accent font-black text-sm">{question.points}</span>
                    </div>
                    <textarea 
                      value={question.text}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'text', e.target.value)}
                      className="setup-textarea"
                      placeholder="Question"
                    />
                    <input 
                      type="text"
                      value={question.answer}
                      onChange={(e) => updateQuestion(activeBoardIndex, category.id, question.id, 'answer', e.target.value)}
                      className="setup-input-small"
                      placeholder="Answer"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto card-surface p-8 space-y-6 border-t-4 border-brand-accent">
          <div className="flex items-center gap-3">
            <Star className="text-brand-accent" fill="currentColor" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Final Question</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1 block">Category</label>
              <input 
                type="text"
                value={finalQuestion.category}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, category: e.target.value })}
                className="setup-category-input"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1 block">Question</label>
              <textarea 
                value={finalQuestion.question}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, question: e.target.value })}
                className="setup-textarea"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1 block">Answer</label>
              <input 
                type="text"
                value={finalQuestion.answer}
                onChange={(e) => setFinalQuestion({ ...finalQuestion, answer: e.target.value })}
                className="setup-input-small"
              />
            </div>
          </div>
        </div>

        <div className="setup-actions mt-12">
          <button 
            onClick={() => onStart(boards, finalQuestion)}
            className="btn-accent px-16 py-6 text-2xl italic tracking-tighter"
          >
            <Play fill="currentColor" /> START GAME SESSION
          </button>
        </div>
      </div>
    </div>
  );
}
