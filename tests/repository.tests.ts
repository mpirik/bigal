import chai from 'chai';
import * as _ from 'lodash';
import * as faker from 'faker';
import { Pool } from 'postgres-pool';
import {
  anyString,
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito';
import {
  initialize,
  Repository,
} from '../src';
import {
  Product,
  ProductWithCreateUpdateDateTracking,
  Store,
} from './models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getQueryResult(rows: any[] = []) {
  return {
    command: 'select',
    rowCount: 1,
    oid: 1,
    fields: [],
    rows,
  };
}

describe('Repository', () => {
  let should: Chai.Should;
  const mockedPool: Pool = mock(Pool);
  let ProductRepository: Repository<Product>;
  let ProductWithCreateUpdateDateTrackingRepository: Repository<ProductWithCreateUpdateDateTracking>;

  before(() => {
    should = chai.should();

    const repositoriesByModelNameLowered = initialize({
      models: [
        Product,
        ProductWithCreateUpdateDateTracking,
        Store,
      ],
      pool: instance(mockedPool),
    });

    ProductRepository = repositoriesByModelNameLowered.product as Repository<Product>;
    ProductWithCreateUpdateDateTrackingRepository = repositoriesByModelNameLowered.productwithcreateupdatedatetracking as Repository<Product>;
  });

  beforeEach(async () => {
    reset(mockedPool);
  });

  describe('#create()', () => {
    it('should execute beforeCreate if defined as a schema method', async () => {
      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([{
          id: 42,
        }]),
      );

      await ProductWithCreateUpdateDateTrackingRepository.create({
        name: 'foo',
      });

      verify(mockedPool.query(anyString(), anything())).once();
      const [,
        params,
      ] = capture(mockedPool.query).first();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        'beforeCreate - foo',
        [],
      ]);
    });
    it('should return single object result if single value is specified', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const result = await ProductRepository.create({
        name: product.name,
        store: product.store,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      should.exist(result);
      result.should.deep.equal(product);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('INSERT INTO "products" ("name","alias_names","store_id") VALUES ($1,$2,$3) RETURNING "id","name","sku","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        [],
        product.store,
      ]);
    });
    it('should return single object result if single value is specified - Promise.all', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const [
        result,
      ] = await Promise.all([
        ProductRepository.create({
          name: product.name,
          store: product.store,
        }),
      ]);

      verify(mockedPool.query(anyString(), anything())).once();
      should.exist(result);
      result.should.deep.equal(product);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('INSERT INTO "products" ("name","alias_names","store_id") VALUES ($1,$2,$3) RETURNING "id","name","sku","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        [],
        product.store,
      ]);
    });
    it('should return true if single value is specified and returnRecords=false', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const result = await ProductRepository.create({
        name: product.name,
        store: product.store,
      }, {
        returnRecords: false,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      should.exist(result);
      result.should.equal(true);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('INSERT INTO "products" ("name","alias_names","store_id") VALUES ($1,$2,$3)');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        [],
        product.store,
      ]);
    });
    it('should return empty array results if empty value array is specified', async () => {
      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([]),
      );

      const result = await ProductRepository.create([]);

      verify(mockedPool.query(anyString(), anything())).never();
      should.exist(result);
      result.should.deep.equal([]);
    });
    it('should return object array results if multiple values are specified', async () => {
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );

      const result = await ProductRepository.create(products.map((product) => ({
          name: product.name,
          store: product.store,
        })));

      verify(mockedPool.query(anyString(), anything())).once();
      result.should.deep.equal(products);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('INSERT INTO "products" ("name","alias_names","store_id") VALUES ($1,$3,$5),($2,$4,$6) RETURNING "id","name","sku","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        products[0].name,
        products[1].name,
        [],
        [],
        products[0].store,
        products[1].store,
      ]);
    });
    it('should return true if multiple values are specified and returnRecords=false', async () => {
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );

      const result = await ProductRepository.create(products.map((product) => ({
          name: product.name,
          store: product.store,
        })), {
        returnRecords: false,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      result.should.equal(true);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('INSERT INTO "products" ("name","alias_names","store_id") VALUES ($1,$3,$5),($2,$4,$6)');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        products[0].name,
        products[1].name,
        [],
        [],
        products[0].store,
        products[1].store,
      ]);
    });
  });
  describe('#update()', () => {
    it('should execute beforeUpdate if defined as a schema method', async () => {
      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([{
          id: 42,
        }]),
      );

      await ProductWithCreateUpdateDateTrackingRepository.update({
        id: faker.random.uuid(),
      }, {
        name: 'foo',
      });

      verify(mockedPool.query(anyString(), anything())).once();
      const [,
        params,
      ] = capture(mockedPool.query).first();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        'beforeUpdate - foo',
      ]);
    });
    it('should return array of updated objects if second parameter is not defined', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const result = await ProductRepository.update({
        id: product.id,
      }, {
        name: product.name,
        store: product.store,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      result.should.deep.equal([product]);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('UPDATE "product" SET "name"=$1,"store_id"=$2 WHERE "id"=$3 RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        product.store,
        product.id,
      ]);
    });
    it('should return array of updated objects if second parameter is not defined - Promise.all', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const [
        results,
      ] = await Promise.all([
        ProductRepository.update({
          id: product.id,
        }, {
          name: product.name,
          store: product.store,
        }),
      ]);

      verify(mockedPool.query(anyString(), anything())).once();
      results.should.deep.equal([product]);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('UPDATE "product" SET "name"=$1,"store_id"=$2 WHERE "id"=$3 RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        product.store,
        product.id,
      ]);
    });
    it('should return true if returnRecords=false', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const result = await ProductRepository.update({
        id: product.id,
      }, {
        name: product.name,
        store: product.store,
      }, {
        returnRecords: false,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      result.should.equal(true);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('UPDATE "product" SET "name"=$1,"store_id"=$2 WHERE "id"=$3');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.name,
        product.store,
        product.id,
      ]);
    });
  });
  describe('#destroy()', () => {
    it('should support call without constraints', async () => {
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );

      const result = await ProductRepository.destroy();
      should.exist(result);
      result.should.deep.equal(products);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('DELETE FROM "product" RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([]);
    });
    it('should support call constraints as a parameter', async () => {
      const store = {
        id: faker.random.uuid(),
        name: `store - ${faker.random.uuid()}`,
      };
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );

      const result = await ProductRepository.destroy({
        id: _.map(products, 'id'),
        store,
      });
      should.exist(result);
      result.should.deep.equal(products);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('DELETE FROM "product" WHERE "id"=ANY($1::TEXT[]) AND "store_id"=$2 RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        _.map(products, 'id'),
        store.id,
      ]);
    });
    it('should support call with chained where constraints', async () => {
      const store = {
        id: faker.random.uuid(),
        name: `store - ${faker.random.uuid()}`,
      };
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );
      const result = await ProductRepository.destroy().where({
        store: store.id,
      });
      should.exist(result);
      result.should.deep.equal(products);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('DELETE FROM "product" WHERE "store_id"=$1 RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([store.id]);
    });
    it('should support call with chained where constraints - Promise.all', async () => {
      const store = {
        id: faker.random.uuid(),
        name: `store - ${faker.random.uuid()}`,
      };
      const products = [{
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }, {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
      }];

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult(products),
      );
      const [
        result,
      ] = await Promise.all([
        ProductRepository.destroy().where({
          store: store.id,
        }),
      ]);
      should.exist(result);
      result.should.deep.equal(products);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('DELETE FROM "product" WHERE "store_id"=$1 RETURNING "id","name","serial_number" AS "serialNumber","alias_names" AS "aliases","store_id" AS "store"');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([store.id]);
    });
    it('should return true if returnRecords=false', async () => {
      const product = {
        id: faker.random.uuid(),
        name: `product - ${faker.random.uuid()}`,
        store: faker.random.number(),
      };

      when(mockedPool.query(anyString(), anything())).thenResolve(
        getQueryResult([product]),
      );

      const result = await ProductRepository.destroy({
        id: product.id,
      }, {
        returnRecords: false,
      });

      verify(mockedPool.query(anyString(), anything())).once();
      should.exist(result);
      result.should.equal(true);

      const [
        query,
        params,
      ] = capture(mockedPool.query).first();
      query.should.equal('DELETE FROM "product" WHERE "id"=$1');
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      params!.should.deep.equal([
        product.id,
      ]);
    });
  });
});