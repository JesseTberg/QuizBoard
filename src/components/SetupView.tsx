import { useState } from 'react';
import { GameBoard, Category, Question } from '../types';
import { DEFAULT_BOARD } from '../constants';
import { Plus, Trash2, Play, Monitor } from 'lucide-react';
import { motion } from 'motion/react';

interface SetupViewProps {
  onStart: (board: GameBoard) => void;
}

export default function SetupView({ onStart }: SetupViewProps) {
  const [board, setBoard] = useState<GameBoard>(DEFAULT_BOARD);

  const updateCategoryTitle = (catId: number, title: string) => {
    setBoard(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? { ...c, title } : c)
    }));
  };

  const updateQuestion = (catId: number, qId: number, field: keyof Question, value: any) => {
    setBoard(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === catId ? {
        ...c,
        questions: c.questions.map(q => q.id === qId ? { ...q, [field]: value } : q)
      } : c)
    }));
  };

  return (
    <div className="setup-container">
      <div className="max-width-container section-spacing">
        <div className="text-center-spacing">
          <Monitor className="w-16 h-16 text-brand-accent mx-auto" />
          <h1 className="jeopardy-title">GAME SETUP</h1>
          <p className="text-brand-muted">Customize your categories and questions before starting.</p>
        </div>

        <div className="grid-setup">
          {board.categories.map(category => (
            <div key={category.id} className="card-surface p-4 space-y-4">
              <input 
                type="text"
                value={category.title}
                onChange={(e) => updateCategoryTitle(category.id, e.target.value)}
                className="setup-category-input"
                placeholder="Category Name"
              />
              <div className="space-y-3">
                {category.questions.map(question => (
                  <div key={question.id} className="setup-question-box space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-brand-accent font-black text-sm">${question.points}</span>
                    </div>
                    <textarea 
                      value={question.text}
                      onChange={(e) => updateQuestion(category.id, question.id, 'text', e.target.value)}
                      className="setup-textarea"
                      placeholder="Question"
                    />
                    <input 
                      type="text"
                      value={question.answer}
                      onChange={(e) => updateQuestion(category.id, question.id, 'answer', e.target.value)}
                      className="setup-input-small"
                      placeholder="Answer"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="setup-actions">
          <button 
            onClick={() => onStart(board)}
            className="btn-accent px-16 py-6 text-2xl italic tracking-tighter"
          >
            <Play fill="currentColor" /> START GAME SESSION
          </button>
          <button 
            onClick={() => onStart(DEFAULT_BOARD)}
            className="btn-primary px-8 py-6 text-xl italic tracking-tighter opacity-50 hover:opacity-100"
            title="Start with default questions"
          >
            QUICK START (TEST)
          </button>
        </div>
      </div>
    </div>
  );
}
