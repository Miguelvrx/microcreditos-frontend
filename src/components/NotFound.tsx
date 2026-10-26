import { Link } from 'react-router-dom';

const TEAL = '#0F766E';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-[#1B1F2A] mb-2">Página no encontrada</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          to="/"
          className="inline-block rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: TEAL }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
