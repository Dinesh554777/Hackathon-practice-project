export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} AI-Shop. All rights reserved.
      </div>
    </footer>
  );
}
