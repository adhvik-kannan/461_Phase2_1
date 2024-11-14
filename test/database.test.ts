
import { describe, test, beforeAll, afterAll, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import {
    addNewPackage, updatePackageVersion, updatePackageScore, removePackageCollection,
    getAllPackages, getPackage, findPackagesByPartialName, addUser, 
    removeUserByName, getAllUsers, getUserByHash, getUserByName, deleteUsersExcept, connectToMongoDB, disconnectMongoDB
} from '../src/database';

let dbConnection;
let Package;
let User;

// Mocking the database connection and models with constructors
beforeAll(async () => {
    // Mock database connection object
    dbConnection = { model: vi.fn() };

    // Mock Package and User constructors
    Package = vi.fn(function (data) {
        Object.assign(this, data);
    });
    User = vi.fn(function (data) {
        Object.assign(this, data);
    });

    // Define mock methods on Package and User prototypes
    Package.prototype.save = vi.fn();
    Package.find = vi.fn();
    Package.findOne = vi.fn();
    Package.updateOne = vi.fn();
    Package.collection = { drop: vi.fn() };

    User.prototype.save = vi.fn();
    User.find = vi.fn();
    User.findOne = vi.fn();
    User.deleteOne = vi.fn();
    User.deleteMany = vi.fn();
});

afterAll(async () => {
    // No real database connection to close, so we leave this empty
});

describe('Package Functions', () => {
    test('addNewPackage should add a package successfully', async () => {
        const packageData = { name: 'NewPackage', url: 'http://newpackage.com', version: '1.0.0' };
        Package.prototype.save.mockResolvedValue(packageData);
        const response = await addNewPackage('NewPackage', 'http://newpackage.com', Package, '1.0.0');
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packageData);
    });

    test('updatePackageVersion should update the package version', async () => {
        const packageDoc = { version: '1.0.0', prev_versions: [], save: vi.fn().mockResolvedValue(true) };
        Package.findOne.mockResolvedValue(packageDoc);
        const response = await updatePackageVersion('TestPackage', '1.0.1', Package);
        expect(response[0]).toBe(true);
        expect(packageDoc.prev_versions).toContain('1.0.0');
    });

    test('updatePackageScore should update the package score', async () => {
        Package.updateOne.mockResolvedValue({ modifiedCount: 1 });
        const response = await updatePackageScore('TestPackage', '5.0', Package);
        expect(response[0]).toBe(true);
    });

    test('removePackageCollection should remove package collection', async () => {
        Package.collection.drop.mockResolvedValue(true);
        const response = await removePackageCollection(Package);
        expect(response[0]).toBe(true);
    });

    test('getAllPackages should retrieve all packages', async () => {
        const packages = [{ name: 'Package1' }, { name: 'Package2' }];
        Package.find.mockResolvedValue(packages);
        const response = await getAllPackages(Package);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packages);
    });

    test('getPackage should find a package by name or ID', async () => {
        const pkg = { name: 'TestPackage' };
        Package.findOne.mockResolvedValue(pkg);
        const response = await getPackage('TestPackage', 'name', Package);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(pkg);
    });

    test('findPackagesByPartialName should find packages by partial name', async () => {
        const packages = [{ name: 'pyplot' }, { name: 'python-lib' }];
        Package.find.mockResolvedValue(packages);
        const response = await findPackagesByPartialName('py', Package);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(packages);
    });
});

describe('User Functions', () => {
    test('addUser should add a user successfully', async () => {
        const userData = { username: 'TestUser', userHash: 'testhash123', isAdmin: true };
        User.prototype.save.mockResolvedValue(userData);
        const response = await addUser('TestUser', 'testhash123', true, User);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(userData);
    });

    test('removeUserByName should remove a user by name', async () => {
        User.deleteOne.mockResolvedValue({ deletedCount: 1 });
        const response = await removeUserByName('TestUser', User);
        expect(response[0]).toBe(true);
    });

    test('getAllUsers should retrieve all users', async () => {
        const users = [{ username: 'User1' }, { username: 'User2' }];
        User.find.mockResolvedValue(users);
        const response = await getAllUsers(User);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(users);
    });

    test('getUserByHash should find a user by hash', async () => {
        const user = { userHash: 'testhash123', username: 'TestUser' };
        User.findOne.mockResolvedValue(user);
        const response = await getUserByHash('testhash123', User);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(user);
    });

    test('getUserByName should find a user by name', async () => {
        const user = { username: 'TestUser', userHash: 'testhash123' };
        User.findOne.mockResolvedValue(user);
        const response = await getUserByName('TestUser', User);
        expect(response[0]).toBe(true);
        expect(response[1]).toEqual(user);
    });

    test('deleteUsersExcept should delete all users except one', async () => {
        User.deleteMany.mockResolvedValue({ deletedCount: 5 });
        const response = await deleteUsersExcept(User);
        expect(response[0]).toBe(true);
        expect(response[1]).toContain('Deleted');
    });
});

describe('Database Connection Functions', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('connectToMongoDB should connect successfully', async () => {
        mongoose.createConnection = vi.fn().mockResolvedValueOnce({
            close: vi.fn().mockResolvedValueOnce(true)
        });
        const response = await connectToMongoDB('testDatabase');
        expect(response[0]).toBe(true);
        expect(mongoose.createConnection).toHaveBeenCalledWith(expect.stringContaining('testDatabase'));
    });

    test('disconnectMongoDB should disconnect successfully', async () => {
        const mockConnection = { close: vi.fn().mockResolvedValueOnce(true) };
        const response = await disconnectMongoDB(mockConnection as unknown as mongoose.Connection);
        expect(response[0]).toBe(true);
        expect(mockConnection.close).toHaveBeenCalled();
    });

    test('disconnectMongoDB should handle disconnection failure', async () => {
        const mockConnection = { close: vi.fn().mockRejectedValueOnce(new Error('Disconnection failed')) };
        const response = await disconnectMongoDB(mockConnection as unknown as mongoose.Connection);
        expect(response[0]).toBe(false);
        expect(response[1]).toBeInstanceOf(Error);
        expect(response[1].message).toBe('Disconnection failed');
        expect(mockConnection.close).toHaveBeenCalled();
    });
});

describe('Error Conditions for Database Operation Functions', () => {

    test('addNewPackage should handle error on save failure', async () => {
        const errorMessage = 'Save failed';
        Package.prototype.save.mockRejectedValueOnce(new Error(errorMessage));
        const response = await addNewPackage('FailPackage', 'http://failpackage.com', Package);
        expect(response[0]).toBe(false);
        expect(response[1]).toBeInstanceOf(Error);
        expect(response[1].message).toBe(errorMessage);
    });

    test('updatePackageVersion should handle error if package not found', async () => {
        Package.findOne.mockResolvedValueOnce(null);
        const response = await updatePackageVersion('NonExistentPackage', '1.0.1', Package);
        expect(response[0]).toBe(false);
    });

    test('updatePackageVersion should handle error on save failure', async () => {
        const packageDoc = { version: '1.0.0', prev_versions: [], save: vi.fn().mockRejectedValueOnce(new Error('Save failed')) };
        Package.findOne.mockResolvedValueOnce(packageDoc);
        const response = await updatePackageVersion('TestPackage', '1.0.1', Package);
        expect(response[0]).toBe(false);
    });

    test('updatePackageScore should handle error if package not found', async () => {
        Package.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
        const response = await updatePackageScore('NonExistentPackage', '5.0', Package);
        expect(response[0]).toBe(false);
    });

    test('updatePackageScore should handle error during update operation', async () => {
        Package.updateOne.mockRejectedValueOnce(new Error('Update failed'));
        const response = await updatePackageScore('FailPackage', '5.0', Package);
        expect(response[0]).toBe(false);
    });

    test('removePackageCollection should handle error on drop failure', async () => {
        Package.collection.drop.mockRejectedValueOnce(new Error('Drop failed'));
        const response = await removePackageCollection(Package);
        expect(response[0]).toBe(false);
    });

    test('getAllPackages should handle error on retrieval failure', async () => {
        Package.find.mockRejectedValueOnce(new Error('Retrieval failed'));
        const response = await getAllPackages(Package);
        expect(response[0]).toBe(false);
    });

    test('getPackageByName should handle error when searching by name', async () => {
        Package.findOne.mockRejectedValueOnce(new Error('Search failed'));
        const response = await getPackage('FailPackage', 'name', Package);
        expect(response[0]).toBe(false);
    });

    test('findPackagesByPartialName should handle error during search operation', async () => {
        Package.find.mockRejectedValueOnce(new Error('Search failed'));
        const response = await findPackagesByPartialName('partial', Package);
        expect(response[0]).toBe(false);
    });

    test('addUser should handle error on user save failure', async () => {
        User.prototype.save.mockRejectedValueOnce(new Error('Save failed'));
        const response = await addUser('FailUser', 'userhash', true, User);
        expect(response[0]).toBe(false);
    });

    test('removeUserByName should handle error on delete failure', async () => {
        User.deleteOne.mockRejectedValueOnce(new Error('Delete failed'));
        const response = await removeUserByName('FailUser', User);
        expect(response[0]).toBe(false);
    });

    test('getAllUsers should handle error on retrieval failure', async () => {
        User.find.mockRejectedValueOnce(new Error('Retrieval failed'));
        const response = await getAllUsers(User);
        expect(response[0]).toBe(false);
    });

    test('getUserByHash should handle error when searching by hash', async () => {
        User.findOne.mockRejectedValueOnce(new Error('Search failed'));
        const response = await getUserByHash('userhash', User);
        expect(response[0]).toBe(false);
    });

    test('getUserByName should handle error when searching by name', async () => {
        User.findOne.mockRejectedValueOnce(new Error('Search failed'));
        const response = await getUserByName('username', User);
        expect(response[0]).toBe(false);
    });

    test('deleteUsersExcept should handle error during delete operation', async () => {
        User.deleteMany.mockRejectedValueOnce(new Error('Delete failed'));
        const response = await deleteUsersExcept(User);
        expect(response[0]).toBe(false);
    });

});
