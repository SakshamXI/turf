import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line/10 py-6 mt-12">
      <div className="max-w-4xl mx-auto px-6 text-sm text-pitchDark/60 flex justify-between">
        <span>© {new Date().getFullYear()} Game on Arena</span>
        <span className="flex items-center gap-4">
          <span>Udhampur</span>
          
        </span>
      </div>
    </footer>
  );
}
