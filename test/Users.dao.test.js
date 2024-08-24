import Assert from 'assert';
import mongoose from 'mongoose';
import MongoSingleton from '../src/services/mongo.singleton.js';
import AdoptmeUsersService from '../src/services/adoptmeUsers.dao.mdb.js';


const connection  = await MongoSingleton.getInstance();
const dao = new AdoptmeUsersService();
const assert = Assert.strict;
const testUser = { firstName: 'Juan', lastName: 'Perez', email: 'jperez@gmail.com', password: 'abc445' };

describe('Test DAO Users', function () {
    let createdUser;
    
    // Se ejecuta ANTES de comenzar el paquete de tests
     before(async function () {
        mongoose.connection.collections.adoptme_users.drop();
    });
    // Se ejecuta ANTES DE CADA test
    beforeEach(function () {
        this.timeout(5000);
    });
    // Se ejecuta LUEGO de finalizar el paquete de tests
    after(function () {});
    // Se ejecuta LUEGO DE CADA test
    afterEach(function () {});

    it('getAllUsers() debe retornar un array de usuarios', async function () {
        const result = await dao.getAllUsers();
        assert.strictEqual(Array.isArray(result), true);
    });
    
    it('addUser() debe retornar un objeto con los datos del nuevo usuario', async function () {
        createdUser = await dao.addUser(testUser);
        assert.strictEqual(typeof createdUser, 'object');
        assert.ok(createdUser._id);
        assert.deepStrictEqual(createdUser.carts, []);
        // Asigna el _id del usuario recién creado al objeto testUser
        testUser._id = createdUser._id.toString();
    });
    
    it('getUserById() debe retornar un objeto coincidente con el criterio indicado', async function () {
        const result = await dao.getUserById(testUser._id);
        assert.ok(result, 'No se encontró un usuario con ese ID');
        assert.strictEqual(result._id.toString(), testUser._id);
        assert.strictEqual(result.email, testUser.email);
    });
    
    it('updateUser() debe retornar un objeto con los datos modificados', async function () {
        const modifiedMail = 'martin@martin.com';
        const result = await dao.updateUser({ _id: testUser._id }, { email: modifiedMail });
        assert.ok(result, 'No se pudo actualizar el usuario');
        assert.strictEqual(result.email, modifiedMail);
    });
    
    
    it('deleteUser() debe borrar definitivamente el documento indicado', async function () {
        const result = await dao.deleteUser(testUser._id);
        assert.ok(result, 'No se pudo eliminar el usuario');
        assert.strictEqual(result._id.toString(), testUser._id);
    });
});

