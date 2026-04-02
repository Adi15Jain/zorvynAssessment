const request = require("supertest");
const app = require("../app");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

describe("Record Routes", () => {
    let token;
    let userId;

    beforeAll(async () => {
        // Create an admin user for testing
        const res = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin Record Tester",
                email: "admin_record_tester@example.com",
                password: "password123"
            });
        
        await prisma.user.update({
            where: { email: "admin_record_tester@example.com" },
            data: { role: "ADMIN" }
        });

        const loginRes = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin_record_tester@example.com", password: "password123" });
        token = loginRes.body.data.token;
        userId = loginRes.body.data.user.id;
    });

    afterAll(async () => {
        await prisma.financialRecord.deleteMany({ where: { createdByUserId: userId } });
        await prisma.user.delete({ where: { id: userId } });
    });

    test("POST /api/records", async () => {
        const res = await request(app)
            .post("/api/records")
            .set("Authorization", `Bearer ${token}`)
            .send({
                type: "INCOME",
                category: "Salary",
                amount: 5000,
                date: new Date().toISOString(),
                notes: "Initial salary"
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(Number(res.body.data.amount)).toBe(5000);
    });

    test("GET /api/records", async () => {
        const res = await request(app)
            .get("/api/records")
            .set("Authorization", `Bearer ${token}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.records).toBeInstanceOf(Array);
        expect(res.body.data.records.length).toBeGreaterThan(0);
    });
});
