import * as chai from 'chai';
import mongoose from 'mongoose';
import MongoSingleton from '../src/services/mongo.singleton.js';
import AdoptmeUsersService from '../src/services/adoptmeUsers.dao.mdb.js';

const connection = await MongoSingleton.getInstance();
const dao = new AdoptmeUsersService();
const expect = chai.expect;
let testUser = { firstName: 'Juan', lastName: 'Perez', email: 'jperez@gmail.com', password: 'abc445' };

describe('Test DAO Users', function () {
    // Se ejecuta ANTES de comenzar el paquete de tests
    before(function () {
        mongoose.connection.collections.adoptme_users.drop();
    });

    beforeEach(function () {
        this.timeout(5000);
    });

    it('getAllUsers() debe retornar un array de usuarios', async function () {
        const result = await dao.getAllUsers();
        expect(result).to.be.an('array');
    });

    it('addUser() debe retornar un objeto con los datos del nuevo usuario', async function () {
        const result = await dao.addUser(testUser);
        expect(result).to.be.an('object');
        expect(result._id).to.be.not.null;
        expect(result.carts).to.be.deep.equal([]);
        // Actualiza testUser con el ID generado por MongoDB
        testUser._id = result._id;
    });

    it('getUsersByID() debe retornar un objeto coincidente con el criterio indicado', async function () {
        const result = await dao.getUserById(testUser._id);
        expect(result).to.not.be.undefined; 
        expect(result).to.be.an('object');
        expect(result._id.toString()).to.equal(testUser._id.toString());
        expect(result.email).to.equal(testUser.email);
    });

    it('updateUser() debe retornar un objeto con los datos modificados', async function () {
        const modifiedMail = 'martin@martin.com';
        const result = await dao.updateUser(testUser._id, { email: modifiedMail });
        expect(result).to.be.an('object');
        expect(result._id).to.be.not.null;
        expect(result.email).to.be.equal(modifiedMail);
    });

    it('deleteUser() debe borrar definitivamente el documento indicado', async function () {
        const result = await dao.deleteUser(testUser._id);
        expect(result).to.be.an('object');
        expect(result._id.toString()).to.equal(testUser._id.toString());
    });
});

