import mongoose from 'mongoose';

// Define a schema
/**
 * Schema for how entries are stored in the database for users
 */
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    accessLevel: Number
});

/**
 * Schema for how entries are stored in the database for packages
 */
const packageSchema = new mongoose.Schema({
    name: String,
    url: String,
    score: String,
    version: String,
    prev_versions: [String]
});

// const User = mongoose.model('User', userSchema); // This defines the "users" collection

/**
 * Package collection
 */
export const Package = mongoose.model('Package', packageSchema)

/**
 * Connect to MongoDB Cloud Database
 * @param database name of the database you want to create a connection to
 * @returns error on failure to connect
 */
export async function connectToMongoDB(database: string) {
    try {
        // Replace with your actual MongoDB URI
        const mongoURI = `mongodb+srv://askannan:IxnNnCuO0ICCZXGl@cluster0.9gpef.mongodb.net/${database}?retryWrites=true&w=majority&appName=Cluster0`;

        // Connect to the MongoDB cluster
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
        return [true, null];
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        return [false, error];
        // process.exit(1); // Exit process with failure
    }
}

/**
 * Disconnects from MongoDB Cloud Database
 * @returns error on failure to disconnect
 */
export async function disconnectMongoDB() {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        return [true, null];
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        return [false, error];
    }
}

// might want to make this just go update if it finds that a package with the same name is already present
/**
 * Add a new package to the database
 * @param name Package name
 * @param url Package url
 * @param score Optional score for package
 * @param version Optional version for package
 * @param previousVersion Optional previous versions for package
 * @returns savedPackage of the package saved or error if the package couldn't be stored
 */
export async function addNewPackage(name: String, url: String, score?: String, version?: String, previousVersion?: String) {
    const newPackage = new Package({
        name: name,
        url: url,
        score: score,
        version: version,
        previousVersions: previousVersion
    });

    try {
        const savedPackage = await newPackage.save();
        console.log('Package saved:', savedPackage);
        return [true, savedPackage];
    } catch (error) {
        console.error('Error saving package:', error);
        return [false, error];
    }
}

/**
 * Update the version of a given package
 * @param name Package name
 * @param newVersion New version of the package
 * @returns The updated package or an error
 */
export async function updatePackageVersion(name: string, newVersion: string) {
    try {
        // Find the package by name
        const packageDoc = await Package.findOne({ name });

        if (packageDoc) {
            // Push the current version to the previousVersions array
            if(packageDoc.version != null) {
                packageDoc.prev_versions.push(packageDoc.version);
            }

            // Set the new version
            packageDoc.version = newVersion;

            // Save the updated document
            const updatedPackage = await packageDoc.save();
            console.log('Package updated:', updatedPackage);
            return [true, updatedPackage];
        } else {
            console.log('Package not found');
            return [false, Error(`Package ${name} not found`)];
        }
    } catch (error) {
        console.error('Error updating package:', error);
        return [false, error];
    }
}

/**
 * Updates the score for a given package
 * @param name Package name
 * @param newScore New score for the package
 * @returns Updated package or error
 */
export async function updatePackageScore(name: string, newScore: string) {
    try {
        const result = await Package.updateOne(
            { name },
            { $set: { score: newScore } }
        );
        console.log('Update result:', result);
        return [true, result];
    } catch (error) {
        console.error('Error updating package:', error);
        return [false, error];
    }
}

/**
 * Deletes the connected database and then disconnects from Mongo
 * @returns error if it cannot delete a database
 */
export async function deleteDB() {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            console.error('No database found');
            return [false, Error('No database found')];
        }
        const success = await db.dropDatabase();
        console.log('Database deleted successfully');
        return [true, success];
    } catch (error) {
        console.error('Error deleting database:', error);
        return [false, error];
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

/**
 * Removes package collection from the database 
 * @returns error or nothing
 */
export async function removePackageCollection() {
    try {
        await Package.collection.drop();
        console.log('Package collection removed');
        return [true, null]
    } catch (error) {
        console.error('Error removing collection:', error);
        return [false, error];
    }
}

/**
 * Gets all the packages in the collection
 * @returns All packages or error
 */
export async function getAllPackages() {
    try {
        const users = await Package.find();
        console.log('All Users:', users);
        return [true, users];
    } catch (error) {
        console.error('Error fetching users:', error);
        return [false, error];
    }
}

/**
 * Gets a package for a given name
 * @param name Package name
 * @returns package struct or error
 */
export async function getPackageByName(name: string): Promise<[boolean, any | Error]>{
    try {
        const pkg = await Package.findOne({ name });
        if (pkg == null) {
            console.log('No package found with the name:', name);
            return [false, Error(`No package found with the name: ${name}`)];
        }
        console.log('User found:', pkg);
        return [true, pkg];
    } catch (error) {
        console.error('Error fetching user:', error);
        return [false, error];
    }
}

/**
 * Finds and gets all packages that have the partial name in their name
 * @param partialName Partial name to look for
 * @returns All packages with the partial name or error
 */
export async function findPackagesByPartialName(partialName: string) {
    try {
        // Use regex to find packages where the name contains the partial string (case-insensitive)
        const pkgs = await Package.find({ name: { $regex: partialName, $options: 'i' } });
        
        if (pkgs.length > 0) {
            console.log('Found packages:', pkgs);
        } else {
            console.log('No packages found with the partial name:', partialName);
        }
        return [true, pkgs]
    } catch (error) {
        console.error('Error fetching packages:', error);
        return [false, error];
    }
}

/**
 * Test function to check functionality
 */
async function run() {
    await connectToMongoDB('Packages');
    await addNewPackage('Example', 'http://example.com');
    await updatePackageScore('Example', 'test score: 75');
    await updatePackageVersion('Example', '1.0.0');
    await updatePackageVersion('Example', '1.0.1');
    await addNewPackage('python-lib', 'python-lib.com', '', '1.0.1');
    await addNewPackage('pyplot', 'pyplot.com');
    await getAllPackages();
    console.log();
    await getPackageByName('Example');
    const pkgs = await findPackagesByPartialName('py');
    console.log(pkgs);
    await disconnectMongoDB();
}

// run();

// UNCOMMENT LATER WHEN NEEDED

// async function addUser(name: String, email: String, password: String, accessLevel: Number) {
//     try {
//         const newUser = new User({
//             name: name,
//             email: email,
//             password: password,
//             accessLevel: accessLevel
//         });

//         const result = await newUser.save();
//         console.log('User added:', result);
//     } catch (error) {
//         console.error('Error adding user:', error);
//     }
// }

// async function removeUserByEmail(email: string) {
//     try {
//         const result = await User.deleteOne({ email });
//         console.log('User removed:', result);
//     } catch (error) {
//         console.error('Error removing user:', error);
//     }
// }

// // async function removeUsersByAge(age: number) {
// //     try {
// //         const result = await User.deleteMany({ age });
// //         console.log('Users removed:', result);
// //     } catch (error) {
// //         console.error('Error removing users:', error);
// //     }
// // }



// async function getAllUsers() {
//     try {
//         const users = await User.find();
//         console.log('All Users:', users);
//     } catch (error) {
//         console.error('Error fetching users:', error);
//     }
// }

// async function getUserByEmail(email: string) {
//     try {
//         const user = await User.findOne({ email });
//         console.log('User found:', user);
//     } catch (error) {
//         console.error('Error fetching user:', error);
//     }
// }




