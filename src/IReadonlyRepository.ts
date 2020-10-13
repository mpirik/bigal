import { CountResult, FindArgs, FindOneArgs, FindOneResult, FindResult, WhereQuery } from './query';
import { Entity } from './Entity';
import { ModelMetadata } from './metadata';

export interface IReadonlyRepository<T extends Entity> {
  readonly model: ModelMetadata<T>;

  /**
   * Gets a single object
   * @param {object} [args] - Arguments
   * @param {string[]} [args.select] - Array of model property names to return from the query.
   * @param {object} [args.where] - Object representing the where query
   * @param {string|object|string[]|object[]} [args.sort] - Property name(s) to sort by
   */
  findOne(args: FindOneArgs | WhereQuery): FindOneResult<T>;

  /**
   * Gets a collection of objects
   * @param {object} [args] - Arguments
   * @param {string[]} [args.select] - Array of model property names to return from the query.
   * @param {object} [args.where] - Object representing the where query
   * @param {string|object|string[]|object[]} [args.sort] - Property name(s) to sort by
   * @param {string|number} [args.skip] - Number of records to skip
   * @param {string|number} [args.limit] - Number of results to return
   */
  find(args: FindArgs | WhereQuery): FindResult<T>;

  /**
   * Gets a count of rows matching the where query
   * @param {object} [where] - Object representing the where query
   * @returns {number} Number of records matching the where criteria
   */
  count(where?: WhereQuery): CountResult<T>;
}
