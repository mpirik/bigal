import _ from 'lodash';
import {
  getMetadataStorage,
  ColumnModifierMetadata,
  ColumnTypeMetadata,
} from '../metadata';
import { ColumnTypeOptions } from './ColumnTypeOptions';

type ReturnFunctionType = (object: object, propertyName: string) => void;

export function updateDateColumn(options?: ColumnTypeOptions): ReturnFunctionType;
export function updateDateColumn(dbColumnName: string, options?: ColumnTypeOptions): ReturnFunctionType;
export function updateDateColumn(dbColumnNameOrOptions?: string | ColumnTypeOptions, options?: ColumnTypeOptions): ReturnFunctionType {
  return function updateDateColumnDecorator(object: object, propertyName: string) {
    if (dbColumnNameOrOptions) {
      let dbColumnName;
      if (typeof dbColumnNameOrOptions === 'string') {
        dbColumnName = dbColumnNameOrOptions;
      } else {
        dbColumnName = _.snakeCase(propertyName);
        // eslint-disable-next-line no-param-reassign
        options = dbColumnNameOrOptions;
      }

      if (!options) {
        // eslint-disable-next-line no-param-reassign
        options = {} as ColumnTypeOptions;
      }

      const metadataStorage = getMetadataStorage();
      metadataStorage.columns.push(new ColumnTypeMetadata({
        target: object.constructor.name,
        name: dbColumnName,
        propertyName,
        updateDate: true,
        required: options.required,
        type: options.type,
      }));
    } else {
      const metadataStorage = getMetadataStorage();
      metadataStorage.columnModifiers.push({
        updateDate: true,
        target: object.constructor.name,
        propertyName,
      } as ColumnModifierMetadata);
    }
  };
}
