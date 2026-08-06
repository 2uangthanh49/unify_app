import { Todo } from './Todo.js';
import { zscommand } from './zscommand.js';
  
export type UnifyAppSchema = {
  Todo: Todo;
  zscommand: zscommand;
};

export const schema = [
  Todo, 
  zscommand
];
