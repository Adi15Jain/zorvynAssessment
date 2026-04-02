const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

describe("Auth Routes", () => {
    let testUser = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
    };

    beforeAll(async () => {
        // cleanup before tests
        await prisma.user.deleteMany({ where: { email: testUser.email } });
    });

    test("POST /api/auth/register", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send(testUser);
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe(testUser.email);
    });

    test("POST /api/auth/login", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty("token");
    });
});
