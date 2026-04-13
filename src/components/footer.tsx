export const Footer = () => {
  return (
    <footer className="py-12 border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:row justify-between items-center gap-6 text-zinc-500 text-sm">
        <p>Built with React</p>
        <div className="flex gap-8">
          <a href="https://github.com/JesseTberg/QuizBoard" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
};