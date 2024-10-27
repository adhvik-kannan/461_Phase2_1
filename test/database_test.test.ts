
import { describe, test, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import {
    connectToMongoDB, disconnectMongoDB, addNewPackage, updatePackageVersion, 
    updatePackageScore, deleteDB, removePackageCollection, getAllPackages,
    getPackageByName, findPackagesByPartialName, Package
} from '../src/database_test';

// Correcting the mock to handle default export and necessary properties
vi.mock('mongoose', async (importOriginal) => {
    const actual = await importOriginal();
    return {
      ...actual.default,
      default: {
        ...actual.default,
        connect: vi.fn(),
        disconnect: vi.fn(),
        model: vi.fn((name, schema) => {
          return function (data) {
            Object.assign(this, data);
          };
        }),
        connection: {  // Move connection inside the default mock
          db: {
            dropDatabase: vi.fn(),  // Mock the dropDatabase method
          },
        },
      },
    };
  });

// Mocking Package collection drop
Package.collection = {
    drop: vi.fn(),  // Mock the collection.drop method
};

describe('connectToMongoDB', () => {
    test('should connect to MongoDB successfully', async () => {
        mongoose.connect.mockResolvedValueOnce('Connected');
        const response = await connectToMongoDB('testDatabase');
        expect(response[0]).toBe(true);
    });

    test('should fail to connect to MongoDB', async () => {
        mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));
        const response = await connectToMongoDB('testDatabase');
        expect(response[0]).toBe(false);
    });
});

describe('disconnectMongoDB', () => {
    test('should disconnect successfully', async () => {
        mongoose.disconnect.mockResolvedValueOnce('Disconnected');
        const response = await disconnectMongoDB();
        expect(response[0]).toBe(true);
    });

    test('should handle disconnection failure', async () => {
        mongoose.disconnect.mockRejectedValueOnce(new Error('Disconnection failed'));
        const response = await disconnectMongoDB();
        expect(response[0]).toBe(false);
    });
});

describe('addNewPackage', () => {
    test('should add new package successfully', async () => {
        const packageData = { name: 'NewPackage', url: 'http://newpackage.com', version: '1.0.0' };
        Package.prototype.save = vi.fn().mockResolvedValue(packageData);
        const response = await addNewPackage('NewPackage', 'http://newpackage.com', undefined, '1.0.0');
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packageData);
    });

    test('should handle add package error', async () => {
        Package.prototype.save = vi.fn().mockRejectedValue(new Error('Save failed'));
        const response = await addNewPackage('FailPackage', 'http://failpackage.com');
        expect(response[0]).toBe(false);
    });
});

describe('updatePackageVersion', () => {
    test('should update package version successfully', async () => {
        const packageDoc = { version: '1.0.0', prev_versions: [], save: vi.fn().mockResolvedValue(true) };
        Package.findOne = vi.fn().mockResolvedValue(packageDoc);
        const response = await updatePackageVersion('TestPackage', '1.0.1');
        expect(response[0]).toBe(true);
        expect(packageDoc.prev_versions).toContain('1.0.0');
    });

    test('should handle package not found error', async () => {
        Package.findOne = vi.fn().mockResolvedValue(null);
        const response = await updatePackageVersion('NonExistent', '2.0.0');
        expect(response[0]).toBe(false);
    });
});

describe('updatePackageScore', () => {
    test('should update package score successfully', async () => {
        const result = { modifiedCount: 1 };
        Package.updateOne = vi.fn().mockResolvedValue(result);
        const response = await updatePackageScore('TestPackage', '5.0');
        expect(response[0]).toBe(true);
    });

    test('should handle update score error', async () => {
        Package.updateOne = vi.fn().mockRejectedValue(new Error('Update failed'));
        const response = await updatePackageScore('FailPackage', '5.0');
        expect(response[0]).toBe(false);
    });
});

describe('deleteDB', () => {
    test('should delete the database successfully', async () => {
        mongoose.connection.db.dropDatabase.mockResolvedValueOnce(true);
        mongoose.disconnect.mockResolvedValueOnce(true);
        const response = await deleteDB();
        expect(response[0]).toBe(true);
    });

    test('should handle delete database error', async () => {
        mongoose.connection.db.dropDatabase.mockRejectedValueOnce(new Error('Drop failed'));
        const response = await deleteDB();
        expect(response[0]).toBe(false);
    });
});

describe('removePackageCollection', () => {
    test('should remove package collection successfully', async () => {
        Package.collection.drop.mockResolvedValueOnce(true);
        const response = await removePackageCollection();
        expect(response[0]).toBe(true);
    });

    test('should handle remove collection error', async () => {
        Package.collection.drop.mockRejectedValueOnce(new Error('Drop collection failed'));
        const response = await removePackageCollection();
        expect(response[0]).toBe(false);
    });
});

describe('getAllPackages', () => {
    test('should get all packages successfully', async () => {
        const packages = [{ name: 'Package1' }, { name: 'Package2' }];
        Package.find = vi.fn().mockResolvedValue(packages);
        const response = await getAllPackages();
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packages);
    });
});

describe('getPackageByName', () => {
    test('should get package by name successfully', async () => {
        const pkg = { name: 'TestPackage' };
        Package.findOne = vi.fn().mockResolvedValue(pkg);
        const response = await getPackageByName('TestPackage');
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(pkg);
    });
});

describe('findPackagesByPartialName', () => {
    test('should find packages by partial name', async () => {
        const packages = [{ name: 'pyplot' }, { name: 'python-lib' }];
        Package.find = vi.fn().mockResolvedValue(packages);
        const response = await findPackagesByPartialName('py');
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packages);
    });
});
