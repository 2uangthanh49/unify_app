import { Todo } from './Todo.js';
import { Zcommand } from './Zcommand.js';

export type UnifyAppSchema = {
  Todo: Todo;
  Zcommand: Zcommand;
};

export const schema = [
  Todo,
  Zcommand
];
