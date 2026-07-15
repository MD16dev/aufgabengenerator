import { Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-6 border-t border-theme-border flex flex-col sm:flex-row items-center justify-between gap-4 max-w-6xl w-full mx-auto px-6 text-xs text-theme-muted transition-colors duration-200">
      <p className="font-medium">© {new Date().getFullYear()} AufgabenGenerator. Entwickelt für Uni-Kommilitonen.</p>
      <a
        href="https://github.com/MD16dev/aufgabengenerator"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border text-theme-secondary hover:text-theme-primary font-bold rounded-xl transition-all cursor-pointer shadow-sm"
      >
        <Github className="w-4 h-4" /> GitHub Repository
      </a>
    </footer>
  );
};

export default Footer;
