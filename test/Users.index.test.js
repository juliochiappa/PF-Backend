import * as chai from 'chai';
import { createHash, isValidPassword } from '../src/services/utils.js';


const expect = chai.expect;
const testPassword = 'abc123';
const validBcryptFormat = /^\$2[aby]\$10\$.{53}$/;

describe('Tests Utils', function () {
    before(function () {});
    beforeEach(function () {});
    after(function () {});
    afterEach(function () {});
    
    // Lista de tests
    it('createHash() debe hashear correctamente la clave', function () {
        const result = createHash(testPassword);

        expect(result).to.match(validBcryptFormat);
    });

    it('passwordValidation() debe retornar true si coincide hash', function () {
        const hashed = createHash(testPassword); 
        const result = isValidPassword(testPassword, hashed); 
    
        expect(result).to.be.true;
    });
    

    it('passwordValidation() debe retornar false si no coincide hash', function () {
        let hashed = createHash(testPassword); 
        hashed = 'hash_invalido'; 
        const result = isValidPassword(hashed, testPassword);
    
        expect(result).to.be.false;
    });
    
});
