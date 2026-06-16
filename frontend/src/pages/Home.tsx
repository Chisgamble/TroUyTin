import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../services/supabase'

type Todo = {
  id: number
  name: string
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodoName, setNewTodoName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      const { data: todos } = await supabase
        .from('todos')
        .select()

      if (todos) {
        setTodos(todos)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const handleAddTodo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!newTodoName.trim()) return

    const { data, error } = await supabase
      .from('todos')
      .insert([{ name: newTodoName }])
      .select()

    if (!error && data) {
      setTodos((current) => [...current, ...data])
      setNewTodoName('')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Todos</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleAddTodo} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodoName}
              onChange={(e) => setNewTodoName(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a new todo..."
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Add
            </button>
          </div>
        </form>

        <ul className="space-y-2">
          {todos.length > 0 ? (
            todos.map((todo) => (
              <li
                key={todo.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
              >
                {todo.name}
              </li>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No todos yet. Create one to get started!</p>
          )}
        </ul>
      </div>
    </div>
  )
}
