
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo completion status to true', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        description: 'Test todo',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.description).toEqual('Test todo');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update todo completion status to false', async () => {
    // Create a completed todo first
    const createResult = await db.insert(todosTable)
      .values({
        description: 'Completed todo',
        completed: true
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: false
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(todoId);
    expect(result.description).toEqual('Completed todo');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated todo in database', async () => {
    // Create a todo first
    const createResult = await db.insert(todosTable)
      .values({
        description: 'Test todo for persistence',
        completed: false
      })
      .returning()
      .execute();

    const todoId = createResult[0].id;

    const updateInput: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    await updateTodo(updateInput);

    // Verify the update was persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].description).toEqual('Test todo for persistence');
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      completed: true
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
