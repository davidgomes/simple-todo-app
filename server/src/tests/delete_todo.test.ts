
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a test todo first
    const createResult = await db.insert(todosTable)
      .values({
        description: 'Test todo to delete',
        completed: false
      })
      .returning()
      .execute();

    const createdTodo = createResult[0];
    
    const input: DeleteTodoInput = {
      id: createdTodo.id
    };

    // Delete the todo
    const result = await deleteTodo(input);

    // Should return success
    expect(result.success).toBe(true);

    // Verify todo is actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createdTodo.id))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const input: DeleteTodoInput = {
      id: 999999 // Non-existent ID
    };

    const result = await deleteTodo(input);

    // Should return success false when no rows affected
    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple test todos
    const createResults = await db.insert(todosTable)
      .values([
        { description: 'Todo 1', completed: false },
        { description: 'Todo 2', completed: true },
        { description: 'Todo 3', completed: false }
      ])
      .returning()
      .execute();

    const todoToDelete = createResults[1]; // Delete the middle one
    
    const input: DeleteTodoInput = {
      id: todoToDelete.id
    };

    // Delete one todo
    const result = await deleteTodo(input);
    expect(result.success).toBe(true);

    // Verify only the target todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.find(t => t.id === todoToDelete.id)).toBeUndefined();
    expect(remainingTodos.find(t => t.description === 'Todo 1')).toBeDefined();
    expect(remainingTodos.find(t => t.description === 'Todo 3')).toBeDefined();
  });
});
