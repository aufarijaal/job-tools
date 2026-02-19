import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-4">Page Not Found</p>
      <p className="text-lg mb-4">The page you are looking for doesn't exist.</p>
      <Link to="/" className="text-blue-500 hover:underline text-lg">Go back to Home</Link>
    </div>
  )
}

export default NotFound
