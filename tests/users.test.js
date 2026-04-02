const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

describe("Users Routes", () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Create an admin user for testing
        await request(app).post("/api/auth/register").send({
            name: "Users Tester Admin",
            email: "users_admin@example.com",
            password: "password123"
        });

        await prisma.user.update({
            where: { email: "users_admin@example.com" },
            data: { role: "ADMIN" }
        });

        const loginRes = await request(app).post("/api/auth/login").send({ 
            email: "users_admin@example.com", 
            password: "password123" 
        });
        token = loginRes.body.data.token;
        userId = loginRes.body.data.user.id;
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { id: userId } });
    });

    test("GET /api/users", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeInstanceOf(Array);
    });
});
