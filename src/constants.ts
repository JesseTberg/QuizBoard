import { GameBoard, FinalQuestion } from './types';

export const DEFAULT_BOARDS: GameBoard[] = [
  {
    id: 1,
    name: "Board 1",
    isDoublePoints: false,
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
  },
  {
    id: 2,
    name: "Board 2",
    isDoublePoints: true,
    categories: [
      {
        id: 6,
        title: "Literature",
        questions: [
          { id: 6, text: "Who wrote 'Romeo and Juliet'?", answer: "William Shakespeare", points: 400, isAnswered: false },
          { id: 7, text: "What is the name of the protagonist in '1984'?", answer: "Winston Smith", points: 800, isAnswered: false },
          { id: 8, text: "Who wrote 'To Kill a Mockingbird'?", answer: "Harper Lee", points: 1200, isAnswered: false },
          { id: 9, text: "What is the name of the whale in 'Moby-Dick'?", answer: "Moby Dick", points: 1600, isAnswered: false },
          { id: 10, text: "Who wrote 'The Great Gatsby'?", answer: "F. Scott Fitzgerald", points: 2000, isAnswered: false },
        ]
      },
      {
        id: 7,
        title: "Art",
        questions: [
          { id: 6, text: "Who painted the 'Mona Lisa'?", answer: "Leonardo da Vinci", points: 400, isAnswered: false },
          { id: 7, text: "What art movement is Salvador Dalí associated with?", answer: "Surrealism", points: 800, isAnswered: false },
          { id: 8, text: "Who painted 'The Starry Night'?", answer: "Vincent van Gogh", points: 1200, isAnswered: false },
          { id: 9, text: "What is the name of the famous sculpture by Michelangelo?", answer: "David", points: 1600, isAnswered: false },
          { id: 10, text: "Who is known for his 'Campbell's Soup Cans' art?", answer: "Andy Warhol", points: 2000, isAnswered: false },
        ]
      },
      {
        id: 8,
        title: "Music",
        questions: [
          { id: 6, text: "Who is the 'Queen of Pop'?", answer: "Madonna", points: 400, isAnswered: false },
          { id: 7, text: "What instrument did Jimi Hendrix play?", answer: "Guitar", points: 800, isAnswered: false },
          { id: 8, text: "Who composed the 'Moonlight Sonata'?", answer: "Ludwig van Beethoven", points: 1200, isAnswered: false },
          { id: 9, text: "What is the name of the lead singer of Queen?", answer: "Freddie Mercury", points: 1600, isAnswered: false },
          { id: 10, text: "Who is the 'Material Girl'?", answer: "Madonna", points: 2000, isAnswered: false },
        ]
      },
      {
        id: 9,
        title: "Movies",
        questions: [
          { id: 6, text: "Who directed 'Pulp Fiction'?", answer: "Quentin Tarantino", points: 400, isAnswered: false },
          { id: 7, text: "What is the name of the robot in 'Star Wars'?", answer: "R2-D2 / C-3PO", points: 800, isAnswered: false },
          { id: 8, text: "Who played Iron Man in the MCU?", answer: "Robert Downey Jr.", points: 1200, isAnswered: false },
          { id: 9, text: "What is the name of the fictional kingdom in 'Frozen'?", answer: "Arendelle", points: 1600, isAnswered: false },
          { id: 10, text: "Who directed 'The Godfather'?", answer: "Francis Ford Coppola", points: 2000, isAnswered: false },
        ]
      },
      {
        id: 10,
        title: "Sports",
        questions: [
          { id: 6, text: "How many players are on a soccer team?", answer: "11", points: 400, isAnswered: false },
          { id: 7, text: "What is the name of the professional basketball league in the US?", answer: "NBA", points: 800, isAnswered: false },
          { id: 8, text: "Who is the fastest man in the world?", answer: "Usain Bolt", points: 1200, isAnswered: false },
          { id: 9, text: "What is the name of the annual championship game in the NFL?", answer: "Super Bowl", points: 1600, isAnswered: false },
          { id: 10, text: "Who has won the most Grand Slam titles in tennis?", answer: "Novak Djokovic / Serena Williams", points: 2000, isAnswered: false },
        ]
      }
    ]
  }
];

export const DEFAULT_FINAL_QUESTION: FinalQuestion = {
  category: "World Capitals",
  question: "This city, the capital of its country, is located on the Tiber River.",
  answer: "Rome"
};
