
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
// Using type-only import for better TypeScript compliance
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  // Explicit typing with Todo interface
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state with proper typing
  const [newTodoDescription, setNewTodoDescription] = useState('');

  // useCallback to memoize function used in useEffect
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps since trpc is stable

  // useEffect with proper dependencies
  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoDescription.trim()) return;
    
    setIsCreating(true);
    try {
      const createTodoInput: CreateTodoInput = {
        description: newTodoDescription.trim()
      };
      
      const newTodo = await trpc.createTodo.mutate(createTodoInput);
      // Update todos list with explicit typing in setState callback
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      // Reset form
      setNewTodoDescription('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      
      // Update the specific todo in the list
      setTodos((prev: Todo[]) => 
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    try {
      const result = await trpc.deleteTodo.mutate({ id: todoId });
      if (result.success) {
        // Remove the todo from the list
        setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ✅ Todo List
          </h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
        </div>

        {/* Create Todo Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Todo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTodo} className="flex gap-2">
              <Input
                placeholder="What needs to be done? 🚀"
                value={newTodoDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoDescription(e.target.value)
                }
                className="flex-1"
                disabled={isCreating}
                required
              />
              <Button type="submit" disabled={isCreating || !newTodoDescription.trim()}>
                {isCreating ? '➕' : <Plus className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Stats */}
        {totalCount > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              📋 Total: {totalCount}
            </Badge>
            <Badge variant="default" className="text-sm px-4 py-2 bg-green-500">
              ✅ Completed: {completedCount}
            </Badge>
            <Badge variant="outline" className="text-sm px-4 py-2">
              ⏳ Remaining: {totalCount - completedCount}
            </Badge>
          </div>
        )}

        {/* Todo List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Your Todos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading your todos...</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <Circle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No todos yet! 🎉</p>
                <p className="text-gray-400">Add your first todo above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo: Todo, index: number) => (
                  <div key={todo.id}>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      todo.completed 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-white border border-gray-200 hover:border-blue-300'
                    }`}>
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggleComplete(todo)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-800'
                        }`}>
                          {todo.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          📅 Created: {todo.created_at.toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {index < todos.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>💡 <strong>Note:</strong> Backend handlers are currently using placeholder implementations.</p>
          <p>Data will not persist between sessions until database integration is completed.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
