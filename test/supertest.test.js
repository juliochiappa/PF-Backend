import * as chai from 'chai';
import supertest from 'supertest';

const expect = chai.expect;
const requester = supertest('http://localhost:8080');
const testUser = { firstName: 'Juan', lastName: 'Perez', email: 'jperez@gmail.com', password: 'abc445' };
let cookie = {};

describe('Test Integración Users', function () {
    let token;

before(async function() {
    const loginResult = await requester.post('/api/auth/jwtlogin')
        .send({ email: testUser.email, password: testUser.password });
    token = loginResult.body.token;
});


    it('POST /api/auth/register debe registrar un nuevo usuario', async function () {
        const { _body }  = await requester.post('/api/auth/register').send(testUser);

        expect(_body.err).to.be.undefined;
        expect(_body.payload).to.be.ok;
    });

    it('POST /api/auth/register NO debe volver a registrar el mismo mail', async function () {
        const { statusCode, _body }  = await requester.post('/api/auth/register').send(testUser);

        expect(statusCode).to.be.equals(400);
    });

    it('POST /api/auth/login debe ingresar correctamente al usuario', async function () {
        const result  = await requester.post('/api/auth/login').send(testUser);
        const cookieData = result.headers['set-cookie'][0];
        cookie = { name: cookieData.split('=')[0], value: cookieData.split('=')[1] };

        expect(cookieData).to.be.ok;
        expect(cookie.name).to.be.equals('connect.sid'); 
        expect(cookie.value).to.be.ok;
    });
    
    it('POST /api/auth/jwtlogin debe devolver un token JWT', async function () {
        const result = await requester.post('/api/auth/jwtlogin').send(testUser);
        expect(result.status).to.equal(200); 
        expect(result.body).to.have.property('token'); 
        expect(result.body.token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/); 
        
        token = result.body.token;
    });

    it('GET /api/auth/current debe retornar datos correctos de usuario', async function () {
        const result = await requester
            .get('/api/auth/current')
            .set('Authorization', `Bearer ${token}`); 
    
        expect(result.status).to.equal(200);
        expect(result.body).to.have.property('payload');
        expect(result.body.payload).to.have.property('firstName');
        expect(result.body.payload).to.have.property('lastName');
        expect(result.body.payload).to.have.property('role');
        expect(result.body.payload).to.have.property('email').and.to.be.eql(testUser.email); 
    });
    
});
