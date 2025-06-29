
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos when they exist', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        { description: 'First todo', completed: false },
        { description: 'Second todo', completed: true },
        { description: 'Third todo', completed: false }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    expect(result[0].description).toEqual('First todo');
    expect(result[0].completed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].description).toEqual('Second todo');
    expect(result[1].completed).toBe(true);

    expect(result[2].description).toEqual('Third todo');
    expect(result[2].completed).toBe(false);
  });

  it('should return todos in database order', async () => {
    // Create todos in specific order
    const todo1 = await db.insert(todosTable)
      .values({ description: 'Todo A', completed: false })
      .returning()
      .execute();

    const todo2 = await db.insert(todosTable)
      .values({ description: 'Todo B', completed: true })
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual(todo1[0].id);
    expect(result[1].id).toEqual(todo2[0].id);
  });
});
