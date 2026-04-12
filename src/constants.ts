import { GameBoard } from './types';

export const DEFAULT_BOARD: GameBoard = {
  categories: [
    {
      id: 1,
      title: "Science",
      questions: [
        { id: 1, text: "What planet is known as the Red Planet?", answer: "Mars", points: 200, isAnswered: false },
        { id: 2, text: "What is the chemical symbol for Gold?", answer: "Au", points: 400, isAnswered: false },
        { id: 3, text: "What is the hardest natural substance on Earth?", answer: "Diamond", points: 600, isAnswered: false },
        { id: 4, text: "How many bones are in the adult human body?", answer: "206", points: 800, isAnswered: false },
        { id: 5, text: "What is the speed of light in a vacuum?", answer: "299,792,458 m/s", points: 1000, isAnswered: false },
      ]
    },
    {
      id: 2,
      title: "History",
      questions: [
        { id: 1, text: "Who was the first President of the United States?", answer: "George Washington", points: 200, isAnswered: false },
        { id: 2, text: "In what year did World War II end?", answer: "1945", points: 400, isAnswered: false },
        { id: 3, text: "Who was the first woman to win a Nobel Prize?", answer: "Marie Curie", points: 600, isAnswered: false },
        { id: 4, text: "Which empire was ruled by Julius Caesar?", answer: "Roman Empire", points: 800, isAnswered: false },
        { id: 5, text: "What year did the Berlin Wall fall?", answer: "1989", points: 1000, isAnswered: false },
      ]
    },
    {
      id: 3,
      title: "Geography",
      questions: [
        { id: 1, text: "What is the capital of France?", answer: "Paris", points: 200, isAnswered: false },
        { id: 2, text: "Which is the largest ocean on Earth?", answer: "Pacific Ocean", points: 400, isAnswered: false },
        { id: 3, text: "What is the smallest country in the world?", answer: "Vatican City", points: 600, isAnswered: false },
        { id: 4, text: "Which river is the longest in the world?", answer: "Nile", points: 800, isAnswered: false },
        { id: 5, text: "What is the highest mountain in the world?", answer: "Mount Everest", points: 1000, isAnswered: false },
      ]
    },
    {
      id: 4,
      title: "Pop Culture",
      questions: [
        { id: 1, text: "Who played Jack in the movie Titanic?", answer: "Leonardo DiCaprio", points: 200, isAnswered: false },
        { id: 2, text: "What is the name of the fictional city where Batman lives?", answer: "Gotham City", points: 400, isAnswered: false },
        { id: 3, text: "Which artist released the hit song 'Thriller'?", answer: "Michael Jackson", points: 600, isAnswered: false },
        { id: 4, text: "What is the name of the wizarding school in Harry Potter?", answer: "Hogwarts", points: 800, isAnswered: false },
        { id: 5, text: "Who is the 'King of Rock and Roll'?", answer: "Elvis Presley", points: 1000, isAnswered: false },
      ]
    },
    {
      id: 5,
      title: "Technology",
      questions: [
        { id: 1, text: "Who co-founded Microsoft?", answer: "Bill Gates", points: 200, isAnswered: false },
        { id: 2, text: "What does 'WWW' stand for?", answer: "World Wide Web", points: 400, isAnswered: false },
        { id: 3, text: "In what year was the first iPhone released?", answer: "2007", points: 600, isAnswered: false },
        { id: 4, text: "What is the main language used for Android development?", answer: "Kotlin/Java", points: 800, isAnswered: false },
        { id: 5, text: "What does 'CPU' stand for?", answer: "Central Processing Unit", points: 1000, isAnswered: false },
      ]
    }
  ]
};
